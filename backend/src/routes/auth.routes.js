import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

// если у тебя контроллер me есть — оставь, если нет — удали эту строку
router.get("/me", authMiddleware, me);

export default router;
