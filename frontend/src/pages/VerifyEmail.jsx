import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmailApi, resendEmailApi } from "../api/auth";
import { useAuth } from "../store/auth";

export default function VerifyEmail() {
  const nav = useNavigate();
  const { state } = useLocation();
  const { login: authLogin } = useAuth();

  const email = useMemo(() => state?.email || "", [state]);

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      // если вдруг сюда зашли напрямую
      nav("/register");
    }
  }, [email, nav]);

  const onVerify = async () => {
    setError("");
    setInfo("");

    if (!code || code.trim().length < 4) {
      setError("Invalid code");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyEmailApi({ email, code: code.trim() });
      // backend вернёт token + user
      authLogin(res.token, res.user);
      nav("/");
    } catch (e) {
      const msg = e?.response?.data?.message || "Invalid code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError("");
    setInfo("");
    try {
      setLoading(true);
      await resendEmailApi({ email });
      setInfo("Код отправлен ещё раз");
    } catch (e) {
      const msg = e?.response?.data?.message || "Server error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">✨</div>

        <h2 className="auth-title">Подтвердите email</h2>
        <p className="auth-subtitle">Мы отправили код на {email}</p>

        <input
          className="auth-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Введите код"
          inputMode="numeric"
        />

        <button className="auth-btn" onClick={onVerify} disabled={loading}>
          {loading ? "..." : "Далее"}
        </button>

        <button className="auth-link" onClick={onResend} disabled={loading}>
          Отправить код ещё раз
        </button>

        {info ? <div className="auth-info">{info}</div> : null}
        {error ? <div className="auth-error">{error}</div> : null}

        <button className="auth-link" onClick={() => nav("/register")}>
          Передумал? Регистрация
        </button>
      </div>
    </div>
  );
}