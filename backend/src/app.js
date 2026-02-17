import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import postsRoutes from "./routes/posts.routes.js";
import usersRoutes from "./routes/users.routes.js";
import followsRoutes from "./routes/follows.routes.js";
import likesRoutes from "./routes/likes.routes.js";
import commentsRoutes from "./routes/comments.routes.js";
import feedRoutes from "./routes/feed.routes.js";
import requestsRoutes from "./routes/requests.routes.js";
import chatsRoutes from "./routes/chats.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// статические файлы
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/follows", followsRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/requests", requestsRoutes);

// ✅ чаты
app.use("/api/chats", chatsRoutes);

export default app;
