import prisma from "../prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/sendEmail.js";

function makeCode() {
  // 6 цифр
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

/**
 * POST /api/auth/register
 * body: { username, email, password }
 *
 * ВАЖНО: НЕ создаём User.
 * Создаём PendingUser, шлём код.
 */
export async function register(req, res) {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const normEmail = String(email).trim().toLowerCase();
    const normUsername = String(username).trim();

    // 1) если уже есть реальный пользователь — нельзя
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normEmail }, { username: normUsername }],
      },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // 2) если есть pending — обновляем (чтобы можно было “перерегать”)
    const passwordHash = await bcrypt.hash(password, 10);
    const code = makeCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingUser.upsert({
      where: { email: normEmail },
      create: {
        username: normUsername,
        email: normEmail,
        passwordHash,
        codeHash,
        expiresAt,
      },
      update: {
        username: normUsername,
        passwordHash,
        codeHash,
        expiresAt,
      },
    });

    await sendVerificationEmail(normEmail, code);

    return res.json({
      message: "Verification code sent",
      email: normEmail,
    });
  } catch (e) {
    console.error("register error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/auth/verify-email
 * body: { email, code }
 *
 * Создаём User ТОЛЬКО ТУТ.
 * Старые аккаунты не трогаем.
 */
export async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const normEmail = String(email).trim().toLowerCase();
    const normCode = String(code).trim();

    const pending = await prisma.pendingUser.findUnique({
      where: { email: normEmail },
    });

    if (!pending) {
      return res.status(400).json({ message: "Invalid code" });
    }

    if (pending.expiresAt && pending.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Code expired" });
    }

    const ok = await bcrypt.compare(normCode, pending.codeHash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid code" });
    }

    // на всякий случай ещё раз проверим конфликт перед созданием
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: pending.email }, { username: pending.username }] },
      select: { id: true },
    });
    if (existingUser) {
      // Если вдруг User уже появился — чистим pending
      await prisma.pendingUser.delete({ where: { email: pending.email } });
      return res.status(409).json({ message: "User already exists" });
    }

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
        displayName: true,
        avatarUrl: true,
        bio: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
        createdAt: true,
        isEmailVerified: true,
      },
    });

    await prisma.pendingUser.delete({ where: { email: pending.email } });

    const token = signToken(user.id);
    return res.json({ token, user });
  } catch (e) {
    console.error("verifyEmail error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/auth/resend-email
 * body: { email }
 */
export async function resendEmail(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Missing fields" });

    const normEmail = String(email).trim().toLowerCase();

    const pending = await prisma.pendingUser.findUnique({
      where: { email: normEmail },
      select: { email: true },
    });

    if (!pending) {
      // чтобы не палить существование аккаунтов — отвечаем одинаково
      return res.json({ message: "Verification code sent" });
    }

    const code = makeCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingUser.update({
      where: { email: normEmail },
      data: { codeHash, expiresAt },
    });

    await sendVerificationEmail(normEmail, code);

    return res.json({ message: "Verification code sent" });
  } catch (e) {
    console.error("resendEmail error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/auth/login
 * body: { login, password }  (как у тебя во фронте)
 *
 * СТАРЫЕ АККАУНТЫ ПУСКАЕМ ВСЕГДА.
 * Никакой блокировки по isEmailVerified тут нет.
 */
export async function login(req, res) {
  try {
    const { login, password } = req.body || {};
    if (!login || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const ident = String(login).trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: ident.toLowerCase() }, { username: ident }],
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user.id);

    // отдаём минимум, чтобы фронт не ломался
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      website: user.website,
      github: user.github,
      location: user.location,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt,
      isEmailVerified: user.isEmailVerified,
    };

    return res.json({ token, user: safeUser });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}