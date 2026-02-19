import nodemailer from "nodemailer";

/**
 * Если SMTP не настроен — НЕ роняем приложение.
 * Просто логируем код в консоль (удобно для dev).
 */
function isSmtpConfigured() {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM
  );
}

let transporter = null;
function getTransporter() {
  if (!isSmtpConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendVerificationEmail(to, code) {
  const tr = getTransporter();

  // DEV fallback
  if (!tr) {
    console.log(`[EMAIL VERIFY DEV] to=${to} code=${code}`);
    return;
  }

  await tr.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "MagGram — подтверждение email",
    text: `Ваш код подтверждения: ${code}\nОн действует 10 минут.`,
  });
}
