import prisma from "../prisma.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcrypt";

// ---------- avatar upload ----------
const avatarDir = path.join(process.cwd(), "uploads", "avatars");
fs.mkdirSync(avatarDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) return cb(new Error("Only images"));
    cb(null, true);
  },
});

// GET /api/users/me
export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (e) {
    console.error("me error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// PATCH /api/users/me
export const updateMe = async (req, res) => {
  try {
    const data = {};
    const fields = ["displayName", "bio", "website", "github", "location", "isPrivate"];
    for (const f of fields) {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
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
      },
    });

    return res.json(user);
  } catch (e) {
    console.error("updateMe error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users/me/avatar
export const uploadMyAvatar = [
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file" });

      // удаляем старый файл, если был локальный /uploads/avatars/...
      const prev = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { avatarUrl: true },
      });

      if (prev?.avatarUrl?.startsWith("/uploads/avatars/")) {
        const prevPath = path.join(process.cwd(), prev.avatarUrl.replace(/^\//, ""));
        if (fs.existsSync(prevPath)) fs.unlinkSync(prevPath);
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl },
        select: { id: true, avatarUrl: true },
      });

      return res.json(user);
    } catch (e) {
      console.error("uploadMyAvatar error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  },
];

// PATCH /api/users/me/credentials
export const updateCredentials = async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;

    // если меняем что-то критичное — требуем currentPassword
    if ((username || email || newPassword) && !currentPassword) {
      return res.status(400).json({ error: "currentPassword required" });
    }

    const meUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true },
    });

    if ((username || email || newPassword) && meUser) {
      const ok = await bcrypt.compare(currentPassword, meUser.password);
      if (!ok) return res.status(400).json({ error: "Wrong password" });
    }

    const data = {};
    if (username) data.username = username;
    if (email) data.email = email;
    if (newPassword) data.password = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, username: true, email: true },
    });

    return res.json(updated);
  } catch (e) {
    console.error("updateCredentials error:", e);
    // уникальность username/email
    return res.status(400).json({ error: "User already exists or invalid data" });
  }
};
