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
          border: "1px solid rgba(255,255,255,.10)",
        }}
        onError={(e) => e.currentTarget.removeAttribute("src")}
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
        border: "1px solid rgba(255,255,255,.10)",
      }}
      title={user?.username || ""}
    >
      {letter}
    </div>
  );
}

function FeedIcon() {
  return (
    <svg className="anim-feed" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6.5h16M4 12h16M4 17.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="anim-search" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="anim-chat" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="13" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 14 5 17v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="9" width="11" height="9" rx="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PostIcon() {
  return (
    <svg className="anim-post" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NavItem({ to, title, children, desktop = false }) {
  return (
    <NavLink
      to={to}
      title={title}
      className={({ isActive }) => `navIconBtn ${isActive ? "is-active" : ""} ${desktop ? "desktopBtn" : "mobileBtn"}`}
    >
      <span className="iconWrap">{children}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <aside className="sidebarDesktop">
        <button
          onClick={() => navigate("/profile")}
          title="My profile"
          style={{ all: "unset", cursor: "pointer", marginTop: 14, marginBottom: 6 }}
        >
          <AvatarMini user={user} size={46} />
        </button>

        <div style={{ height: 6 }} />

        <NavItem to="/" title="Feed" desktop>
          <FeedIcon />
        </NavItem>
        <NavItem to="/search" title="Search" desktop>
          <SearchIcon />
        </NavItem>
        <NavItem to="/chats" title="Chats" desktop>
          <ChatIcon />
        </NavItem>
        <NavItem to="/new-post" title="New post" desktop>
          <PostIcon />
        </NavItem>

        <div style={{ flex: 1 }} />
      </aside>

      <nav className="sidebarMobile" aria-label="Bottom navigation">
        <div className="sidebarMobileInner">
          <div className="mobileSpacer" />

          <div className="mobileBtns">
            <NavItem to="/" title="Feed">
              <FeedIcon />
            </NavItem>
            <NavItem to="/search" title="Search">
              <SearchIcon />
            </NavItem>
            <NavItem to="/chats" title="Chats">
              <ChatIcon />
            </NavItem>
            <NavItem to="/new-post" title="New post">
              <PostIcon />
            </NavItem>
          </div>

          <button className="mobileAvatarBtn" onClick={() => navigate("/profile")} title="My profile" aria-label="Profile">
            <AvatarMini user={user} size={40} />
          </button>
        </div>
      </nav>

      <style>{`
        .navIconBtn{display:grid;place-items:center;width:44px;height:44px;border-radius:14px;text-decoration:none;color:rgba(255,255,255,.50);transition:all .18s ease;background:transparent;}
        .navIconBtn:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.92)}
        .navIconBtn.is-active{background:rgba(255,255,255,.10);color:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(0,0,0,.32)}
        .iconWrap{display:grid;place-items:center;will-change:transform}
        .navIconBtn:active .anim-feed{animation:feedBounce .28s ease}
        .navIconBtn:active .anim-search{animation:searchSpin .35s ease}
        .navIconBtn:active .anim-chat{animation:chatPop .32s ease}
        .navIconBtn:active .anim-post{animation:postPulse .28s ease}

        @keyframes feedBounce{0%{transform:translateY(0)}50%{transform:translateY(-2px) scale(1.08)}100%{transform:translateY(0)}}
        @keyframes searchSpin{0%{transform:rotate(0)}100%{transform:rotate(20deg)}}
        @keyframes chatPop{0%{transform:scale(1)}50%{transform:scale(1.12)}100%{transform:scale(1)}}
        @keyframes postPulse{0%{transform:scale(1)}50%{transform:scale(1.14)}100%{transform:scale(1)}}

        @media (min-width: 901px){
          .sidebarDesktop{width:76px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:12px;position:sticky;top:0;height:100vh;}
          .sidebarMobile{display:none;}
        }

        @media (max-width: 900px){
          .sidebarDesktop{display:none;}
          .sidebarMobile{position:fixed;left:0;right:0;bottom:0;height:64px;background:#0b0b0f;border-top:1px solid rgba(255,255,255,0.08);z-index:1000;}
          .sidebarMobileInner{height:100%;display:grid;grid-template-columns:44px auto 44px;align-items:center;column-gap:18px;padding:10px 14px;}
          .mobileSpacer{width:44px;height:44px;}
          .mobileBtns{display:flex;justify-content:center;gap:18px;}
          .mobileAvatarBtn{all:unset;cursor:pointer;display:grid;place-items:center;width:44px;height:44px;}
        }
      `}</style>
    </>
  );
}
