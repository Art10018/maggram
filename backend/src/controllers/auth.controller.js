import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to, code) {
  const from = process.env.EMAIL_FROM || "MagGram <onboarding@resend.dev>";

  // простой текст — без html, чтоб не было сюрпризов
  const subject = "MagGram — подтверждение email";
  const text = `Ваш код подтверждения: ${code}\nОн действует 10 минут.`;

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    text,
  });

  if (error) {
    throw new Error(error?.message || "Failed to send email");
  }
}