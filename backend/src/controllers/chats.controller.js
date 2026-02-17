// backend/src/controllers/chats.controller.js
import fs from "fs";
import path from "path";
import prisma from "../prisma.js";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

// url хранится как "/uploads/chats/...."
function buildAbsoluteUploadPath(url) {
  const rel = String(url || "").replace(/^\/uploads\//, "");
  return path.join(UPLOADS_ROOT, rel);
}

// чистим все вложения, у которых истёк deleteAfter
async function cleanupExpired() {
  const now = new Date();

  const expired = await prisma.messageAttachment.findMany({
    where: {
      deleteAfter: { lt: now },
    },
    select: { id: true, url: true },
  });

  for (const a of expired) {
    try {
      const abs = buildAbsoluteUploadPath(a.url);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {}
  }

  if (expired.length) {
    // удаляем download-логи и сами attachment-ы
    await prisma.attachmentDownload.deleteMany({
      where: { attachmentId: { in: expired.map((x) => x.id) } },
    });

    await prisma.messageAttachment.deleteMany({
      where: { id: { in: expired.map((x) => x.id) } },
    });
  }
}

// GET /api/chats
export const getMyChats = async (req, res) => {
  try {
    await cleanupExpired();
    const meId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: meId } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    // подтягиваем lastMessage отдельно (без полей updatedAt/lastMessageId в схеме)
    const convoIds = conversations.map((c) => c.id);

    const lastMessages = await Promise.all(
      convoIds.map(async (cid) => {
        const m = await prisma.message.findFirst({
          where: { conversationId: cid },
          orderBy: { createdAt: "desc" },
          include: {
            sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            attachments: { select: { id: true, originalName: true, url: true, mimeType: true, size: true } },
          },
        });
        return [cid, m];
      })
    );

    const lastMap = new Map(lastMessages);

    const mapped = conversations.map((c) => {
      const others = c.participants.filter((p) => p.userId !== meId).map((p) => p.user);
      const peer = others[0] || null;

      const lm = lastMap.get(c.id) || null;

      return {
        id: c.id,
        createdAt: c.createdAt,
        peer,
        participants: c.participants.map((p) => ({
          id: p.user.id,
          username: p.user.username,
          displayName: p.user.displayName,
          avatarUrl: p.user.avatarUrl,
        })),
        lastMessage: lm
          ? {
              id: lm.id,
              text: lm.text,
              createdAt: lm.createdAt,
              senderId: lm.senderId,
              senderName: lm.sender?.displayName || lm.sender?.username || "",
              attachments: (lm.attachments || []).map((a) => ({
                id: a.id,
                fileName: a.originalName,
                url: a.url,
                mime: a.mimeType,
                size: a.size,
              })),
            }
          : null,
      };
    });

    // сортировка по lastMessage.createdAt если есть, иначе по createdAt диалога
    mapped.sort((a, b) => {
      const ad = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const bd = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return bd - ad;
    });

    res.json(mapped);
  } catch (e) {
    console.error("getMyChats error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/chats/direct/:userId (get-or-create 1:1)
export const getOrCreateWithUser = async (req, res) => {
  try {
    await cleanupExpired();
    const meId = req.user.id;
    const otherId = req.params.userId;

    if (!otherId) return res.status(400).json({ error: "No userId" });
    if (otherId === meId) return res.status(400).json({ error: "Can't chat with yourself" });

    const other = await prisma.user.findUnique({
      where: { id: otherId },
      select: { id: true },
    });
    if (!other) return res.status(404).json({ error: "User not found" });

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: meId } } },
          { participants: { some: { userId: otherId } } },
        ],
      },
      select: { id: true },
    });

    if (existing) return res.json(existing);

    const created = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: meId }, { userId: otherId }],
        },
      },
      select: { id: true },
    });

    res.json(created);
  } catch (e) {
    console.error("getOrCreateWithUser error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/chats/:id/messages
export const getMessages = async (req, res) => {
  try {
    await cleanupExpired();
    const meId = req.user.id;
    const chatId = req.params.id;

    const limit = Math.min(50, Math.max(10, Number(req.query.limit || 30)));
    const cursor = req.query.cursor ? String(req.query.cursor) : null;

    const membership = await prisma.conversationParticipant.findFirst({
      where: { conversationId: chatId, userId: meId },
      select: { id: true },
    });
    if (!membership) return res.status(403).json({ error: "No access" });

    const messages = await prisma.message.findMany({
      where: { conversationId: chatId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        attachments: { select: { id: true, originalName: true, url: true, mimeType: true, size: true, createdAt: true } },
      },
    });

    const hasMore = messages.length > limit;
    const slice = hasMore ? messages.slice(0, limit) : messages;

    res.json({
      items: slice.reverse().map((m) => ({
        ...m,
        attachments: (m.attachments || []).map((a) => ({
          id: a.id,
          fileName: a.originalName,
          url: a.url,
          mime: a.mimeType,
          size: a.size,
          createdAt: a.createdAt,
        })),
      })),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    });
  } catch (e) {
    console.error("getMessages error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/chats/:id/messages (multipart: text + files[])
export const sendMessage = async (req, res) => {
  try {
    await cleanupExpired();
    const meId = req.user.id;
    const chatId = req.params.id;

    const membership = await prisma.conversationParticipant.findFirst({
      where: { conversationId: chatId, userId: meId },
      select: { id: true },
    });
    if (!membership) return res.status(403).json({ error: "No access" });

    const text = (req.body?.text ?? "").toString();
    const files = Array.isArray(req.files) ? req.files : [];

    if (!text.trim() && files.length === 0) {
      return res.status(400).json({ error: "text or files required" });
    }

    const attachmentsData = files.map((f) => ({
      url: `/uploads/chats/${f.filename}`,
      originalName: f.originalname || f.filename,
      mimeType: f.mimetype || "application/octet-stream",
      size: f.size || 0,
    }));

    const msg = await prisma.message.create({
      data: {
        conversationId: chatId,
        senderId: meId,
        text: text.trim() ? text : null,
        attachments: attachmentsData.length ? { create: attachmentsData } : undefined,
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        attachments: { select: { id: true, originalName: true, url: true, mimeType: true, size: true, createdAt: true } },
      },
    });

    res.json({
      ...msg,
      attachments: (msg.attachments || []).map((a) => ({
        id: a.id,
        fileName: a.originalName,
        url: a.url,
        mime: a.mimeType,
        size: a.size,
        createdAt: a.createdAt,
      })),
    });
  } catch (e) {
    console.error("sendMessage error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/chats/attachments/:id/download
// 1) пользователь должен скачать
// 2) после первого скачивания ставим deleteAfter = now + 2 days
export const downloadAttachment = async (req, res) => {
  try {
    await cleanupExpired();
    const meId = req.user.id;
    const attachmentId = req.params.id;

    const a = await prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: { select: { conversationId: true } },
      },
    });
    if (!a) return res.status(404).json({ error: "File not found" });

    const membership = await prisma.conversationParticipant.findFirst({
      where: { conversationId: a.message.conversationId, userId: meId },
      select: { id: true },
    });
    if (!membership) return res.status(403).json({ error: "No access" });

    // лог скачивания (уникально на user+attachment)
    await prisma.attachmentDownload.upsert({
      where: { attachmentId_userId: { attachmentId: a.id, userId: meId } },
      update: {},
      create: { attachmentId: a.id, userId: meId },
    });

    // если это первое скачивание вообще — ставим TTL 2 дня
    const now = new Date();
    if (!a.firstDownloadedAt) {
      const deleteAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      await prisma.messageAttachment.update({
        where: { id: a.id },
        data: { firstDownloadedAt: now, deleteAfter },
      });
    }

    const abs = buildAbsoluteUploadPath(a.url);
    if (!fs.existsSync(abs)) return res.status(404).json({ error: "File missing on server" });

    res.setHeader("Content-Type", a.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(a.originalName || "file")}"`
    );
    res.sendFile(abs);
  } catch (e) {
    console.error("downloadAttachment error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/chats/attachments/:id/meta
export const attachmentMeta = async (req, res) => {
  try {
    await cleanupExpired();
    const meId = req.user.id;
    const attachmentId = req.params.id;

    const a = await prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: { message: { select: { conversationId: true } } },
    });
    if (!a) return res.status(404).json({ error: "Not found" });

    const membership = await prisma.conversationParticipant.findFirst({
      where: { conversationId: a.message.conversationId, userId: meId },
      select: { id: true },
    });
    if (!membership) return res.status(403).json({ error: "No access" });

    res.json({
      id: a.id,
      fileName: a.originalName,
      url: a.url,
      mime: a.mimeType,
      size: a.size,
      firstDownloadedAt: a.firstDownloadedAt,
      deleteAfter: a.deleteAfter,
    });
  } catch (e) {
    console.error("attachmentMeta error:", e);
    res.status(500).json({ error: "Server error" });
  }
};
