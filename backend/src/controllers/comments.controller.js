import prisma from "../prisma.js";

// GET /api/comments/:postId
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            displayName: true,
          },
        },
      },
    });

    return res.json(comments);
  } catch (e) {
    console.error("getPostComments error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/comments/:postId
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    const created = await prisma.comment.create({
      data: {
        text: String(text).trim(),
        postId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            displayName: true,
          },
        },
      },
    });

    return res.json(created);
  } catch (e) {
    console.error("createComment error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
