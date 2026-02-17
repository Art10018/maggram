import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  me,
  updateMe,
  uploadMyAvatar,
  updateCredentials,
} from "../controllers/users.controller.js";

const router = Router();

// текущий пользователь
router.get("/me", authMiddleware, me);

// обновление профиля (displayName, bio, website, github, location, isPrivate)
router.patch("/me", authMiddleware, updateMe);

// загрузка аватарки
router.post("/me/avatar", authMiddleware, uploadMyAvatar);

// смена username/email (и опционально password)
router.patch("/me/credentials", authMiddleware, updateCredentials);

export default router;
