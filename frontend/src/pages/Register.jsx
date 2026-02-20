import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api"; // <-- ВАЖНО: проверь путь (у тебя есть src/lib/api.js)

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
      const { data } = await api.post("/auth/register", {
        username,
        email,
        password,
      });

      // Новый флоу: register НЕ обязан отдавать token/user.
      // Он должен как минимум подтвердить email для verify шага.
      const pendingEmail =
        data?.email || email; // если бэк не вернул email, берём тот что ввёл юзер

      if (!pendingEmail) {
        setError("Не удалось отправить код. Попробуйте ещё раз.");
        return;
      }

      localStorage.setItem("pendingEmail", pendingEmail);
      navigate("/verify-email", { state: { email: pendingEmail } });
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
      </form>
    </div>
  );
}
console.log("REGISTER DATA:", data);