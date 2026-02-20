// backend/src/utils/sendEmail.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email, code) {
  const from = process.env.RESEND_FROM || "MagGram <verifi@maggram.ru>";
  const subject = "MagGram — подтверждение email";
  const text = `Ваш код подтверждения: ${code}\nОн действует 10 минут.`;

  // Resend вернёт ошибку, если домен/from не верифицирован или ключ не тот
  await resend.emails.send({
    from,
    to: [email],
    subject,
    text,
  });
}