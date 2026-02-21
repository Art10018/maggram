// backend/src/routes/chats.routes.js
import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { chatUpload } from "../middleware/chatUpload.middleware.js";
import {
  getMyChats,
  getOrCreateWithUser,
  getMessages,
  sendMessage,
  updateMyMessage,
  deleteMyMessage,
  downloadAttachment,
  attachmentMeta,
} from "../controllers/chats.controller.js";

const router = Router();

// список моих чатов
router.get("/", authMiddleware, getMyChats);

// открыть/создать 1:1 (совместимо с твоим Profile.jsx -> /chats/direct/:id)
router.post("/direct/:userId", authMiddleware, getOrCreateWithUser);

// сообщения
router.get("/:id/messages", authMiddleware, getMessages);
router.post("/:id/messages", authMiddleware, chatUpload, sendMessage);
router.patch("/messages/:id", authMiddleware, updateMyMessage);
router.delete("/messages/:id", authMiddleware, deleteMyMessage);

// вложения
router.get("/attachments/:id/meta", authMiddleware, attachmentMeta);
router.get("/attachments/:id/download", authMiddleware, downloadAttachment);

export default router;
