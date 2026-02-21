import React from "react";
import { Link, useLocation } from "react-router-dom";

function FeedIcon() {
  return <svg className="anim-feed" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6.5h16M4 12h16M4 17.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}
function SearchIcon() {
  return <svg className="anim-search" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" /><path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}
function ChatIcon() {
  return <svg className="anim-chat" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="13" height="10" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M8 14 5 17v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><rect x="10" y="9" width="11" height="9" rx="3" stroke="currentColor" strokeWidth="2" /></svg>;
}
function PostIcon() {
  return <svg className="anim-post" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

const Item = ({ to, label, icon, active }) => (
  <Link
    to={to}
    className="mobileMenuItem"
    style={{
      flex: 1,
      textDecoration: "none",
      color: active ? "white" : "rgba(255,255,255,.65)",
      display: "grid",
      placeItems: "center",
      gap: 4,
      padding: "10px 6px",
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        display: "grid",
        placeItems: "center",
        background: active ? "rgba(255,255,255,.14)" : "transparent",
        border: active ? "1px solid rgba(255,255,255,.16)" : "1px solid transparent",
      }}
    >
      {icon}
    </div>
    <div style={{ lineHeight: 1 }}>{label}</div>
  </Link>
);

export default function MobileTabBar() {
  const { pathname } = useLocation();
  const is = (p) => pathname === p || pathname.startsWith(p + "/");

  return (
    <div
      className="mobileOnly"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, rgba(10,10,14,0) 0%, rgba(10,10,14,.72) 28%, rgba(10,10,14,.92) 100%)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,.10)",
          background: "rgba(20,20,28,.72)",
          boxShadow: "0 16px 40px rgba(0,0,0,.45)",
          display: "flex",
          overflow: "hidden",
        }}
      >
        <Item to="/" label="Feed" active={is("/")} icon={<FeedIcon />} />
        <Item to="/search" label="Search" active={is("/search")} icon={<SearchIcon />} />
        <Item to="/chats" label="Chats" active={is("/chats")} icon={<ChatIcon />} />
        <Item to="/new" label="Post" active={is("/new")} icon={<PostIcon />} />
      </div>

      <style>{`
        .mobileMenuItem:active .anim-feed{animation:feedBounce .28s ease}
        .mobileMenuItem:active .anim-search{animation:searchSpin .35s ease}
        .mobileMenuItem:active .anim-chat{animation:chatPop .32s ease}
        .mobileMenuItem:active .anim-post{animation:postPulse .28s ease}
        @keyframes feedBounce{0%{transform:translateY(0)}50%{transform:translateY(-2px) scale(1.08)}100%{transform:translateY(0)}}
        @keyframes searchSpin{0%{transform:rotate(0)}100%{transform:rotate(20deg)}}
        @keyframes chatPop{0%{transform:scale(1)}50%{transform:scale(1.12)}100%{transform:scale(1)}}
        @keyframes postPulse{0%{transform:scale(1)}50%{transform:scale(1.14)}100%{transform:scale(1)}}
      `}</style>
    </div>
  );
}
