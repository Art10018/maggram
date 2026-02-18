import Sidebar from "./Sidebar.jsx";
import BottomNav from "./BottomNav.jsx";

export default function AppShell({ children }) {
  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "#0b0b0f",
        display: "flex",
      }}
    >
      {/* ПК: Sidebar слева */}
      <div className="desktopOnly" style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50 }}>
        <Sidebar />
      </div>

      {/* контент */}
      <main
        style={{
          flex: 1,
          padding: 14,
          marginLeft: 84, // для ПК (перекроется на мобилке через CSS ниже)
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
        }}
        className="mainWrap"
      >
        <div
          style={{
            height: "calc(100vh - 28px)",
            borderRadius: 18,
            background:
              "radial-gradient(1200px 600px at 20% 20%, rgba(170, 70, 255, 0.18), transparent 55%)," +
              "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
            overflow: "hidden",
            display: "flex",
            minHeight: 0,
          }}
        >
          <div
            className="appScroll"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: 18,
              paddingRight: 12,
            }}
          >
            <style>{`
              .appScroll::-webkit-scrollbar { width: 10px; }
              .appScroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 999px; }
              .appScroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 999px; }
              .appScroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }

              /* ====== responsive переключение ====== */
              .mobileOnly { display: none; }
              .desktopOnly { display: block; }

              @media (max-width: 860px){
                .desktopOnly { display: none !important; }  /* на мобилке скрыли левый sidebar */
                .mobileOnly  { display: block !important; } /* показали нижнюю панель */
                .mainWrap { margin-left: 0 !important; padding: 10px !important; }
                /* чтобы контент не уезжал под нижнюю панель */
                .appScroll { padding-bottom: 92px !important; }
              }
            `}</style>

            {children}
          </div>
        </div>
      </main>

      {/* Мобилка: нижний navbar */}
      <div className="mobileOnly">
        <BottomNav />
      </div>
    </div>
  );
}
