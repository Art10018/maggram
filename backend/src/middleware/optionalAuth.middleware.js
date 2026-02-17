import jwt from "jsonwebtoken";

export default function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id };
  } catch {
    // токен битый — считаем как будто неавторизован
    req.user = null;
  }

  next();
}
