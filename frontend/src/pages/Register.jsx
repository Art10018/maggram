import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { setErr: setGlobalErr } = useAuth?.() || {};
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const showNext = useMemo(() => {
    return (username + email + password).trim().length > 0;
  }, [username, email, password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setGlobalErr?.("");

    try {
      setLoading(true);

      const res = await registerApi({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      const pendingId = res.data?.pendingId;
      const em = res.data?.email;

      if (!pendingId || !em) throw new Error("Register response missing pendingId/email");

      // сохраняем, чтобы VerifyEmail мог прочитать даже после refresh
      sessionStorage.setItem("pendingEmail", em);
      sessionStorage.setItem("pendingId", pendingId);

      nav("/verify-email", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
    }
  };

  // ВАЖНО: логотип без require
  const logoSrc = "/favicon.png";

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* твой фон/визуал оставь как у тебя был — ниже базовая разметка.
          Если у тебя уже есть стили — просто вставь логику onSubmit/showNext/logoSrc. */}
      <form onSubmit={onSubmit} style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
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

          <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 10 }}>
            Добро пожаловать в MagGram
            <div style={{ fontWeight: 700, fontSize: 16, opacity: 0.9, marginTop: 4 }}>
              вы впервые тут?
            </div>
          </div>

          {/* поля — оставь свои стили/размеры, это просто пример */}
          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              style={{ height: 44, borderRadius: 999, padding: "0 18px" }}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              autoComplete="email"
              style={{ height: 44, borderRadius: 999, padding: "0 18px" }}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              autoComplete="new-password"
              style={{ height: 44, borderRadius: 999, padding: "0 18px" }}
            />

            <div style={{ height: 46, position: "relative" }}>
              <button
                type="submit"
                disabled={!showNext || loading}
                style={{
                  opacity: showNext ? 1 : 0,
                  transform: showNext ? "translateY(0px)" : "translateY(-6px)",
                  pointerEvents: showNext ? "auto" : "none",
                  transition: "all 220ms ease",
                  height: 40,
                  borderRadius: 999,
                  padding: "0 26px",
                }}
              >
                Далее
              </button>
            </div>

            {err ? <div style={{ color: "#ff4d4f", fontWeight: 700 }}>{err}</div> : null}

            <div style={{ marginTop: 10, color: "#fff", fontWeight: 800 }}>
              Есть аккаунт? <Link to="/login">Вход</Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
