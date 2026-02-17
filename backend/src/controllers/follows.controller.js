import prisma from "../prisma.js";

// GET /api/follows/status/:targetId
export const getFollowStatus = async (req, res) => {
  const viewerId = req.user.id;
  const { targetId } = req.params;

  if (viewerId === targetId) return res.json({ status: "self" });

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
    select: { id: true },
  });

  if (follow) return res.json({ status: "following" });

  const request = await prisma.followRequest.findUnique({
    where: { requesterId_targetId: { requesterId: viewerId, targetId } },
    select: { id: true },
  });

  if (request) return res.json({ status: "requested" });

  return res.json({ status: "none" });
};

// POST /api/follows/:targetId  (toggle: follow/unfollow или request)
export const toggleFollow = async (req, res) => {
  const viewerId = req.user.id;
  const { targetId } = req.params;

  if (viewerId === targetId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, isPrivate: true },
  });
  if (!target) return res.status(404).json({ error: "User not found" });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
    select: { id: true },
  });

  // если уже подписан — отписка
  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
    });
    return res.json({ status: "none" });
  }

  // если профиль приватный — создаём request
  if (target.isPrivate) {
    await prisma.followRequest.upsert({
      where: { requesterId_targetId: { requesterId: viewerId, targetId } },
      update: {},
      create: { requesterId: viewerId, targetId },
    });
    return res.json({ status: "requested" });
  }

  // публичный — подписываем
  await prisma.follow.create({
    data: { followerId: viewerId, followingId: targetId },
  });

  return res.json({ status: "following" });
};
