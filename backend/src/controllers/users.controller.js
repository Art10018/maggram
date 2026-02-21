import prisma from "../prisma.js";
import bcrypt from "bcrypt";

// ==========================
// GET USER BY ID
// GET /api/users/:id
// ВАЖНО: фронт ждёт ПРЯМО user object (не { user: ... })
// + фронт ждёт profile._count.posts/followers/following
// ==========================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ отдаём ПРЯМО объект user
    return res.json(user);
  } catch (e) {
    console.error("getUserById error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// GET USER POSTS
// GET /api/users/:id/posts
// ВАЖНО: фронт ждёт ПРЯМО массив постов (не { posts: [...] })
// У тебя в Prisma: Post.images (PostImage[])
// ==========================
export const getUserPostsById = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user?.id || null; // optionalAuth.middleware.js кладёт req.user

    const posts = await prisma.post.findMany({
      where: { authorId: id },
      include: {
        images: true, // ✅ по схеме
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        // Чтобы посчитать likedByMe (только если есть viewerId)
        likes: viewerId
          ? {
              where: { userId: viewerId },
              select: { id: true },
              take: 1,
            }
          : false,
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = posts.map((p) => {
      const likedByMe = viewerId ? (p.likes?.length || 0) > 0 : false;
      // убираем "likes" массив из ответа, он фронту не нужен
      // eslint-disable-next-line no-unused-vars
      const { likes, ...rest } = p;
      return { ...rest, likedByMe };
    });

    // ✅ отдаём ПРЯМО массив
    return res.json(mapped);
  } catch (e) {
    console.error("getUserPostsById error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};



// ==========================
// GET USER FOLLOWERS
// GET /api/users/:id/followers
// ==========================
export const getUserFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user?.id || null;

    const follows = await prisma.follow.findMany({
      where: { followingId: id },
      orderBy: { createdAt: "desc" },
      include: {
        follower: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    const ids = follows.map((f) => f.follower?.id).filter(Boolean);
    let followedByMe = new Set();

    if (viewerId && ids.length > 0) {
      const mine = await prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: ids } },
        select: { followingId: true },
      });
      followedByMe = new Set(mine.map((x) => x.followingId));
    }

    return res.json(
      follows
        .map((f) => f.follower)
        .filter(Boolean)
        .map((u) => ({
          ...u,
          followedByMe: viewerId ? followedByMe.has(u.id) : false,
        }))
    );
  } catch (e) {
    console.error("getUserFollowers error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// GET USER FOLLOWING
// GET /api/users/:id/following
// ==========================
export const getUserFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user?.id || null;

    const follows = await prisma.follow.findMany({
      where: { followerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        following: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    const ids = follows.map((f) => f.following?.id).filter(Boolean);
    let followedByMe = new Set();

    if (viewerId && ids.length > 0) {
      const mine = await prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: ids } },
        select: { followingId: true },
      });
      followedByMe = new Set(mine.map((x) => x.followingId));
    }

    return res.json(
      follows
        .map((f) => f.following)
        .filter(Boolean)
        .map((u) => ({
          ...u,
          followedByMe: viewerId ? followedByMe.has(u.id) : false,
        }))
    );
  } catch (e) {
    console.error("getUserFollowing error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// UPDATE MY PROFILE
// PATCH /api/users/me/profile
// Settings.jsx умеет принять и {user} и прям объект — отдаём прям объект
// ==========================
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { displayName, bio } = req.body || {};

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: displayName ?? null,
        bio: bio ?? null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    return res.json(user);
  } catch (e) {
    console.error("updateMyProfile error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// UPDATE MY CREDENTIALS
// PATCH /api/users/me/credentials
// ==========================
export const updateMyCredentials = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { username, email, currentPassword } = req.body || {};
    if (!currentPassword) {
      return res.status(400).json({ error: "currentPassword is required" });
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!existing) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(currentPassword, existing.password);
    if (!ok) return res.status(401).json({ error: "Wrong password" });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username ? { username } : {}),
        ...(email ? { email } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    return res.json(user);
  } catch (e) {
    if (String(e?.code) === "P2002") {
      return res.status(400).json({ error: "Username or email already taken" });
    }
    console.error("updateMyCredentials error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

// ==========================
// UPLOAD MY AVATAR
// POST /api/users/me/avatar
// ==========================
export const uploadMyAvatar = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!req.file) return res.status(400).json({ error: "No file" });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        github: true,
        location: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    // Settings.jsx поддерживает avatarUrl и user
    return res.json({ avatarUrl, ...user });
  } catch (e) {
    console.error("uploadMyAvatar error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};
