// frontend/src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; // <-- у тебя так обычно подключено, если иначе — поправь путь

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register", {
        username,
        email,
        password,
      });

      // Новый бэкенд возвращает { message, email }
      if (res?.data?.email) {
        navigate("/verify-email", { state: { email: res.data.email } });
        return;
      }

      // если вдруг бекенд вернул что-то другое
      setError("Не удалось отправить код. Попробуйте ещё раз.");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Server error";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        {/* оставь свой хедер/лого/тексты как было */}

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
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
          autoComplete="new-password"
        />

        <button type="submit" disabled={loading}>
          {loading ? "..." : "Далее"}
        </button>

        {error ? <div className="auth-error">{error}</div> : null}

        {/* оставь ссылку "Есть аккаунт? Вход" как было */}
      </form>
    </div>
  );
}