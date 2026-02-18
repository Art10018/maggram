import prisma from "../prisma.js";
import bcrypt from "bcrypt";

// ==========================
// GET USER BY ID
// ==========================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (e) {
    console.error("getUserById error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// GET USER POSTS
// ==========================
export const getUserPostsById = async (req, res) => {
  try {
    const { id } = req.params;

    const posts = await prisma.post.findMany({
      where: { authorId: id },
      include: {
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ posts });
  } catch (e) {
    console.error("getUserPostsById error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// UPDATE MY PROFILE
// ==========================
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

    return res.json({ user });
  } catch (e) {
    console.error("updateMyProfile error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// UPDATE MY CREDENTIALS
// ==========================
export const updateMyCredentials = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { username, email, currentPassword } = req.body || {};
    if (!currentPassword)
      return res.status(400).json({ error: "currentPassword is required" });

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
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

    return res.json({ user });
  } catch (e) {
    if (String(e?.code) === "P2002") {
      return res
        .status(400)
        .json({ error: "Username or email already taken" });
    }

    console.error("updateMyCredentials error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// UPLOAD MY AVATAR
// ==========================
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

    return res.json({ user, avatarUrl });
  } catch (e) {
    console.error("uploadMyAvatar error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
