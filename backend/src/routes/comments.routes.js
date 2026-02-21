import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getPostComments,
  createComment,
  updateMyComment,
  deleteMyComment,
} from "../controllers/comments.controller.js";

const router = Router();

router.get("/:postId", getPostComments);
router.post("/:postId", authMiddleware, createComment);
router.patch("/item/:id", authMiddleware, updateMyComment);
router.delete("/item/:id", authMiddleware, deleteMyComment);

export default router;
