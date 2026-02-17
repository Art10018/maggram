// backend/controllers/users.controller.js
import prisma from "../prisma.js";

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: false,
        createdAt: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (e) {
    console.error("getUserById error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/users/:id/posts
export const getUserPostsById = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const viewerId = req.user?.id || null;

    const userExists = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!userExists) return res.status(404).json({ error: "User not found" });

    const posts = await prisma.post.findMany({
      where: { authorId: targetId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },

        // ✅ ВОТ ЭТО ТЕБЕ НУЖНО, ИНАЧЕ ФОТКИ НЕ ПРИДУТ
        // Если Prisma ругнётся — замени "images" на фактическое имя поля/связи
        images: true,

        // likedByMe
        likes: viewerId
          ? { where: { userId: viewerId }, select: { id: true } }
          : { select: { id: true }, take: 0 },

        _count: { select: { likes: true, comments: true } },
      },
    });

    const mapped = posts.map((p) => ({
      ...p,
      likedByMe: viewerId ? p.likes.length > 0 : false,
      likes: undefined, // не палим массив
    }));

    return res.json(mapped);
  } catch (e) {
    console.error("getUserPostsById error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
