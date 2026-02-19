import { Resend } from "resend";

export async function sendVerificationEmail(to, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) throw new Error("RESEND_API_KEY is missing");
  if (!from) throw new Error("EMAIL_FROM is missing");

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from,
    to,
    subject: "MagGram — подтверждение email",
    text: `Ваш код подтверждения: ${code}\nОн действует 10 минут.`,
  });
}