import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, password are required" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hash },
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
        createdAt: true,
      },
    });

    // ✅ сразу выдаём токен + user (удобно для фронта)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({ token, user });
  } catch (e) {
    // уникальные username/email → Prisma кинет ошибку
    return res.status(400).json({ error: "User already exists or invalid data" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body; // email = "login" (email или username)

  if (!email || !password) {
    return res.status(400).json({ error: "email/username and password are required" });
  }

  // ✅ логин по email ИЛИ username
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username: email }],
    },
  });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

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
