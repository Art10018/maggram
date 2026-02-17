import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";
import { useMemo } from "react";

const API_ORIGIN = "";

function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 65% 55%)`;
}

function AvatarMini({ user, size = 44 }) {
  const bg = useMemo(() => hashColor(user?.username || ""), [user?.username]);
  const letter = (user?.username?.[0] || "?").toUpperCase();
  const src = user?.avatarUrl ? `${API_ORIGIN}${user.avatarUrl}` : "";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
          background: "rgba(255,255,255,0.06)",
        }}
        onError={(e) => {
          e.currentTarget.src = "";
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        color: "white",
        background: bg,
        userSelect: "none",
      }}
      title={user?.username || ""}
    >
      {letter}
    </div>
  );
}

function Icon({ children }) {
  return (
    <span style={{ width: 22, height: 22, display: "grid", placeItems: "center" }}>
      {children}
    </span>
  );
}

const linkStyle = ({ isActive }) => ({
  display: "grid",
  placeItems: "center",
  width: 44,
  height: 44,
  borderRadius: 14,
  textDecoration: "none",
  transition: "background 120ms ease, transform 120ms ease, color 120ms ease",
  background: "transparent",
  color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
});

const onEnter = (e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)");
const onLeave = (e) => (e.currentTarget.style.background = "transparent");

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className="desktopSidebar"
        style={{
          width: 76,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <button
          className="waveAvatar"
          onClick={() => navigate("/profile")}
          title="My profile"
          style={{
            all: "unset",
            cursor: "pointer",
            marginTop: 14,
            marginBottom: 6,
          }}
        >
          <div className="waveAvatar__inner">
            <AvatarMini user={user} size={46} />
          </div>
        </button>

        <div style={{ height: 6 }} />

        <NavLink to="/" style={linkStyle} onMouseEnter={onEnter} onMouseLeave={onLeave} title="Feed">
          <Icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 6.5h14M5 12h14M5 17.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Icon>
        </NavLink>

        <NavLink to="/search" style={linkStyle} onMouseEnter={onEnter} onMouseLeave={onLeave} title="Search">
          <Icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Icon>
        </NavLink>

        <NavLink to="/chats" style={linkStyle} onMouseEnter={onEnter} onMouseLeave={onLeave} title="Chats">
          <Icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 5.5C4 4.12 5.12 3 6.5 3h11C18.88 3 20 4.12 20 5.5v7C20 13.88 18.88 15 17.5 15H10l-4.2 3.15c-.53.4-1.3.02-1.3-.64V5.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </Icon>
        </NavLink>

        <NavLink to="/new-post" style={linkStyle} onMouseEnter={onEnter} onMouseLeave={onLeave} title="New post">
          <Icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Icon>
        </NavLink>

        <div style={{ flex: 1 }} />
      </aside>

      {/* ===== MOBILE BOTTOM BAR ===== */}
      <nav
        className="mobileBottomBar"
        style={{
          position: "fixed",
          left: 10,
          right: 10,
          bottom: 10,
          zIndex: 80,
          padding: 10,
          borderRadius: 18,
          background: "rgba(12,12,18,0.72)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 14px 50px rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <NavLink to="/" style={linkStyle} title="Feed">
          <Icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 6.5h14M5 12h14M5 17.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Icon>
        </NavLink>

        <NavLink to="/search" style={linkStyle} title="Search">
          <Icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Icon>
        </NavLink>

        <NavLink to="/chats" style={linkStyle} title="Chats">
          <Icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 5.5C4 4.12 5.12 3 6.5 3h11C18.88 3 20 4.12 20 5.5v7C20 13.88 18.88 15 17.5 15H10l-4.2 3.15c-.53.4-1.3.02-1.3-.64V5.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </Icon>
        </NavLink>

        <NavLink to="/new-post" style={linkStyle} title="New post">
          <Icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Icon>
        </NavLink>
      </nav>

      <style>{`
        @media (max-width: 820px){
          .desktopSidebar{ display:none; }
          .mobileBottomBar{ display:flex; }
        }
        @media (min-width: 821px){
          .mobileBottomBar{ display:none; }
          .desktopSidebar{ display:flex; }
        }
      `}</style>
    </>
  );
}
