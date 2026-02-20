import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmailApi, resendEmailApi } from "../api/auth";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail = useMemo(() => {
    // 1) пытаемся взять email из state (если ты так навигируешь)
    // 2) иначе из localStorage (мы будем класть туда при register)
    // 3) иначе пусто
    return (
      location?.state?.email ||
      localStorage.getItem("pendingEmail") ||
      ""
    );
  }, [location]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialEmail) {
      localStorage.setItem("pendingEmail", initialEmail);
    }
  }, [initialEmail]);

  const onVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !code) {
      setError("Введите email и код");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyEmailApi(email, code);

      // ОЖИДАЕМ ОТ БЭКА: { token, user }
      if (!res?.token || !res?.user) {
        setError("Неверный ответ сервера: нет token/user");
        return;
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.removeItem("pendingEmail");

      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Ошибка подтверждения";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError("");

    if (!email) {
      setError("Введите email");
      return;
    }

    try {
      setResendLoading(true);
      await resendEmailApi(email);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Ошибка отправки кода";
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Подтверждение email</h2>

        <form onSubmit={onVerify}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
          />

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код из письма"
            inputMode="numeric"
          />

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Проверка..." : "Подтвердить"}
          </button>
        </form>

        <button
          type="button"
          className="auth-secondary"
          onClick={onResend}
          disabled={resendLoading}
          style={{ marginTop: 10 }}
        >
          {resendLoading ? "Отправка..." : "Отправить код ещё раз"}
        </button>

        <button
          type="button"
          className="auth-link"
          onClick={() => navigate("/")}
          style={{ marginTop: 10 }}
        >
          На главную
        </button>
      </div>
    </div>
  );
}