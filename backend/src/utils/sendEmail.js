import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to, code) {
  // если ключа нет — dev fallback
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL VERIFY DEV] to=${to} code=${code}`);
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "MagGram <onboarding@resend.dev>",
    to,
    subject: "MagGram — подтверждение email",
    text: `Ваш код подтверждения: ${code}\nОн действует 10 минут.`,
  });
}
