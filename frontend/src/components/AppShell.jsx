import Sidebar from "./Sidebar.jsx";

export default function AppShell({ children }) {
  return (
    <div
      className="appRoot"
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "#0b0b0f",
        display: "flex",
      }}
    >
      {/* Sidebar (desktop), mobile — будет скрыт через CSS */}
      <div
        className="sidebarWrap"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
        }}
      >
        <Sidebar />
      </div>

      <main
        className="appMain"
        style={{
          flex: 1,
          padding: 14,
          marginLeft: 84, // desktop
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div
          className="appCard"
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
              // важное для мобилки: чтобы контент не прятался под нижним баром
              paddingBottom: 84,
            }}
          >
            <style>{`
              .appScroll::-webkit-scrollbar { width: 10px; }
              .appScroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 999px; }
              .appScroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 999px; }
              .appScroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }

              /* ===== MOBILE LAYOUT ===== */
              @media (max-width: 820px){
                .sidebarWrap { display:none; }
                .appMain { margin-left: 0 !important; padding: 10px !important; }
                .appCard { border-radius: 16px !important; height: calc(100vh - 20px) !important; }
                .appScroll { padding: 14px !important; padding-bottom: 92px !important; }
              }
            `}</style>

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
