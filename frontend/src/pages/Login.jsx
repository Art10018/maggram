import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginApi } from "../api/auth";
import { useAuth } from "../store/auth.jsx";

export default function Login() {
  const nav = useNavigate();
  const { login: doLogin } = useAuth();

  const ACCENT = "rgba(122, 88, 255, 0.95)";

  const [loginValue, setLoginValue] = useState(""); // username/email
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // "Далее" появляется при любом вводе (1 символ в любом поле)
  const showNext = useMemo(() => (loginValue + password).length > 0, [loginValue, password]);

  // активность кнопки
  const canSubmit = useMemo(() => {
    return loginValue.trim().length >= 2 && password.length >= 4 && !loading;
  }, [loginValue, password, loading]);

  const onSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErr("");

    const l = loginValue.trim();
    const p = password;

    if (!l || !p) return;

    setLoading(true);
    try {
      const res = await loginApi(l, p);
      const token = res?.token;
      const user = res?.user;

      if (!token || !user) throw new Error("Login response missing token/user");

      doLogin(token, user);
      nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
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
      {/* Перебиваем глобальные стили, чтобы размеры были точно как надо */}
      <style>{`
        .mm-login * { box-sizing: border-box; }
        .mm-login input {
          width: 100% !important;
          background: transparent !important;
          border-radius: 999px !important;
          outline: none !important;
        }
        .mm-login input::placeholder { color: rgba(255,255,255,0.55) !important; }
        .mm-login input:focus { box-shadow: 0 0 0 6px rgba(122,88,255,0.12) !important; }
      `}</style>

      <div className="mm-login" style={{ width: 420, maxWidth: "92vw", textAlign: "center" }}>
        <img
          src="/favicon.png"
          alt="MagGram"
          style={{ width: 48, height: 48, objectFit: "contain", display: "block", margin: "0 auto 18px" }}
        />

        <div style={{ fontWeight: 1000, fontSize: 18, color: "rgba(255,255,255,0.92)", lineHeight: 1.15 }}>
          Добро пожаловать в MagGram
        </div>
        <div
          style={{
            marginTop: 4,
            fontWeight: 1000,
            fontSize: 18,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.15,
          }}
        >
          войди в свой аккаунт
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            width: "100%",
            marginTop: 36,
            display: "grid",
            gap: 12,
            justifyItems: "center",
          }}
        >
          {/* форма фикс ширины как в регистре */}
          <div style={{ width: 320, maxWidth: "92vw", display: "grid", gap: 10 }}>
            <input
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              placeholder="username/email"
              autoComplete="username"
              style={{
                height: 42,
                padding: "0 16px",
                border: `1.6px solid ${ACCENT}`,
                color: "rgba(255,255,255,0.92)",
                fontWeight: 900,
                fontSize: 15,
              }}
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              autoComplete="current-password"
              style={{
                height: 44,
                padding: "0 18px",
                border: `1.6px solid ${ACCENT}`,
                color: "rgba(255,255,255,0.92)",
                fontWeight: 900,
                fontSize: 15,
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
              disabled={!canSubmit || loading}
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

          {err ? (
            <div style={{ marginTop: 6, color: "rgba(255,120,140,0.95)", fontWeight: 900, fontSize: 13 }}>
              {err}
            </div>
          ) : null}
        </form>

        <div style={{ marginTop: 14, color: "rgba(255,255,255,0.92)", fontWeight: 900, fontSize: 14 }}>
          Нет аккаунта?{" "}
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
