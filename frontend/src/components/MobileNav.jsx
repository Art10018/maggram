import React from "react";
import { Link, useLocation } from "react-router-dom";

const Item = ({ to, label, icon, active }) => (
  <Link
    to={to}
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
        background:
          "linear-gradient(180deg, rgba(10,10,14,0) 0%, rgba(10,10,14,.72) 28%, rgba(10,10,14,.92) 100%)",
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
        <Item
          to="/"
          label="Feed"
          active={is("/")}
          icon={<span style={{ fontSize: 18 }}>🏠</span>}
        />
        <Item
          to="/search"
          label="Search"
          active={is("/search")}
          icon={<span style={{ fontSize: 18 }}>🔎</span>}
        />
        <Item
          to="/chats"
          label="Chats"
          active={is("/chats")}
          icon={<span style={{ fontSize: 18 }}>💬</span>}
        />
        <Item
          to="/new"
          label="Post"
          active={is("/new")}
          icon={<span style={{ fontSize: 18 }}>＋</span>}
        />
      </div>
    </div>
  );
}
