import prisma from "../prisma.js";

// helper: собираем urls из файлов
function filesToUrls(files = []) {
  return (files || [])
    .filter(Boolean)
    .map((f) => `/uploads/posts/${f.filename}`);
}

// ✅ ВСЕ посты (глобальная лента)
export const getAllPosts = async (req, res) => {
  try {
    const viewerId = req.user?.id || null;

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        images: { select: { id: true, url: true } },
        likes: viewerId
          ? { where: { userId: viewerId }, select: { id: true } }
          : { select: { id: true }, take: 0 },
        _count: { select: { likes: true, comments: true } },
      },
    });

    const mapped = posts.map((p) => ({
      ...p,
      likedByMe: viewerId ? p.likes.length > 0 : false,
      likes: undefined,
    }));

    return res.json(mapped);
  } catch (e) {
    console.error("getAllPosts error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ МОИ посты
export const getMyPosts = async (req, res) => {
  try {
    const viewerId = req.user.id;

    const posts = await prisma.post.findMany({
      where: { authorId: viewerId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
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
  } catch (e) {
    console.error("getMyPosts error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ СОЗДАТЬ ПОСТ (multipart: language + code + images[])
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;

    const language = (req.body?.language || "").trim();
    const code = (req.body?.code ?? "").toString();

    const urls = filesToUrls(req.files);

    if (!language) return res.status(400).json({ error: "language is required" });
    if (!code.trim() && urls.length === 0) {
      return res.status(400).json({ error: "code or images are required" });
    }

    const post = await prisma.post.create({
      data: {
        language,
        code,
        authorId: userId,
        images: {
          create: urls.map((url) => ({ url })),
        },
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        images: { select: { id: true, url: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return res.json({ ...post, likedByMe: false });
  } catch (e) {
    console.error("createPost error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
