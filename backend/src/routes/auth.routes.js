import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  register,
  login,
  me,
  verifyEmail,
  resendEmailCode,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

// email verify
router.post("/verify-email", verifyEmail);
router.post("/resend-email-code", resendEmailCode);

// если у тебя контроллер me есть — оставляем
router.get("/me", authMiddleware, me);

export default router;
