// frontend/src/components/BottomNav.jsx
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";
import { useMemo } from "react";

const API_ORIGIN = "";

function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 65% 55%)`;
}

function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useMemo(() => [null, null], []);
  // маленький хак: чтобы не плодить хук дважды — просто сделаем inline ниже через matchMedia,
  // но корректнее держать один useIsMobile в проекте. Здесь максимально просто:
  return typeof window !== "undefined" && window.matchMedia(`(max-width:${breakpoint}px)`).matches;
}

function AvatarBtn({ user, size = 40, onClick }) {
  const bg = useMemo(() => hashColor(user?.username || ""), [user?.username]);
  const letter = (user?.username?.[0] || "?").toUpperCase();
  const src = user?.avatarUrl ? `${API_ORIGIN}${user.avatarUrl}` : "";

  const base = {
    width: size,
    height: size,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    cursor: "pointer",
    userSelect: "none",
    flex: "0 0 auto",
  };

  if (src) {
    return (
      <img
        src={src}
        alt=""
        onClick={onClick}
        style={{ ...base, objectFit: "cover", background: "rgba(255,255,255,0.06)" }}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        ...base,
        background: bg,
        color: "white",
        fontWeight: 900,
      }}
      title="Profile"
    >
      {letter}
    </div>
  );
}

function Icon({ children }) {
  return <span style={{ width: 22, height: 22, display: "grid", placeItems: "center" }}>{children}</span>;
}

function ChatNavIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6.5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H9l-3.2 2.4c-.5.4-1.2 0-1.2-.6V6.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 15.5h4l3.2 2.4c.5.4 1.2 0 1.2-.6v-6.8c0-1.1-.9-2-2-2H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 860px)").matches;

  // ✅ скрываем только на телефоне и только внутри конкретного чата
  const isChatRoom = /^\/chats\/[^/]+/.test(pathname);
  if (isMobile && isChatRoom) return null;

  const linkStyle = ({ isActive }) => ({
    all: "unset",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    width: 48,
    height: 48,
    borderRadius: 16,
    color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
    transition: "color 120ms ease, transform 120ms ease",
  });

  return (
    <nav
      style={{
        display: isMobile ? "flex" : "none",
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,

        height: 68,
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "#0b0b0f",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        zIndex: 60,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 5 кнопок строго по центру */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
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

        {/* Profile в центре */}
        <div style={{ width: 48, height: 48, display: "grid", placeItems: "center" }}>
          <AvatarBtn user={user} size={40} onClick={() => navigate("/profile")} />
        </div>

        <NavLink to="/chats" style={linkStyle} title="Chats">
          <Icon>
            <ChatNavIcon />
          </Icon>
        </NavLink>

        <NavLink to="/new-post" style={linkStyle} title="New post">
          <Icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Icon>
        </NavLink>
      </div>
    </nav>
  );
}
