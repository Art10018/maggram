// backend/src/prisma.js
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient(); // named export (для import { prisma })
export default prisma; // default export (для import prisma)