// backend/controllers/users.controller.js
import prisma from "../prisma.js";

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: false,
        createdAt: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (e) {
    console.error("getUserById error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/users/:id/posts
export const getUserPostsById = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const viewerId = req.user?.id || null;

    const userExists = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!userExists) return res.status(404).json({ error: "User not found" });

    const posts = await prisma.post.findMany({
      where: { authorId: targetId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },

        // ✅ ВОТ ЭТО ТЕБЕ НУЖНО, ИНАЧЕ ФОТКИ НЕ ПРИДУТ
        // Если Prisma ругнётся — замени "images" на фактическое имя поля/связи
        images: true,

        // likedByMe
        likes: viewerId
          ? { where: { userId: viewerId }, select: { id: true } }
          : { select: { id: true }, take: 0 },

        _count: { select: { likes: true, comments: true } },
      },
    });

    const mapped = posts.map((p) => ({
      ...p,
      likedByMe: viewerId ? p.likes.length > 0 : false,
      likes: undefined, // не палим массив
    }));

    return res.json(mapped);
  } catch (e) {
    console.error("getUserPostsById error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
import bcrypt from "bcrypt";

// PATCH /api/users/me/profile
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { displayName, bio } = req.body || {};

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: displayName ?? null,
        bio: bio ?? null,
      },
      select: {
        id: true, username: true, email: true,
        displayName: true, bio: true, avatarUrl: true,
        website: true, github: true, location: true,
        isPrivate: true, createdAt: true,
      },
    });

    return res.json({ user });
  } catch (e) {
    console.error("updateMyProfile error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// PATCH /api/users/me/credentials
export const updateMyCredentials = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { username, email, currentPassword } = req.body || {};
    if (!currentPassword) return res.status(400).json({ error: "currentPassword is required" });

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!existing) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(currentPassword, existing.password);
    if (!ok) return res.status(401).json({ error: "Wrong password" });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username ? { username } : {}),
        ...(email ? { email } : {}),
      },
      select: {
        id: true, username: true, email: true,
        displayName: true, bio: true, avatarUrl: true,
        website: true, github: true, location: true,
        isPrivate: true, createdAt: true,
      },
    });

    return res.json({ user });
  } catch (e) {
    // Prisma unique constraint → username/email заняты
    if (String(e?.code || "").includes("P2002")) {
      return res.status(400).json({ error: "Username or email already taken" });
    }
    console.error("updateMyCredentials error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users/me/avatar
export const uploadMyAvatar = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!req.file) return res.status(400).json({ error: "No file" });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true, username: true, email: true,
        displayName: true, bio: true, avatarUrl: true,
        website: true, github: true, location: true,
        isPrivate: true, createdAt: true,
      },
    });

    return res.json({ user });
  } catch (e) {
    console.error("uploadMyAvatar error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
