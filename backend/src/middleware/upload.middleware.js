import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
const avatarsDir = path.join(uploadsDir, "avatars");
const postsDir = path.join(uploadsDir, "posts");
const chatsDir = path.join(uploadsDir, "chats");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir);
if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir);
if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir);

const safeExt = (originalName = "") => {
  const ext = path.extname(originalName || "").toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : ".png";
};

const imageFileFilter = (_, file, cb) => {
  const ok = ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new Error("Only png/jpg/webp allowed"), ok);
};

// ===== AVATAR =====
const avatarStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = safeExt(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("avatar");

// ===== POST IMAGES =====
const postStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, postsDir),
  filename: (req, file, cb) => {
    const ext = safeExt(file.originalname);
    cb(null, `post_${req.user?.id || "anon"}_${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`);
  },
});

export const upload = multer({
  storage: postStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ===== CHAT FILES (ANY) =====
function sanitizeName(name = "file") {
  return name
    .replace(/[^\p{L}\p{N}._\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "file";
}

const chatStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, chatsDir),
  filename: (req, file, cb) => {
    const base = sanitizeName(path.basename(file.originalname, path.extname(file.originalname)));
    const ext = path.extname(file.originalname || "").toLowerCase().slice(0, 12);
    cb(null, `chat_${req.user?.id || "anon"}_${Date.now()}_${Math.random().toString(16).slice(2)}_${base}${ext}`);
  },
});

export const uploadChatFiles = multer({
  storage: chatStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB на файл
    files: 10,
  },
}).array("files", 10);
