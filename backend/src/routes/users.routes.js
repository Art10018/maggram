import { Router } from "express";
import optionalAuth from "../middleware/optionalAuth.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { avatarUpload } from "../middleware/avatarUpload.middleware.js";

import {
  getUserById,
  getUserPostsById,
  getUserFollowers,
  getUserFollowing,
  updateMyProfile,
  updateMyCredentials,
  uploadMyAvatar,
} from "../controllers/users.controller.js";

const router = Router();

// ✅ Я (нужен token)
router.patch("/me/profile", authMiddleware, updateMyProfile);
router.patch("/me/credentials", authMiddleware, updateMyCredentials);
router.post("/me/avatar", authMiddleware, avatarUpload, uploadMyAvatar);

// профиль
router.get("/:id", getUserById);

// посты пользователя (с фотками + likedByMe)
router.get("/:id/posts", optionalAuth, getUserPostsById);
router.get("/:id/followers", optionalAuth, getUserFollowers);
router.get("/:id/following", optionalAuth, getUserFollowing);

export default router;
