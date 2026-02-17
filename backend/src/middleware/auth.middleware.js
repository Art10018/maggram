import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid auth header" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ чтобы контроллеры могли делать req.user.id
    req.user = { id: decoded.id };

    // ✅ на будущее тоже полезно
    req.userId = decoded.id;

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
