import { Router } from "express";
import auth from "../middleware/auth.middleware.js";
import optionalAuth from "../middleware/optionalAuth.middleware.js";
import { getFeed } from "../controllers/feed.controller.js";

const router = Router();

// для "forYou/popular" можно optional, но если токен есть — будет персонализация
router.get("/", optionalAuth, getFeed);

export default router;
