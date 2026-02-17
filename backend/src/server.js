import dotenv from 'dotenv'
dotenv.config()

import app from './app.js'

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`)
})
import fs from "fs";
import path from "path";
import prisma from "./prisma.js";

async function cleanupExpiredChatFiles() {
  const now = new Date();
  const expired = await prisma.messageAttachment.findMany({
    where: {
      deleteAfter: { not: null, lte: now },
    },
    select: { id: true, url: true },
    take: 200,
  });

  for (const f of expired) {
    try {
      const filePath = path.join(process.cwd(), f.url.replace(/^\//, ""));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}

    // удаляем запись из БД
    try {
      await prisma.messageAttachment.delete({ where: { id: f.id } });
    } catch {}
  }
}

// каждые 30 минут
setInterval(() => {
  cleanupExpiredChatFiles().catch(() => {});
}, 30 * 60 * 1000);
