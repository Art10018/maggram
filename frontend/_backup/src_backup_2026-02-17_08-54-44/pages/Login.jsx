import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/auth";
import { useAuth } from "../store/auth.jsx";

export default function Login() {
  const nav = useNavigate();
  const { login: doLogin } = useAuth();

  const [loginValue, setLoginValue] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const l = loginValue.trim();
    const p = password;

    if (!l || !p) {
      setErr("email/username and password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({ login: l, password: p });

      const token = res.data?.token;
      const user = res.data?.user;

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
    <div style={{ padding: 16, maxWidth: 520 }}>
      <h2>Login</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="email or username"
          value={loginValue}
          onChange={(e) => setLoginValue(e.target.value)}
          autoComplete="username"
        />
        <input
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
        />

        {err && <div style={{ color: "crimson" }}>{err}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: 10 }}>
        No account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
}
