import { Router } from "express";
import { login, register, verifyEmail, resendEmail } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-email", resendEmail);

export default router;