import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getPostComments,
  createComment,
} from "../controllers/comments.controller.js";

const router = Router();

router.get("/:postId", getPostComments);
router.post("/:postId", authMiddleware, createComment);

export default router;
