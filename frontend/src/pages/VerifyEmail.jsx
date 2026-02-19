import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerApi } from "../api/auth";

export default function Register() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const showButton = useMemo(() => {
    return (username || email || password).trim().length > 0;
  }, [username, email, password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await registerApi({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      const pendingId = res.data?.pendingId;
      const em = res.data?.email || email.trim();

      if (!pendingId) throw new Error("Register response missing pendingId");

      nav("/verify-email", { replace: true, state: { pendingId, email: em } });
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
    }
  };

  // 👇 ниже просто твой UI (я оставил максимально простой нейтральный,
  // если у тебя уже есть — можешь оставить свои div/className 1в1 и заменить только onSubmit)
  return (
    <div className="auth-wrap">
      <div className="auth-bg" />

      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-logo">
          <img src="/logo.png" alt="MagGram" />
        </div>

        <div className="auth-title">
          <div className="t1">Добро пожаловать в MagGram</div>
          <div className="t2">вы впервые тут?</div>
        </div>

        <div className="auth-fields">
          <div className="auth-avatar" />
          <div className="auth-inputs">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              autoComplete="email"
            />
          </div>

          <input
            className="auth-pass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            type="password"
            autoComplete="new-password"
          />
        </div>

        {showButton && (
          <button className="auth-btn" disabled={loading}>
            {loading ? "..." : "Далее"}
          </button>
        )}

        {err ? <div className="auth-err">{err}</div> : null}

        <div className="auth-footer">
          Есть аккаунт? <Link to="/login">Вход</Link>
        </div>
      </form>
    </div>
  );
}