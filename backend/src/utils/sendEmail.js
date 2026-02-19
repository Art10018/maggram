import { Resend } from "resend";

const RESEND_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "MagGram <onboarding@resend.dev>";

function maskEmail(email = "") {
  const [u, d] = email.split("@");
  if (!u || !d) return email;
  return `${u.slice(0, 2)}***@${d}`;
}

export async function sendVerificationEmail(to, code) {
  // DEV fallback: если ключа нет — просто логируем
  if (!RESEND_KEY) {
    console.log(`[EMAIL VERIFY DEV] to=${to} code=${code}`);
    return { ok: true, dev: true };
  }

  const resend = new Resend(RESEND_KEY);

  const subject = "MagGram — подтверждение email";
  const text = `Ваш код подтверждения: ${code}\nОн действует 10 минут.`;

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      text,
    });

    // result может быть { id } или { data, error }
    if (result?.error) {
      console.error("Resend error:", result.error);
      throw new Error(result.error?.message || "Resend send failed");
    }

    console.log(`[EMAIL SENT] to=${maskEmail(to)} id=${result?.id || result?.data?.id || "n/a"}`);
    return { ok: true, id: result?.id || result?.data?.id };
  } catch (e) {
    console.error("send verification email error:", e);
    throw e;
  }
}
