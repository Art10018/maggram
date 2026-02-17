import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { toggleLike } from "../controllers/likes.controller.js";

const router = Router();

router.post("/:postId", authMiddleware, toggleLike);

export default router;
