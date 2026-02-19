import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

const makeCode = () => String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
const codeExpiresAt = () => new Date(Date.now() + 10 * 60 * 1000); // 10 min

// ✅ NEW FLOW: register creates PendingSignup only, not User
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const u = (username || "").trim();
    const em = (email || "").trim().toLowerCase();
    const p = password || "";

    if (!u || !em || !p) return res.status(400).json({ error: "Missing fields" });

    // if user already exists (real account) — block
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: em }, { username: u }] },
      select: { id: true },
    });
    if (existingUser) return res.status(400).json({ error: "Username/email already taken" });

    // if pending exists — overwrite it (so user can retry)
    await prisma.pendingSignup.deleteMany({
      where: { OR: [{ email: em }, { username: u }] },
    });

    const passwordHash = await bcrypt.hash(p, 10);
    const code = makeCode();

    await prisma.pendingSignup.create({
      data: {
        username: u,
        email: em,
        passwordHash,
        code,
        expiresAt: codeExpiresAt(),
      },
    });

    await sendVerificationEmail(em, code);

    // фронт должен отправить на страницу ввода кода
    return res.json({ needsVerification: true, email: em });
  } catch (e) {
    console.error("register error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const em = (email || "").trim().toLowerCase();
    const c = (code || "").trim();

    if (!em || !c) return res.status(400).json({ error: "Missing email/code" });

    const pending = await prisma.pendingSignup.findUnique({ where: { email: em } });
    if (!pending) return res.status(400).json({ error: "No pending signup" });

    if (pending.expiresAt < new Date()) {
      // expired — delete to free username/email
      await prisma.pendingSignup.delete({ where: { email: em } });
      return res.status(400).json({ error: "Code expired" });
    }

    if (pending.code !== c) return res.status(400).json({ error: "Invalid code" });

    // create real user now (transaction)
    const created = await prisma.$transaction(async (tx) => {
      // re-check uniqueness (in case someone registered while waiting)
      const exists = await tx.user.findFirst({
        where: { OR: [{ email: pending.email }, { username: pending.username }] },
        select: { id: true },
      });
      if (exists) throw new Error("Username/email already taken");

      const user = await tx.user.create({
        data: {
          username: pending.username,
          email: pending.email,
          passwordHash: pending.passwordHash,
          isEmailVerified: true,
        },
      });

      await tx.pendingSignup.delete({ where: { email: pending.email } });
      return user;
    });

    const token = signToken(created);
    return res.json({ token, user: created });
  } catch (e) {
    console.error("verifyEmail error:", e);
    const msg = e?.message === "Username/email already taken" ? e.message : "Server error";
    return res.status(400).json({ error: msg });
  }
};

export const resendEmailCode = async (req, res) => {
  try {
    const { email } = req.body || {};
    const em = (email || "").trim().toLowerCase();
    if (!em) return res.status(400).json({ error: "Missing email" });

    const pending = await prisma.pendingSignup.findUnique({ where: { email: em } });
    if (!pending) return res.status(400).json({ error: "No pending signup" });

    const code = makeCode();
    await prisma.pendingSignup.update({
      where: { email: em },
      data: { code, expiresAt: codeExpiresAt() },
    });

    await sendVerificationEmail(em, code);
    return res.json({ ok: true });
  } catch (e) {
    console.error("resendEmailCode error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { login: loginValue, password } = req.body || {};
    const l = (loginValue || "").trim();
    const p = password || "";

    if (!l || !p) return res.status(400).json({ error: "Missing fields" });

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: l.toLowerCase() }, { username: l }] },
    });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(p, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    // ✅ IMPORTANT: allow OLD accounts without verification
    if (!user.isEmailVerified) {
      // if there is any verification code record for this user -> it means it's a "new flow" user (or was created during tests)
      const hasCode = await prisma.emailVerificationCode.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });

      // if NO code rows — treat as legacy => allow login
      if (hasCode) {
        return res.status(403).json({ error: "Email not verified", email: user.email });
      }
    }

    const token = signToken(user);
    return res.json({ token, user });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "Server error" });
  }
};

export const me = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({ where: { id } });
    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
};
