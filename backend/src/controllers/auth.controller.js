// backend/src/controllers/auth.controller.js
import prisma from "../prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/sendEmail.js";

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ id: userId }, secret, { expiresIn: "30d" });
}

function make6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getEnforceAfterDate() {
  const raw = process.env.EMAIL_VERIFICATION_ENFORCED_AFTER;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 1) если уже есть настоящий User — запрещаем
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 2) чистим старые PendingUser по email/username (чтобы можно было перерегаться)
    await prisma.pendingUser.deleteMany({
      where: { OR: [{ email }, { username }] },
    });

    // 3) создаём новый PendingUser
    const code = make6DigitCode();
    const passwordHash = await bcrypt.hash(password, 10);
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    await prisma.pendingUser.create({
      data: {
        username,
        email,
        passwordHash,
        codeHash,
        expiresAt,
      },
    });

    // 4) отправляем письмо
    await sendVerificationEmail(email, code);

    return res.status(200).json({
      message: "Verification code sent",
      email,
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/auth/verify-email
export async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const pending = await prisma.pendingUser.findUnique({
      where: { email },
    });

    if (!pending) {
      return res.status(400).json({ message: "No pending signup" });
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await prisma.pendingUser.delete({ where: { email } });
      return res.status(400).json({ message: "Code expired" });
    }

    const ok = await bcrypt.compare(String(code), pending.codeHash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid code" });
    }

    // создаём реального User только тут
    const user = await prisma.user.create({
      data: {
        username: pending.username,
        email: pending.email,
        password: pending.passwordHash, // у тебя поле password в User — хеш
        isEmailVerified: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isEmailVerified: true,
        createdAt: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
      },
    });

    await prisma.pendingUser.delete({ where: { email } });

    const token = signToken(user.id);

    return res.status(200).json({
      token,
      user,
    });
  } catch (err) {
    console.error("verifyEmail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/auth/resend-email
export async function resendEmail(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Missing fields" });

    const pending = await prisma.pendingUser.findUnique({ where: { email } });
    if (!pending) {
      return res.status(400).json({ message: "No pending signup" });
    }

    const code = make6DigitCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingUser.update({
      where: { email },
      data: { codeHash, expiresAt },
    });

    await sendVerificationEmail(email, code);

    return res.status(200).json({ message: "Verification code resent", email });
  } catch (err) {
    console.error("resendEmail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { username, email, login, password } = req.body || {};
    const identifier = String(login || email || username || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Правило: после даты EMAIL_VERIFICATION_ENFORCED_AFTER — требуем verified
    // До этой даты (старые акки) — пускаем даже если isEmailVerified=false
    const enforceAfter = getEnforceAfterDate();
    if (!user.isEmailVerified) {
      if (!enforceAfter) {
        // если не задано — лучше НЕ блокировать, чем убить логины
      } else if (user.createdAt.getTime() >= enforceAfter.getTime()) {
        return res.status(403).json({ message: "Email not verified" });
      }
    }

    const passRaw = String(password);
    const looksHashed = typeof user.password === "string" && user.password.startsWith("$2");

    let ok = false;
    if (looksHashed) {
      ok = await bcrypt.compare(passRaw, user.password);
    } else {
      // Legacy fallback for old plaintext records. Rehash on successful login.
      ok = user.password === passRaw;
      if (ok) {
        const passwordHash = await bcrypt.hash(passRaw, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: passwordHash },
        });
      }
    }

    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user.id);

    // не отдаём password
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      website: user.website,
      github: user.github,
      location: user.location,
      isPrivate: user.isPrivate,
    };

    return res.status(200).json({ token, user: safeUser });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
