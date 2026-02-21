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

// PATCH /api/comments/item/:id
export const updateMyComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = req.params.id;
    const text = (req.body?.text ?? "").toString().trim();

    if (!text) return res.status(400).json({ error: "text is required" });

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.authorId !== userId) return res.status(403).json({ error: "No access" });

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { text },
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

    return res.json(updated);
  } catch (e) {
    console.error("updateMyComment error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/comments/item/:id
export const deleteMyComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = req.params.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.authorId !== userId) return res.status(403).json({ error: "No access" });

    await prisma.comment.delete({ where: { id: commentId } });
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteMyComment error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
