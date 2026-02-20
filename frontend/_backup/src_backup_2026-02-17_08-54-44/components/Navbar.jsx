// frontend/src/components/Navbar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";

function Icon({ children }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        color: "inherit",
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const linkStyle = (active) => ({
    display: "grid",
    placeItems: "center",
    width: 56,
    height: 56,
    borderRadius: 16,
    textDecoration: "none",
    color: active ? "#fff" : "rgba(255,255,255,0.55)",
    background: "transparent",
  });

  // ИКОНКИ оставляю “простые” (как было нормально), без фиолетовых обводок
  return (
    <div
      style={{
        width: 84,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,10,12,0.55)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* LOGO */}
      <NavLink to="/" style={{ display: "grid", placeItems: "center", marginBottom: 8 }}>
        <img
          src="/logo.png"
          alt="logo"
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            objectFit: "cover",
          }}
        />
      </NavLink>

      {/* Search (пока не функциональный) */}
      <div style={linkStyle(false)}>
        <Icon>
          <span style={{ fontSize: 18 }}>🔎</span>
        </Icon>
      </div>

      {/* Feed */}
      <NavLink to="/" style={linkStyle(isActive("/"))}>
        <Icon>
          <span style={{ fontSize: 18 }}>≡</span>
        </Icon>
      </NavLink>

      {/* Chats (пока не функциональный) */}
      <div style={linkStyle(false)}>
        <Icon>
          <span style={{ fontSize: 18 }}>💬</span>
        </Icon>
      </div>

      {/* New post */}
      <NavLink to="/new-post" style={linkStyle(isActive("/new-post"))}>
        <Icon>
          <span style={{ fontSize: 18 }}>＋</span>
        </Icon>
      </NavLink>

      <div style={{ flex: 1 }} />

      {/* Avatar -> Profile */}
      <NavLink to="/profile" style={{ textDecoration: "none", display: "grid", placeItems: "center" }}>
        <div
          title={user?.username || ""}
          style={{
            width: 44,          // ✅ чуть меньше как ты просил
            height: 44,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          {/* тут у тебя уже в проекте логика аватарки цветной/по букве — я НЕ трогаю.
              если хочешь, могу подключить тот же Avatar helper, который у тебя в Profile.jsx */}
          <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 800 }}>
            {(user?.username?.[0] || "?").toUpperCase()}
          </span>
        </div>
      </NavLink>
    </div>
  );
}
