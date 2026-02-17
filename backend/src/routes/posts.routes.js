import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import optionalAuth from "../middleware/optionalAuth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { getAllPosts, getMyPosts, createPost } from "../controllers/posts.controller.js";

const router = Router();

// ✅ глобальная лента (все посты)
router.get("/", optionalAuth, getAllPosts);

// ✅ мои посты
router.get("/me", authMiddleware, getMyPosts);

// ✅ создать пост (multipart + images[])
router.post("/", authMiddleware, upload.array("images", 10), createPost);

export default router;
