import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
const avatarsDir = path.join(uploadsDir, "avatars");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir);

function safeBaseName(name = "file") {
  const base = path.basename(name).replace(/\s+/g, " ").trim();
  const cleaned = base.replace(/[^a-zA-Z0-9._ -]/g, "_");
  return cleaned.slice(0, 120) || "file";
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 10);
    const base = safeBaseName(path.basename(file.originalname || "avatar", ext));
    const uid = req.user?.id || "anon";
    cb(null, `avatar_${uid}_${Date.now()}_${Math.random().toString(16).slice(2)}_${base}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("avatar");
