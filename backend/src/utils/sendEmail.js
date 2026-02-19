import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM || "MagGram <onboarding@resend.dev>";

export async function sendVerificationEmail(to, code) {
  if (!resend) {
    console.log(`[EMAIL VERIFY DEV] to=${to} code=${code}`);
    return;
  }

  // Важно: если домен не верифицирован — Resend разрешает слать только на email владельца аккаунта
  // До подтверждения DNS лучше держать FROM = onboarding@resend.dev (как у тебя сейчас)
  await resend.emails.send({
    from: FROM,
    to,
    subject: "MagGram — подтверждение email",
    text: `Ваш код подтверждения: ${code}\nОн действует 10 минут.`,
  });
}
