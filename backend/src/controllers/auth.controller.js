import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";
const CODE_TTL_MIN = 10;

function makeToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "30d" });
}

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function register(req, res) {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, password are required" });
    }

    // уже существующий юзер (любой: старый/новый)
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });
    if (existingUser) return res.status(409).json({ error: "Username or email already taken" });

    // pending тоже проверяем
    const existingPending = await prisma.pendingRegistration.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });
    if (existingPending) {
      // чтобы не блокировало навсегда — обновим pending (перезапишем)
      await prisma.pendingEmailVerificationCode.deleteMany({ where: { pendingId: existingPending.id } });
      await prisma.pendingRegistration.delete({ where: { id: existingPending.id } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const pending = await prisma.pendingRegistration.create({
      data: { username, email, passwordHash },
      select: { id: true, email: true },
    });

    const code = genCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000);

    await prisma.pendingEmailVerificationCode.create({
      data: { pendingId: pending.id, code, expiresAt },
    });

    await sendVerificationEmail(email, code);

    // ВАЖНО: тут больше нет token/user — потому что юзера ещё нет
    return res.json({ ok: true, email: pending.email });
  } catch (e) {
    console.error("register error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function resendEmail(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email is required" });

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (!pending) return res.status(404).json({ error: "No pending registration for this email" });

    // чистим старые коды
    await prisma.pendingEmailVerificationCode.deleteMany({ where: { pendingId: pending.id } });

    const code = genCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000);

    await prisma.pendingEmailVerificationCode.create({
      data: { pendingId: pending.id, code, expiresAt },
    });

    await sendVerificationEmail(email, code);

    return res.json({ ok: true });
  } catch (e) {
    console.error("resendEmail error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) return res.status(400).json({ error: "email and code are required" });

    const pending = await prisma.pendingRegistration.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, passwordHash: true },
    });
    if (!pending) return res.status(400).json({ error: "Invalid code" });

    const record = await prisma.pendingEmailVerificationCode.findFirst({
      where: { pendingId: pending.id, code: String(code) },
      orderBy: { createdAt: "desc" },
      select: { id: true, expiresAt: true },
    });

    if (!record) return res.status(400).json({ error: "Invalid code" });
    if (record.expiresAt.getTime() < Date.now()) return res.status(400).json({ error: "Code expired" });

    // создаём реального юзера
    const user = await prisma.user.create({
      data: {
        username: pending.username,
        email: pending.email,
        passwordHash: pending.passwordHash,
        // если у тебя поле называется иначе — поменяй тут строку
        isEmailVerified: true,
      },
      select: { id: true, username: true, email: true, avatarUrl: true, isEmailVerified: true },
    });

    // чистим pending
    await prisma.pendingEmailVerificationCode.deleteMany({ where: { pendingId: pending.id } });
    await prisma.pendingRegistration.delete({ where: { id: pending.id } });

    const token = makeToken(user);
    return res.json({ token, user });
  } catch (e) {
    console.error("verifyEmail error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { login: loginValue, password } = req.body || {};
    if (!loginValue || !password) return res.status(400).json({ error: "login and password are required" });

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: loginValue }, { username: loginValue }] },
    });

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    // ✅ ВАЖНО: старые аккаунты должны заходить без верификации.
    // Блокируем ТОЛЬКО тех, у кого есть запись EmailVerificationCode (то есть уже "новый" поток)
    // (старые пользователи обычно не имеют этой записи)
    if (!user.isEmailVerified) {
      const hasCodeRow = await prisma.emailVerificationCode.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });

      if (hasCodeRow) {
        return res.status(403).json({ error: "Email not verified" });
      }
    }

    const token = makeToken(user);
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
    };

    return res.json({ token, user: safeUser });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
