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
    return <img src={src} alt="" onClick={onClick} style={{ ...base, objectFit: "cover", background: "rgba(255,255,255,0.06)" }} onError={(e) => (e.currentTarget.style.display = "none")} />;
  }

  return (
    <div onClick={onClick} style={{ ...base, background: bg, color: "white", fontWeight: 900 }} title="Profile">
      {letter}
    </div>
  );
}

function FeedIcon() {
  return <svg className="anim-feed" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6.5h16M4 12h16M4 17.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}
function SearchIcon() {
  return <svg className="anim-search" width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" /><path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}
function ChatIcon() {
  return <svg className="anim-chat" width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="13" height="10" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M8 14 5 17v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="10" y="9" width="11" height="9" rx="3" stroke="currentColor" strokeWidth="2" /></svg>;
}
function PostIcon() {
  return <svg className="anim-post" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 860px)").matches;
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
    background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
    transition: "all 160ms ease",
  });

  return (
    <>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <NavLink to="/" style={linkStyle} title="Feed" className="menuIconBtn"><FeedIcon /></NavLink>
          <NavLink to="/search" style={linkStyle} title="Search" className="menuIconBtn"><SearchIcon /></NavLink>
          <div style={{ width: 48, height: 48, display: "grid", placeItems: "center" }}>
            <AvatarBtn user={user} size={40} onClick={() => navigate("/profile")} />
          </div>
          <NavLink to="/chats" style={linkStyle} title="Chats" className="menuIconBtn"><ChatIcon /></NavLink>
          <NavLink to="/new-post" style={linkStyle} title="New post" className="menuIconBtn"><PostIcon /></NavLink>
        </div>
      </nav>

      <style>{`
        .menuIconBtn:active .anim-feed{animation:feedBounce .28s ease}
        .menuIconBtn:active .anim-search{animation:searchSpin .35s ease}
        .menuIconBtn:active .anim-chat{animation:chatPop .32s ease}
        .menuIconBtn:active .anim-post{animation:postPulse .28s ease}
        @keyframes feedBounce{0%{transform:translateY(0)}50%{transform:translateY(-2px) scale(1.08)}100%{transform:translateY(0)}}
        @keyframes searchSpin{0%{transform:rotate(0)}100%{transform:rotate(20deg)}}
        @keyframes chatPop{0%{transform:scale(1)}50%{transform:scale(1.12)}100%{transform:scale(1)}}
        @keyframes postPulse{0%{transform:scale(1)}50%{transform:scale(1.14)}100%{transform:scale(1)}}
      `}</style>
    </>
  );
}
