import { Router } from "express";
import optionalAuth from "../middleware/optionalAuth.middleware.js";
import { search } from "../controllers/search.controller.js";

const router = Router();

router.get("/", optionalAuth, search);

export default router;
