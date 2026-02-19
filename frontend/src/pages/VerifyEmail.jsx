import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resendEmailApi, verifyEmailApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const nav = useNavigate();
  const { login } = useAuth();

  const pendingEmail = sessionStorage.getItem("pendingEmail") || "";
  const pendingId = sessionStorage.getItem("pendingId") || "";

  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const canSubmit = useMemo(() => code.trim().length >= 4, [code]);

  const onVerify = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      setLoading(true);

      const res = await verifyEmailApi({
        pendingId,
        email: pendingEmail,
        code: code.trim(),
      });

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) throw new Error("Verify response missing token/user");

      login(token, user);

      // очищаем pending
      sessionStorage.removeItem("pendingEmail");
      sessionStorage.removeItem("pendingId");

      nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setErr("");
    try {
      setResending(true);
      await resendEmailApi({ pendingId, email: pendingEmail });
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setResending(false);
    }
  };

  const logoSrc = "/favicon.png";

  return (
    <div style={{ minHeight: "100vh" }}>
      <form onSubmit={onVerify} style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ width: 520, maxWidth: "92vw", textAlign: "center" }}>
          <img
            src={logoSrc}
            alt="MagGram"
            style={{
              width: 44,
              height: 44,
              objectFit: "contain",
              borderRadius: 12,
              display: "block",
              margin: "0 auto 16px",
            }}
          />

          <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 8 }}>
            Подтвердите email
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontWeight: 700, marginBottom: 16 }}>
            Мы отправили код на <b>{pendingEmail || "вашу почту"}</b>
          </div>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            style={{ height: 44, borderRadius: 999, padding: "0 18px", width: "100%", textAlign: "center" }}
          />

          <div style={{ marginTop: 14 }}>
            <button type="submit" disabled={!canSubmit || loading} style={{ height: 40, borderRadius: 999, padding: "0 26px" }}>
              Далее
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={onResend} disabled={resending} style={{ background: "transparent", border: 0, color: "#fff", textDecoration: "underline", cursor: "pointer", fontWeight: 800 }}>
              Отправить код ещё раз
            </button>
          </div>

          {err ? <div style={{ marginTop: 10, color: "#ff4d4f", fontWeight: 800 }}>{err}</div> : null}

          <div style={{ marginTop: 14, color: "#fff", fontWeight: 800 }}>
            Передумал? <Link to="/register">Регистрация</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
