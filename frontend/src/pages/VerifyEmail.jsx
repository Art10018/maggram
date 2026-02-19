import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";
import http from "../api/http";

export default function VerifyEmail() {
  const nav = useNavigate();
  const loc = useLocation();

  // ✅ вот это главное: берём login из контекста, без require
  const { user: authUser, login } = useAuth();

  const ACCENT = "rgba(122, 88, 255, 0.95)";
  const email = loc.state?.email || authUser?.email || "";

  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const showNext = useMemo(() => code.length > 0, [code]);

  const canSubmit = useMemo(() => {
    return code.replace(/\D/g, "").length === 6 && !loading;
  }, [code, loading]);

  const onCodeChange = (v) => {
    setErr("");
    setInfo("");
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
  };

  const onSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErr("");
    setInfo("");

    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) return;

    setLoading(true);
    try {
      const res = await http.post("/auth/verify-email", { email, code: clean });

      // бэк может вернуть token+user, либо только ok/user — делаем мягко
      const token = res.data?.token || loc.state?.token || null;
      const verifiedUser = res.data?.user || res.data?.updatedUser || null;

      if (token && verifiedUser) {
        login(token, verifiedUser);
      }

      setInfo("Email подтверждён ✅");
      nav("/", { replace: true });
    } catch (e2) {
      setErr(
        e2?.response?.data?.error ||
          e2?.response?.data?.message ||
          e2?.message ||
          "Ошибка"
      );
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setErr("");
    setInfo("");

    if (!email) {
      setErr("Не найден email (вернись на регистрацию)");
      return;
    }

    setResendLoading(true);
    try {
      await http.post("/auth/resend-email-code", { email });
      setInfo("Код отправлен повторно ✉️");
    } catch (e2) {
      setErr(
        e2?.response?.data?.error ||
          e2?.response?.data?.message ||
          e2?.message ||
          "Ошибка"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "transparent",
      }}
    >
      <div style={{ width: 520, maxWidth: "92vw", textAlign: "center" }}>
        <img
          src="/favicon.png"
          alt="MagGram"
          style={{
            width: 42,
            height: 42,
            objectFit: "contain",
            display: "block",
            margin: "0 auto 12px",
          }}
        />

        <div style={{ fontWeight: 900, fontSize: 22, color: "#fff" }}>
          Подтвердите email
        </div>

        <div style={{ marginTop: 6, color: "rgba(255,255,255,0.72)" }}>
          {email ? (
            <>Мы отправили код на <b>{email}</b></>
          ) : (
            <>Мы отправили код на вашу почту</>
          )}
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 18 }}>
          <input
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            style={{
              width: "100%",
              height: 44,
              padding: "0 18px",
              borderRadius: 999,
              border: `1.6px solid ${ACCENT}`,
              background: "transparent",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: 2,
              textAlign: "center",
              outline: "none",
            }}
          />

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateRows: showNext ? "1fr" : "0fr",
              transition: "grid-template-rows 200ms ease",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: 180,
                  height: 44,
                  borderRadius: 999,
                  border: 0,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  background: canSubmit ? ACCENT : "rgba(122,88,255,0.35)",
                  color: "#fff",
                  fontWeight: 900,
                  margin: "0 auto",
                  display: "block",
                }}
              >
                Далее
              </button>
            </div>
          </div>
        </form>

        <button
          onClick={onResend}
          disabled={resendLoading}
          style={{
            marginTop: 12,
            background: "transparent",
            border: 0,
            color: "rgba(255,255,255,0.9)",
            textDecoration: "underline",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {resendLoading ? "Отправляем..." : "Отправить код ещё раз"}
        </button>

        {info ? (
          <div style={{ marginTop: 10, color: "rgba(140,255,170,0.95)", fontWeight: 800 }}>
            {info}
          </div>
        ) : null}

        {err ? (
          <div style={{ marginTop: 10, color: "rgba(255,90,90,0.95)", fontWeight: 800 }}>
            {err}
          </div>
        ) : null}

        <div style={{ marginTop: 14, color: "rgba(255,255,255,0.85)", fontWeight: 800 }}>
          Передумал?{" "}
          <Link to="/register" style={{ color: "#fff", textDecoration: "underline" }}>
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}
