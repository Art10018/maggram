import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

function make6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function issueEmailCode(userId) {
  const code = make6DigitCode();

  await prisma.emailVerificationCode.deleteMany({
    where: { userId },
  });

  await prisma.emailVerificationCode.create({
    data: {
      userId,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 минут
    },
  });

  return code;
}

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, password are required" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hash,
        // isEmailVerified: false (default в prisma)
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // создаём и отправляем код
    try {
      const code = await issueEmailCode(user.id);
      await sendVerificationEmail(user.email, code);
    } catch (e) {
      // не валим регистрацию, но логируем
      console.error("send verification email error:", e);
    }

    // ✅ сразу выдаём токен + user (как было)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, user });
  } catch (e) {
    return res.status(400).json({ error: "User already exists or invalid data" });
  }
};

export const login = async (req, res) => {
  // у тебя фронт шлёт { login: "...", password: "..." }
  // а старый код принимал { email, password } и использовал email как login
  // делаем совместимость:
  const loginValue = req.body.login ?? req.body.email;
  const { password } = req.body;

  if (!loginValue || !password) {
    return res.status(400).json({ error: "login (email/username) and password are required" });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: loginValue }, { username: loginValue }],
    },
  });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  // ✅ запрещаем логин, если email не подтвержден
  if (user.isEmailVerified === false) {
    return res.status(403).json({ error: "Email not verified" });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      website: user.website,
      github: user.github,
      location: user.location,
      isPrivate: user.isPrivate,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    },
  });
};

export const me = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (e) {
    console.error("me error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const record = await prisma.emailVerificationCode.findFirst({
      where: { userId: user.id, code: String(code) },
      orderBy: { createdAt: "desc" },
    });

    if (!record) return res.status(400).json({ error: "Invalid code" });
    if (record.expiresAt < new Date()) return res.status(400).json({ error: "Code expired" });

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await prisma.emailVerificationCode.deleteMany({
      where: { userId: user.id },
    });

    return res.json({ success: true });
  } catch (e) {
    console.error("verifyEmail error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

export const resendEmailCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.isEmailVerified) {
      return res.json({ success: true, message: "Already verified" });
    }

    const code = await issueEmailCode(user.id);
    await sendVerificationEmail(user.email, code);

    return res.json({ success: true });
  } catch (e) {
    console.error("resendEmailCode error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
