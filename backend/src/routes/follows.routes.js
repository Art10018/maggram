import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getFollowStatus, toggleFollow } from "../controllers/follows.controller.js";

const router = Router();

router.get("/status/:targetId", authMiddleware, getFollowStatus);
router.post("/:targetId", authMiddleware, toggleFollow);

export default router;
