import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../api/auth";

export default function Register() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError("");

    if (!username || !email || !password) {
      setError("Missing fields");
      return;
    }

    try {
      setLoading(true);
      const res = await registerApi({ username, email, password });
      // res: { message, email }
      nav("/verify-email", { state: { email: res.email || email } });
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

        <h2 className="auth-title">Добро пожаловать в MagGram</h2>
        <p className="auth-subtitle">вы впервые тут?</p>

        <input
          className="auth-input"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="auth-input"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-btn" onClick={onSubmit} disabled={loading}>
          {loading ? "..." : "Далее"}
        </button>

        {error ? <div className="auth-error">{error}</div> : null}

        <button className="auth-link" onClick={() => nav("/login")}>
          Есть аккаунт? Вход
        </button>
      </div>
    </div>
  );
}