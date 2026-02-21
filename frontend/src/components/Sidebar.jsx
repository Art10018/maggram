// frontend/src/components/Sidebar.jsx
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
        onError={(e) => {
          e.currentTarget.removeAttribute("src");
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
        border: "1px solid rgba(255,255,255,.10)",
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
      {/* ===== DESKTOP: левый sidebar (ТОЛЬКО ПК) ===== */}
      <aside className="sidebarDesktop">
        <button
          onClick={() => navigate("/profile")}
          title="My profile"
          style={{
            all: "unset",
            cursor: "pointer",
            marginTop: 14,
            marginBottom: 6,
          }}
        >
          <AvatarMini user={user} size={46} />
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

      {/* ===== MOBILE: нижний navbar (ТОЛЬКО телефон) ===== */}
      <nav className="sidebarMobile" aria-label="Bottom navigation">
        <div className="sidebarMobileInner">
          {/* левый пустой блок — чтобы кнопки были по центру, а аватар справа */}
          <div className="mobileSpacer" />

          {/* 4 кнопки строго по центру */}
          <div className="mobileBtns">
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
                    d="M21 14a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
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
          </div>

          {/* аватар справа, отступ до кнопок = gap кнопок */}
          <button
            className="mobileAvatarBtn"
            onClick={() => navigate("/profile")}
            title="My profile"
            aria-label="Profile"
          >
            <AvatarMini user={user} size={40} />
          </button>
        </div>
      </nav>

      {/* ===== CSS (внутри компонента, чтобы было 1 файлом) ===== */}
      <style>{`
        /* ПК: показываем левый sidebar, скрываем нижний */
        @media (min-width: 901px){
          .sidebarDesktop{
            width: 76px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            position: sticky;
            top: 0;
            height: 100vh;
          }
          .sidebarMobile{ display:none; }
        }

        /* Телефон: скрываем левый sidebar, показываем нижний */
        @media (max-width: 900px){
          .sidebarDesktop{ display:none; }

          .sidebarMobile{
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            height: 64px;
            background: #0b0b0f;              /* НЕ стеклянный островок */
            border-top: 1px solid rgba(255,255,255,0.08);
            z-index: 1000;
          }

          .sidebarMobileInner{
            height: 100%;
            display: grid;
            grid-template-columns: 44px auto 44px; /* слева пусто, по центру кнопки, справа аватар */
            align-items: center;
            column-gap: 18px; /* ✅ это и есть отступ между аватаркой и кнопками */
            padding: 10px 14px;
          }

          .mobileSpacer{ width:44px; height:44px; }

          .mobileBtns{
            display: flex;
            justify-content: center;
            gap: 18px; /* ✅ такой же как column-gap */
          }

          .mobileAvatarBtn{
            all: unset;
            cursor: pointer;
            display: grid;
            place-items: center;
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
    </>
  );
}
