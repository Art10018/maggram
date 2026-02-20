import { useState } from "react";
import { uploadMyAvatarApi, updateMyProfileApi, updateMyCredentialsApi } from "../api/users";
import { useAuth } from "../store/auth.jsx";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "";

function normalizeAvatarUrl(avatarUrl) {
  if (!avatarUrl) return "";
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) return avatarUrl;
  return `${API_ORIGIN}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
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

  const avatarSrc = normalizeAvatarUrl(user?.avatarUrl);
  const letter = ((user?.username || user?.displayName || "?").trim()[0] || "?").toUpperCase();

  const onUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr("");
    setOk("");
    setLoading(true);

    try {
      const res = await uploadMyAvatarApi(file);

      // ✅ поддерживаем любые ответы бэка:
      // 1) { user: {...} }
      // 2) { avatarUrl: "/uploads/..." }
      // 3) { ...userFields }
      const data = res.data ?? {};
      const updatedUser =
        data.user ||
        (data.id && data.username ? data : null);

      const newAvatarUrl =
        data.avatarUrl ||
        updatedUser?.avatarUrl ||
        data.user?.avatarUrl ||
        null;

      if (updatedUser) {
        setUser(updatedUser);
      } else if (newAvatarUrl) {
        // если бэк вернул только avatarUrl — обновим локально
        setUser((prev) => ({ ...(prev || {}), avatarUrl: newAvatarUrl }));
      }

      setOk("Avatar updated");
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setLoading(false);
      e.target.value = ""; // можно снова выбрать тот же файл
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

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <h2>Settings</h2>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <b>Avatar</b>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* ✅ если картинка не грузится — покажем букву */}
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Avatar"
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                objectFit: "cover",
                background: "#f3f3f3",
                border: "1px solid #ddd",
              }}
              onError={(e) => {
                // если не загрузилось — убираем src, чтобы отрисовалась буква
                e.currentTarget.src = "";
              }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#ddd",
                border: "1px solid #ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                color: "#333",
              }}
            >
              {letter}
            </div>
          )}

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onUploadAvatar}
            disabled={loading}
          />
        </div>
      </div>

      <hr />

      <div style={{ marginTop: 16 }}>
        <h3>Profile (free)</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            placeholder="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <textarea
            placeholder="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
          <button onClick={onSaveProfile} disabled={loading}>
            {loading ? "..." : "Save profile"}
          </button>
        </div>
      </div>

      <hr />

      <div style={{ marginTop: 16 }}>
        <h3>Username / Email (requires password)</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            placeholder="new username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="new email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
          />
          <button onClick={onSaveCredentials} disabled={loading}>
            {loading ? "..." : "Save credentials"}
          </button>
        </div>
      </div>

      {err && <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>}
      {ok && <div style={{ marginTop: 12, color: "green" }}>{ok}</div>}
    </div>
  );
}
