import prisma from "../prisma.js";

/**
 * GET /api/search?q=...
 * Поиск по людям (username, displayName) и постам (code).
 * optionalAuth: если есть token — в постах вернём likedByMe.
 */
export const search = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const viewerId = req.user?.id || null;

    if (!q || q.length < 2) {
      return res.json({ users: [], posts: [] });
    }

    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          _count: { select: { posts: true, followers: true, following: true } },
        },
        take: 20,
      }),

      prisma.post.findMany({
        where: {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { language: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          images: { select: { id: true, url: true } },
          _count: { select: { likes: true, comments: true } },
          ...(viewerId
            ? { likes: { where: { userId: viewerId }, select: { id: true } } }
            : {}),
        },
      }),
    ]);

    const postsMapped = posts.map((p) => ({
      id: p.id,
      language: p.language,
      code: p.code,
      createdAt: p.createdAt,
      authorId: p.author.id,
      author: p.author,
      images: p.images,
      _count: p._count,
      likedByMe: viewerId ? (p.likes?.length > 0) : false,
    }));

    return res.json({ users, posts: postsMapped });
  } catch (e) {
    console.error("search error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
