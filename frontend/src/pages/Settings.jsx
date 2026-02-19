import { useMemo, useState } from "react";
import {
  uploadMyAvatarApi,
  updateMyProfileApi,
  updateMyCredentialsApi,
} from "../api/users";
import { useAuth } from "../store/auth.jsx";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "";

function normalizeAvatarUrl(avatarUrl) {
  if (!avatarUrl) return "";
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) return avatarUrl;
  return `${API_ORIGIN}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
}

function SaveIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7a3 3 0 0 1 3-3h9l4 4v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 4v6h8V4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 19h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 8 12 4l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 14v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Settings() {
  const { user, setUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const avatarSrc = useMemo(() => normalizeAvatarUrl(user?.avatarUrl), [user?.avatarUrl]);
  const letter = useMemo(() => {
    const s = (user?.username || user?.displayName || "?").trim();
    return (s[0] || "?").toUpperCase();
  }, [user?.username, user?.displayName]);

  const onUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr("");
    setOk("");
    setLoading(true);

    try {
      const res = await uploadMyAvatarApi(file);

      // поддерживаем разные форматы ответа
      const data = res.data ?? {};
      const updatedUser = data.user || (data.id && data.username ? data : null);
      const newAvatarUrl = data.avatarUrl || updatedUser?.avatarUrl || data.user?.avatarUrl || null;

      if (updatedUser) {
        setUser(updatedUser);
      } else if (newAvatarUrl) {
        setUser((prev) => ({ ...(prev || {}), avatarUrl: newAvatarUrl }));
      }

      setOk("Avatar updated");
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const onSaveProfile = async () => {
    setErr("");
    setOk("");
    setLoading(true);

    try {
      const res = await updateMyProfileApi({ displayName, bio });
      const data = res.data ?? {};
      const updated = data.user || data;
      if (updated) setUser(updated);
      setOk("Profile saved");
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
    }
  };

  const onSaveCredentials = async () => {
    setErr("");
    setOk("");
    setLoading(true);

    try {
      const res = await updateMyCredentialsApi({ username, email, currentPassword });
      const data = res.data ?? {};
      const updated = data.user || data;
      if (updated) setUser(updated);
      setCurrentPassword("");
      setOk("Credentials updated");
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
    }
  };

  const page = {
    padding: 18,
    maxWidth: 920,
    margin: "0 auto",
    color: "rgba(255,255,255,0.92)",
  };

  const card = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.22)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
    padding: 16,
  };

  const label = {
    fontWeight: 900,
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 6,
  };

  const input = {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    fontWeight: 750,
    fontSize: 16, // iOS no zoom
    boxSizing: "border-box",
  };

  const textarea = {
    ...input,
    resize: "vertical",
    minHeight: 92,
    lineHeight: 1.35,
  };

  const btn = (variant = "primary") => ({
    all: "unset",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1,
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      variant === "primary"
        ? "rgba(170, 120, 255, 0.22)"
        : "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 900,
    boxShadow: "0 14px 32px rgba(0,0,0,0.35)",
  });

  return (
    <div style={page}>
      <div style={{ fontWeight: 1000, fontSize: 28, marginBottom: 16 }}>Settings</div>

      {/* Avatar */}
      <div style={card}>
        <div style={{ fontWeight: 950, marginBottom: 10 }}>Avatar</div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              flex: "0 0 auto",
              fontWeight: 1000,
              fontSize: 26,
            }}
          >
            {/* если картинка не грузится — покажем букву */}
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  e.currentTarget.src = "";
                }}
              />
            ) : (
              <span>{letter}</span>
            )}
          </div>

          <div style={{ display: "grid", gap: 10, minWidth: 260 }}>
            <label style={btn("secondary")}>
              <UploadIcon size={18} />
              {loading ? "Uploading..." : "Upload new avatar"}
              <input
                type="file"
                accept="image/*"
                onChange={onUploadAvatar}
                style={{ display: "none" }}
                disabled={loading}
              />
            </label>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 800 }}>
              PNG/JPG up to ~10MB recommended
            </div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div style={{ height: 14 }} />

      <div style={card}>
        <div style={{ fontWeight: 950, marginBottom: 10 }}>Profile</div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={label}>Display name</div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={input}
              placeholder="Your name"
            />
          </div>

          <div>
            <div style={label}>Bio</div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={textarea}
              placeholder="A short bio..."
              rows={4}
            />
          </div>

          <button onClick={onSaveProfile} disabled={loading} style={btn("primary")}>
            <SaveIcon size={18} />
            {loading ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>

      {/* Credentials */}
      <div style={{ height: 14 }} />

      <div style={card}>
        <div style={{ fontWeight: 950, marginBottom: 10 }}>Username / Email</div>
        <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 800, marginBottom: 10 }}>
          Changing these requires your current password.
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={label}>Username</div>
            <input
              placeholder="new username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={input}
            />
          </div>

          <div>
            <div style={label}>Email</div>
            <input
              placeholder="new email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
            />
          </div>

          <div>
            <div style={label}>Current password</div>
            <input
              placeholder="current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              style={input}
            />
          </div>

          <button onClick={onSaveCredentials} disabled={loading} style={btn("primary")}>
            <SaveIcon size={18} />
            {loading ? "Saving..." : "Save credentials"}
          </button>
        </div>
      </div>

      {/* Status */}
      {err ? (
        <div style={{ marginTop: 14, color: "rgba(255,120,140,0.95)", fontWeight: 900 }}>{err}</div>
      ) : null}
      {ok ? (
        <div style={{ marginTop: 14, color: "rgba(140,255,190,0.95)", fontWeight: 900 }}>{ok}</div>
      ) : null}
    </div>
  );
}
