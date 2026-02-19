import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { prisma } from "../prisma.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const CODE_TTL_MINUTES = 10;

function signToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function makeCode() {
  // 6 цифр
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function register(req, res) {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const u = String(username).trim().toLowerCase();
    const em = String(email).trim().toLowerCase();
    const p = String(password);

    // уже есть настоящий юзер? тогда всё, нельзя
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username: u }, { email: em }] },
      select: { id: true },
    });
    if (existingUser) return res.status(409).json({ error: "User already exists" });

    // уже есть pending? тогда перезапишем и отправим новый код
    const code = makeCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    const passwordHash = await bcrypt.hash(p, 10);
    const codeHash = hashCode(code);

    const pending = await prisma.pendingUser.upsert({
      where: { email: em },
      update: {
        username: u,
        passwordHash,
        codeHash,
        expiresAt,
      },
      create: {
        username: u,
        email: em,
        passwordHash,
        codeHash,
        expiresAt,
      },
      select: { id: true, email: true },
    });

    await sendVerificationEmail(em, code);

    // ✅ НЕ логиним и НЕ создаём User
    return res.json({ pendingId: pending.id, email: pending.email });
  } catch (e) {
    console.error("register error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function resendEmail(req, res) {
  try {
    const { pendingId, email } = req.body || {};
    if (!pendingId && !email) return res.status(400).json({ error: "Missing fields" });

    const where = pendingId
      ? { id: String(pendingId) }
      : { email: String(email).trim().toLowerCase() };

    const p = await prisma.pendingUser.findUnique({ where });
    if (!p) return res.status(404).json({ error: "Pending user not found" });

    const code = makeCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    await prisma.pendingUser.update({
      where: { id: p.id },
      data: { codeHash: hashCode(code), expiresAt },
    });

    await sendVerificationEmail(p.email, code);

    return res.json({ ok: true });
  } catch (e) {
    console.error("resendEmail error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { pendingId, email, code } = req.body || {};
    if ((!pendingId && !email) || !code) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const where = pendingId
      ? { id: String(pendingId) }
      : { email: String(email).trim().toLowerCase() };

    const pending = await prisma.pendingUser.findUnique({ where });
    if (!pending) return res.status(400).json({ error: "Invalid code" });

    if (pending.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "Code expired" });
    }

    if (hashCode(String(code).trim()) !== pending.codeHash) {
      return res.status(400).json({ error: "Invalid code" });
    }

    // ✅ создаём реального юзера только теперь
    const user = await prisma.user.create({
      data: {
        username: pending.username,
        email: pending.email,
        password: pending.passwordHash,
        isEmailVerified: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        displayName: true,
        bio: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    await prisma.pendingUser.delete({ where: { id: pending.id } });

    const token = signToken(user);
    return res.json({ token, user });
  } catch (e) {
    console.error("verifyEmail error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function login(req, res) {
  try {
    // поддержим оба формата (чтобы фронт не ломался)
    const body = req.body || {};
    const password = body.password ? String(body.password) : "";

    const loginValue =
      body.login || body.email || body.username || body.identifier || "";

    const ident = String(loginValue).trim().toLowerCase();
    if (!ident || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: ident }, { username: ident }] },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        isEmailVerified: true,
        avatarUrl: true,
        displayName: true,
        bio: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    // ✅ если старые юзеры — мы их уже SQL-ом сделали verified=true
    if (user.isEmailVerified === false) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const token = signToken(user);
    const { password: _pw, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}