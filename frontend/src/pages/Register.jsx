import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerApi } from "../api/auth";
import { uploadMyAvatarApi } from "../api/users";
import { useAuth } from "../store/auth.jsx";

function isValidEmail(v) {
  const s = (v || "").trim();
  const at = s.indexOf("@");
  if (at <= 0) return false;
  const dot = s.indexOf(".", at + 2);
  if (dot === -1) return false;
  if (dot >= s.length - 1) return false;
  return true;
}

function UserIcon({ size = 28, color = "rgba(255,255,255,0.72)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke={color} strokeWidth="2" />
      <path
        d="M4 20c1.7-3.4 5-5 8-5s6.3 1.6 8 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Register() {
  const nav = useNavigate();
  const auth = useAuth?.(); // на всякий случай, чтобы не упасть если хук изменился
  const login = auth?.login;
  const setUser = auth?.setUser;

  const ACCENT = "rgba(122, 88, 255, 0.95)";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const fileRef = useRef(null);

  // ✅ безопасный previewUrl + чистка, чтобы не было утечек памяти
  const previewUrl = useMemo(() => {
    if (!avatarFile) return null;
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const showNext = useMemo(() => (username + email + password).length > 0, [username, email, password]);

  const canSubmit = useMemo(() => {
    const u = username.trim().length >= 2;
    const eok = isValidEmail(email);
    const p = password.length >= 4;
    return u && eok && p && !loading;
  }, [username, email, password, loading]);

  const onPick = () => fileRef.current?.click();

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setAvatarFile(f);
  };

  // ✅ ВАЖНО: async, иначе await ломает билд
  const onSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErr("");

    const u = username.trim();
    const em = email.trim();
    const p = password;

    if (!u || !em || !p) return;

    if (!isValidEmail(em)) {
      setErr("Email должен содержать @ и точку (например: name@gmail.com)");
      return;
    }

    setLoading(true);
    try {
      // ✅ Регистрируемся
      const res = await registerApi({ username: u, email: em, password: p });

      // ✅ Поддерживаем оба варианта ответа бэка:
      // 1) { token, user }
      // 2) { ok/message/email } или вообще без токена — тогда просто ведём на verify
      const token = res?.data?.token;
      const user = res?.data?.user;

      // Если бэк возвращает token/user — логиним
      if (token && user && typeof login === "function") {
        login(token, user);

        // ⚠️ Аватар грузим ТОЛЬКО если есть токен (иначе запрос упадёт)
        if (avatarFile) {
          try {
            const up = await uploadMyAvatarApi(avatarFile);
            const updated = up?.data?.user || up?.data;
            if (updated && typeof setUser === "function") setUser(updated);
          } catch {
            // аватар — не критично
          }
        }
      } else {
        // Если токена нет — просто запомним email для verify
        // (чтобы verify-страница могла достать даже без state)
        try {
          localStorage.setItem("pendingEmail", em);
        } catch {}
      }

      // ✅ Всегда уводим на подтверждение почты
      nav("/verify-email", { replace: true, state: { email: em } });
      return;
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2?.response?.data?.message || e2?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      {/* ⚠️ Это ломает любые глобальные стили, чтобы размеры реально применились */}
      <style>{`
        .mm-reg * { box-sizing: border-box; }
        .mm-reg input {
          width: 100% !important;
          background: transparent !important;
          border-radius: 999px !important;
          outline: none !important;
        }
        .mm-reg input::placeholder { color: rgba(255,255,255,0.55) !important; }
        .mm-reg input:focus { box-shadow: 0 0 0 6px rgba(122,88,255,0.12) !important; }
      `}</style>

      <div className="mm-reg" style={{ width: 420, maxWidth: "92vw", textAlign: "center" }}>
        <img
          src="/favicon.png"
          alt="MagGram"
          style={{ width: 48, height: 48, objectFit: "contain", display: "block", margin: "0 auto 18px" }}
        />

        <div style={{ fontWeight: 1000, fontSize: 18, color: "rgba(255,255,255,0.92)", lineHeight: 1.15 }}>
          Добро пожаловать в MagGram
        </div>
        <div
          style={{
            marginTop: 4,
            fontWeight: 1000,
            fontSize: 18,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.15,
          }}
        >
          вы впервые тут?
        </div>

        <form
          onSubmit={onSubmit}
          style={{
            width: "100%",
            marginTop: 36,
            display: "grid",
            gap: 12,
            justifyItems: "center",
          }}
        >
          {/* ✅ ФИКС: делаем блок инпутов реально короче */}
          <div style={{ width: 320, maxWidth: "92vw" }}>
            <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 14, alignItems: "center" }}>
              {/* ✅ ФИКС: аватар больше */}
              <button
                type="button"
                onClick={onPick}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  border: `1.6px solid ${ACCENT}`,
                  background: "transparent",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: 0,
                }}
                aria-label="Upload avatar"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <UserIcon size={28} />
                )}
              </button>

              <div style={{ display: "grid", gap: 10 }}>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  autoComplete="username"
                  style={{
                    height: 42,
                    padding: "0 16px",
                    border: `1.6px solid ${ACCENT}`,
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 900,
                    fontSize: 15,
                  }}
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email"
                  autoComplete="email"
                  style={{
                    height: 42,
                    padding: "0 16px",
                    border: `1.6px solid ${ACCENT}`,
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 900,
                    fontSize: 15,
                  }}
                />
              </div>

              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
            </div>
          </div>

          {/* ✅ Password той же ширины что и блок сверху */}
          <div style={{ width: 320, maxWidth: "92vw" }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              autoComplete="new-password"
              style={{
                height: 44,
                padding: "0 18px",
                border: `1.6px solid ${ACCENT}`,
                color: "rgba(255,255,255,0.92)",
                fontWeight: 900,
                fontSize: 15,
              }}
            />
          </div>

          {/* ✅ Кнопка “Далее” появляется плавно */}
          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "center",
              width: 320,
              maxWidth: "92vw",
              maxHeight: showNext ? 60 : 0,
              opacity: showNext ? 1 : 0,
              transform: showNext ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 180ms ease, transform 180ms ease, max-height 220ms ease",
              overflow: "hidden",
            }}
          >
            <button
              type="submit"
              disabled={!canSubmit || loading}
              style={{
                width: 150,
                height: 38,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.10)",
                background: ACCENT,
                color: "rgba(255,255,255,0.95)",
                fontWeight: 900,
                fontSize: 14,
                cursor: canSubmit ? "pointer" : "default",
                opacity: canSubmit ? 1 : 0.55,
                boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
              }}
            >
              Далее
            </button>
          </div>

          {err ? (
            <div style={{ marginTop: 6, color: "rgba(255,120,140,0.95)", fontWeight: 900, fontSize: 13 }}>
              {err}
            </div>
          ) : null}
        </form>

        <div style={{ marginTop: 14, color: "rgba(255,255,255,0.92)", fontWeight: 900, fontSize: 14 }}>
          Есть аккаунта?{" "}
          <Link to="/login" style={{ color: "rgba(255,255,255,0.95)", textDecoration: "underline", fontWeight: 1000 }}>
            Вход
          </Link>
        </div>
      </div>
    </div>
  );
}