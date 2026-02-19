import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";

// пока API может не существовать — страница всё равно работает (ошибку покажет только при сабмите)
import http from "../api/http";

export default function VerifyEmail() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();

  const ACCENT = "rgba(122, 88, 255, 0.95)";

  const email = loc.state?.email || user?.email || "";

  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // кнопка появляется после любого ввода
  const showNext = useMemo(() => code.length > 0, [code]);

  const canSubmit = useMemo(() => {
    // активна, когда 6 цифр
    return code.replace(/\D/g, "").length === 6 && !loading;
  }, [code, loading]);

  const onCodeChange = (v) => {
    setErr("");
    setInfo("");
    // только цифры + максимум 6
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

        // ✅ бэк должен вернуть token+user
        const token = res.data?.token || loc.state?.token;
        const user = res.data?.user;

        if (token && user) {
        // логиним и идём в приложение
        const { login } = require("../store/auth.jsx"); // если не хочешь require — импортни useAuth сверху
        }

        setInfo("Email подтверждён ✅");
        nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message || "Ошибка");
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
      // 🔧 Эндпоинт добавим на бэке следующим шагом:
      // POST /api/auth/resend-email-code  { email }
      await http.post("/auth/resend-email-code", { email });
      setInfo("Код отправлен повторно ✉️");
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message || "Ошибка");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .mm-verify * { box-sizing: border-box; }
        .mm-verify input {
          width: 100% !important;
          background: transparent !important;
          border-radius: 999px !important;
          outline: none !important;
        }
        .mm-verify input::placeholder { color: rgba(255,255,255,0.55) !important; }
        .mm-verify input:focus { box-shadow: 0 0 0 6px rgba(122,88,255,0.12) !important; }
      `}</style>

      <div className="mm-verify" style={{ width: 420, maxWidth: "92vw", textAlign: "center" }}>
        <img
          src="/favicon.png"
          alt="MagGram"
          style={{ width: 48, height: 48, objectFit: "contain", display: "block", margin: "0 auto 18px" }}
        />

        <div style={{ fontWeight: 1000, fontSize: 18, color: "rgba(255,255,255,0.92)", lineHeight: 1.15 }}>
          Подтвердите email
        </div>

        <div style={{ marginTop: 6, fontWeight: 900, fontSize: 14, color: "rgba(255,255,255,0.70)" }}>
          {email ? (
            <>
              Мы отправили код на <span style={{ color: "rgba(255,255,255,0.92)" }}>{email}</span>
            </>
          ) : (
            <>Мы отправили код на вашу почту</>
          )}
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            width: "100%",
            marginTop: 26,
            display: "grid",
            gap: 12,
            justifyItems: "center",
          }}
        >
          <div style={{ width: 320, maxWidth: "92vw" }}>
            <input
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              style={{
                height: 44,
                padding: "0 18px",
                border: `1.6px solid ${ACCENT}`,
                color: "rgba(255,255,255,0.92)",
                fontWeight: 900,
                fontSize: 15,
                letterSpacing: 2,
                textAlign: "center",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "center",
              width: 320,
              maxWidth: "92vw",
              maxHeight: showNext ? 60 : 0,
              opacity: showNext ? 1 : 0,
              transform: showNext ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 180ms ease, transform 180ms ease, max-height 220ms ease",
              overflow: "hidden",
            }}
          >
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: 150,
                height: 38,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.10)",
                background: ACCENT,
                color: "rgba(255,255,255,0.95)",
                fontWeight: 900,
                fontSize: 14,
                cursor: canSubmit ? "pointer" : "default",
                opacity: canSubmit ? 1 : 0.55,
                boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
              }}
            >
              Далее
            </button>
          </div>

          <button
            type="button"
            onClick={onResend}
            disabled={resendLoading}
            style={{
              marginTop: 8,
              border: "none",
              background: "transparent",
              color: "rgba(255,255,255,0.88)",
              textDecoration: "underline",
              fontWeight: 900,
              fontSize: 14,
              cursor: resendLoading ? "default" : "pointer",
              opacity: resendLoading ? 0.6 : 1,
            }}
          >
            Отправить код ещё раз
          </button>

          {info ? (
            <div style={{ marginTop: 6, color: "rgba(140,255,180,0.95)", fontWeight: 900, fontSize: 13 }}>
              {info}
            </div>
          ) : null}

          {err ? (
            <div style={{ marginTop: 6, color: "rgba(255,120,140,0.95)", fontWeight: 900, fontSize: 13 }}>
              {err}
            </div>
          ) : null}
        </form>

        <div style={{ marginTop: 14, color: "rgba(255,255,255,0.92)", fontWeight: 900, fontSize: 14 }}>
          Передумал?{" "}
          <Link
            to="/register"
            style={{ color: "rgba(255,255,255,0.95)", textDecoration: "underline", fontWeight: 1000 }}
          >
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}
