import prisma from "../prisma.js";

export const toggleLike = async (req, res) => {
  const userId = req.user.id;     // у тебя middleware уже ставит req.user
  const postId = req.params.postId;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) return res.status(404).json({ error: "Post not found" });

    const existing = await prisma.postLike.findUnique({
      where: {
        postId_userId: { postId, userId }, // ✅ по @@unique([postId, userId])
      },
      select: { id: true },
    });

    let liked;
    if (existing) {
      await prisma.postLike.delete({
        where: { postId_userId: { postId, userId } },
      });
      liked = false;
    } else {
      await prisma.postLike.create({
        data: { postId, userId },
      });
      liked = true;
    }

    const likesCount = await prisma.postLike.count({ where: { postId } });

    return res.json({ liked, likesCount });
  } catch (e) {
    console.error("toggleLike error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
