import prisma from "../prisma.js";

function extractTags(text = "") {
  const m = (text || "").toLowerCase().match(/#[\p{L}\p{N}_]{2,30}/gu);
  return m ? m : [];
}

function hoursSince(d) {
  const ms = Date.now() - new Date(d).getTime();
  return ms / (1000 * 60 * 60);
}

export const getFeed = async (req, res) => {
  try {
    const viewerId = req.user?.id || null;
    const modeRaw = (req.query?.mode || "forYou").toString();
    const mode = ["forYou", "popular", "following"].includes(modeRaw) ? modeRaw : "forYou";

    // ===== FOLLOWING (подписки + я) =====
    if (mode === "following") {
      if (!viewerId) return res.status(401).json({ error: "No token" });

      const following = await prisma.follow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      });

      const ids = following.map((f) => f.followingId);
      if (!ids.includes(viewerId)) ids.push(viewerId);

      const posts = await prisma.post.findMany({
        where: { authorId: { in: ids } },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
          images: { select: { id: true, url: true } },
          likes: { where: { userId: viewerId }, select: { id: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });

      const mapped = posts.map((p) => ({
        ...p,
        likedByMe: p.likes.length > 0,
        likes: undefined,
      }));

      return res.json(mapped);
    }

    // ===== POPULAR (тренды за короткий промежуток) =====
    if (mode === "popular") {
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const posts = await prisma.post.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" }, // дальше досортируем по score
        include: {
          author: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
          images: { select: { id: true, url: true } },
          likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : { select: { id: true }, take: 0 },
          _count: { select: { likes: true, comments: true } },
        },
        take: 200,
      });

      const scored = posts.map((p) => {
        const ageH = Math.max(0.25, hoursSince(p.createdAt));
        const likes = p._count?.likes ?? 0;
        // time-decay: лайки важны, но свежесть тоже
        const score = likes / Math.pow(ageH + 2, 1.35);
        return { p, score };
      });

      scored.sort((a, b) => b.score - a.score);

      const mapped = scored.map(({ p }) => ({
        ...p,
        likedByMe: viewerId ? p.likes.length > 0 : false,
        likes: undefined,
      }));

      return res.json(mapped);
    }

    // ===== FOR YOU (рекомендации по хештегам) =====
    // если не авторизован — просто свежие
    if (!viewerId) {
      const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
          images: { select: { id: true, url: true } },
          _count: { select: { likes: true, comments: true } },
        },
        take: 80,
      });

      return res.json(
        posts.map((p) => ({ ...p, likedByMe: false }))
      );
    }

    // 1) берём последние лайкнутые посты пользователя
    const myLikes = await prisma.postLike.findMany({
      where: { userId: viewerId },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        post: { select: { id: true, code: true } },
      },
    });

    const tagFreq = new Map();
    for (const l of myLikes) {
      const tags = extractTags(l.post?.code || "");
      for (const t of tags) tagFreq.set(t, (tagFreq.get(t) || 0) + 1);
    }

    const topTags = Array.from(tagFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);

    // 2) кандидаты: последние посты (можно расширять)
    const candidates = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
        images: { select: { id: true, url: true } },
        likes: { where: { userId: viewerId }, select: { id: true } },
        _count: { select: { likes: true, comments: true } },
      },
      take: 200,
    });

    // 3) scoring по пересечению тегов + чуть-чуть свежести
    const scored = candidates.map((p) => {
      const tags = extractTags(p.code || "");
      let match = 0;
      for (const t of tags) if (tagFreq.has(t)) match += (tagFreq.get(t) || 1);

      const ageH = Math.max(0.25, hoursSince(p.createdAt));
      const likes = p._count?.likes ?? 0;

      // если есть хештеги — поднимаем, плюс лёгкий бонус за активность/свежесть
      const score = match * 3 + likes / Math.pow(ageH + 2, 1.6) + 1 / (ageH + 1);

      return { p, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const mapped = scored.slice(0, 120).map(({ p }) => ({
      ...p,
      likedByMe: p.likes.length > 0,
      likes: undefined,
    }));

    // если у человека вообще нет лайков/тегов — просто свежие
    if (topTags.length === 0) {
      return res.json(
        candidates.slice(0, 80).map((p) => ({
          ...p,
          likedByMe: p.likes.length > 0,
          likes: undefined,
        }))
      );
    }

    return res.json(mapped);
  } catch (e) {
    console.error("getFeed error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
