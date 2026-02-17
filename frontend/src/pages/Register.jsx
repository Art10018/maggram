import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerApi } from "../api/auth";
import { uploadMyAvatarApi } from "../api/users";
import { useAuth } from "../store/auth.jsx";

export default function Register() {
  const nav = useNavigate();
  const { login, setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const fileRef = useRef(null);

  const firstLetter = useMemo(() => {
    const ch = (username || "U").trim()[0] || "U";
    return ch.toUpperCase();
  }, [username]);

  const onPick = () => fileRef.current?.click();

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setAvatarFile(f);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await registerApi({ username, email, password });
      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) throw new Error("Register response missing token/user");

      login(token, user);

      if (avatarFile) {
        const up = await uploadMyAvatarApi(avatarFile);
        const updated = up.data?.user;
        if (updated) setUser(updated);
      }

      nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = avatarFile ? URL.createObjectURL(avatarFile) : null;

  return (
    <div style={{ padding: 16, maxWidth: 520 }}>
      <h2>Register</h2>

      <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 16px" }}>
        <div
          onClick={onPick}
          title="Upload avatar"
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "1px solid #ddd",
            overflow: "hidden",
            cursor: "pointer",
            position: "relative",
            display: "grid",
            placeItems: "center",
            userSelect: "none",
            background: "#f3f3f3",
          }}
          onMouseEnter={(e) => (e.currentTarget.dataset.hover = "1")}
          onMouseLeave={(e) => (e.currentTarget.dataset.hover = "0")}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ fontSize: 42, fontWeight: 800 }}>{firstLetter}</div>
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.0)",
              display: "grid",
              placeItems: "center",
              transition: "background 120ms ease",
            }}
            className="avatar-overlay"
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontSize: 28,
              opacity: 0,
              transition: "opacity 120ms ease",
              pointerEvents: "none",
            }}
            className="avatar-clip"
          >
            📎
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: "none" }}
          onChange={onFileChange}
        />
      </div>

      <style>{`
        div[title="Upload avatar"][data-hover="1"] .avatar-overlay { background: rgba(0,0,0,0.35); }
        div[title="Upload avatar"][data-hover="1"] .avatar-clip { opacity: 1; }
      `}</style>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <input
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="new-password"
        />

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        <button disabled={loading}>{loading ? "..." : "Create account"}</button>
      </form>

      <div style={{ marginTop: 10 }}>
        Have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
}
