import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to, code) {
  const from = process.env.EMAIL_FROM || "MagGram <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to,
    subject: "MagGram — подтверждение email",
    text: `Ваш код подтверждения: ${code}\nОн действует 10 минут.`,
  });
}
