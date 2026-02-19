import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../prisma.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// 10 минут
const CODE_TTL_MS = 10 * 60 * 1000;

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function gen6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code) {
  // простой sha256, чтобы не хранить код в базе открытым текстом
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function normalizeLoginIdentifier(s = "") {
  return String(s).trim();
}

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const u = String(username || "").trim();
    const em = String(email || "").trim().toLowerCase();
    const p = String(password || "");

    if (!u || !em || !p) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // если уже есть реальный пользователь — не даём регаться
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: em }, { username: u }] },
      select: { id: true },
    });
    if (existingUser) {
      return res.status(409).json({ error: "Username or email already taken" });
    }

    // ВАЖНО: pending не должен блокировать повторную регистрацию
    // просто удаляем старый pending по email/username
    await prisma.pendingUser.deleteMany({
      where: { OR: [{ email: em }, { username: u }] },
    });

    const passwordHash = await bcrypt.hash(p, 10);
    const code = gen6();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    const pending = await prisma.pendingUser.create({
      data: {
        username: u,
        email: em,
        passwordHash,
        codeHash,
        expiresAt,
      },
      select: { id: true, email: true },
    });

    // отправляем письмо
    await sendVerificationEmail(em, code);

    return res.json({
      pendingId: pending.id,
      email: pending.email,
    });
  } catch (e) {
    console.error("register error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { pendingId, email, code } = req.body || {};

    const c = String(code || "").trim();
    if (!c) return res.status(400).json({ error: "Missing code" });

    // ищем pending либо по pendingId, либо по email (на всякий)
    const pending = await prisma.pendingUser.findFirst({
      where: pendingId
        ? { id: String(pendingId) }
        : { email: String(email || "").trim().toLowerCase() },
    });

    if (!pending) {
      return res.status(400).json({ error: "Invalid code" });
    }

    if (pending.expiresAt && pending.expiresAt.getTime() < Date.now()) {
      // истёк — удаляем pending
      await prisma.pendingUser.delete({ where: { id: pending.id } }).catch(() => {});
      return res.status(400).json({ error: "Code expired" });
    }

    const incomingHash = hashCode(c);
    if (incomingHash !== pending.codeHash) {
      return res.status(400).json({ error: "Invalid code" });
    }

    // Перед созданием user ещё раз проверим, что никто не занял
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: pending.email }, { username: pending.username }] },
      select: { id: true },
    });
    if (exists) {
      // pending уже не актуален
      await prisma.pendingUser.delete({ where: { id: pending.id } }).catch(() => {});
      return res.status(409).json({ error: "Username or email already taken" });
    }

    const user = await prisma.user.create({
      data: {
        username: pending.username,
        email: pending.email,
        password: pending.passwordHash, // у тебя в проекте поле пароля часто называется password
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // удаляем pending
    await prisma.pendingUser.delete({ where: { id: pending.id } }).catch(() => {});

    const token = signToken(user);

    return res.json({
      token,
      user,
    });
  } catch (e) {
    console.error("verifyEmail error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

export const resendEmail = async (req, res) => {
  try {
    const { pendingId, email } = req.body || {};
    const pending = await prisma.pendingUser.findFirst({
      where: pendingId
        ? { id: String(pendingId) }
        : { email: String(email || "").trim().toLowerCase() },
    });

    if (!pending) {
      return res.status(400).json({ error: "No pending registration" });
    }

    // новый код, перезаписываем
    const code = gen6();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await prisma.pendingUser.update({
      where: { id: pending.id },
      data: { codeHash, expiresAt },
    });

    await sendVerificationEmail(pending.email, code);

    return res.json({ ok: true });
  } catch (e) {
    console.error("resendEmail error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    const idf = normalizeLoginIdentifier(identifier);
    const p = String(password || "");

    if (!idf || !p) return res.status(400).json({ error: "Missing fields" });

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: idf.toLowerCase() }, { username: idf }],
      },
    });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // ВАЖНО: старые аккаунты пускаем как есть (даже если isEmailVerified=false)
    // Новые аккаунты у нас создаются ТОЛЬКО после verify, поэтому тут блокировать нечего.
    const ok = await bcrypt.compare(p, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    return res.json({ token, user });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
