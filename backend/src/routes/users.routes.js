// backend/routes/users.routes.js
import { Router } from "express";
import optionalAuth from "../middleware/optionalAuth.middleware.js";
import { getUserById, getUserPostsById } from "../controllers/users.controller.js";

const router = Router();

// профиль
router.get("/:id", getUserById);

// посты пользователя (с фотками + likedByMe)
router.get("/:id/posts", optionalAuth, getUserPostsById);

export default router;
