import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";
import Avatar from "./Avatar.jsx";
import logo from "../assets/logo.png";

const styles = {
  app: {
    minHeight: "100vh",
    background: "#0b0b0d",
    color: "rgba(255,255,255,.92)",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "84px 1fr",
    gap: 18,
    padding: 18,
  },
  sidebar: {
    height: "calc(100vh - 36px)",
    borderRadius: 18,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    backdropFilter: "blur(16px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 12,
  },
  sbIcon: (active) => ({
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    color: active ? "white" : "rgba(255,255,255,.7)",
    background: active ? "rgba(255,255,255,.14)" : "transparent",
    border: active ? "1px solid rgba(255,255,255,.14)" : "1px solid transparent",
    textDecoration: "none",
    transition: "all .15s ease",
    marginTop: 8,
  }),
  mainCard: {
    height: "calc(100vh - 36px)",
    borderRadius: 22,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    backdropFilter: "blur(18px)",
    overflow: "hidden",
    display: "grid",
    gridTemplateRows: "64px 1fr",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    borderBottom: "1px solid rgba(255,255,255,.08)",
    background: "rgba(0,0,0,.25)",
  },
  tabs: {
    display: "flex",
    gap: 10,
    padding: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.08)",
  },
  tabBtn: (active) => ({
    padding: "10px 14px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    color: active ? "#0b0b0d" : "rgba(255,255,255,.85)",
    background: active ? "rgba(255,255,255,.92)" : "transparent",
  }),
  content: {
    overflow: "auto",
    padding: 18,
  },
  userBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoutBtn: {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.08)",
    color: "rgba(255,255,255,.92)",
    cursor: "pointer",
    fontWeight: 700,
  },
};

function Icon({ children }) {
  return <div style={{ fontSize: 20, lineHeight: 1 }}>{children}</div>;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // табы “Для вас / Тренды” чисто визуально
  const [tab, setTab] = useState("forYou");

  const isActive = (path) => location.pathname === path;

  const myProfileLink = useMemo(() => {
    // если у тебя "мой профиль" открывается по /profile/:id — оставляем так
    // (у тебя так и было раньше)
    const myId = user?.id;
    return myId ? `/profile/${myId}` : "/profile/me";
  }, [user?.id]);

  return (
    <div style={styles.app}>
      <div style={styles.layout}>
        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          <NavLink to="/" style={{ display: "grid", placeItems: "center" }} title="Главная">
            <img src={logo} alt="logo" style={{ width: 44, height: 44 }} />
          </NavLink>

          <NavLink to="#" style={styles.sbIcon(false)} title="Поиск (скоро)">
            <Icon>🔎</Icon>
          </NavLink>

          <NavLink to="/" style={styles.sbIcon(isActive("/"))} title="Feed">
            <Icon>📰</Icon>
          </NavLink>

          <NavLink to="#" style={styles.sbIcon(false)} title="Чаты (скоро)">
            <Icon>💬</Icon>
          </NavLink>

          <NavLink to="/new-post" style={styles.sbIcon(isActive("/new-post"))} title="Создать пост">
            <Icon>➕</Icon>
          </NavLink>

          <div style={{ flex: 1 }} />

          <NavLink to={myProfileLink} style={{ textDecoration: "none" }} title="Мой профиль">
            <Avatar user={user} size={46} />
          </NavLink>
        </aside>

        {/* MAIN */}
        <section style={styles.mainCard}>
          {/* TOPBAR */}
          <div style={styles.topbar}>
            <div style={styles.tabs}>
              <button style={styles.tabBtn(tab === "forYou")} onClick={() => setTab("forYou")}>
                Для вас
              </button>
              <button style={styles.tabBtn(tab === "trends")} onClick={() => setTab("trends")}>
                Тренды
              </button>
            </div>

            <div style={styles.userBox}>
              <Avatar user={user} size={34} />
              <div style={{ fontWeight: 800 }}>{user?.displayName || user?.username || "User"}</div>
              <button
                style={styles.logoutBtn}
                onClick={() => {
                  logout();
                  nav("/login");
                }}
              >
                Logout
              </button>
            </div>
          </div>

          <div style={styles.content}>
            {/* тут рендерятся страницы */}
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}
