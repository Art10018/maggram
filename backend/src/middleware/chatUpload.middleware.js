// backend/src/middleware/chatUpload.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
const chatsDir = path.join(uploadsDir, "chats");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir);

function safeBaseName(name = "file") {
  const base = path.basename(name).replace(/\s+/g, " ").trim();
  // разрешим только простые символы, чтобы не было проблем на Windows
  const cleaned = base.replace(/[^a-zA-Z0-9._ -]/g, "_");
  return cleaned.slice(0, 120) || "file";
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, chatsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 10);
    const base = safeBaseName(path.basename(file.originalname || "file", ext));
    const uid = req.user?.id || "anon";
    cb(null, `chat_${uid}_${Date.now()}_${Math.random().toString(16).slice(2)}_${base}${ext}`);
  },
});

export const chatUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB на файл
}).array("files", 10);
