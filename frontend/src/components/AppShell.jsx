import Sidebar from "./Sidebar.jsx";

export default function AppShell({ children }) {
  return (
    <div
      style={{
        height: "100vh",          // ✅ фиксируем высоту экрана
        overflow: "hidden",       // ✅ отключаем общий скролл у всей страницы
        background: "#0b0b0f",
        display: "flex",
      }}
    >
      {/* ✅ Sidebar фиксированный, не скроллится */}
      <div
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

      {/* ✅ контент с отступом слева под Sidebar */}
      <main
        style={{
          flex: 1,
          padding: 14,
          marginLeft: 84, // ⚠️ подгони под реальную ширину твоего Sidebar (обычно 76–90)
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "calc(100vh - 28px)", // ✅ вместо minHeight — реальная высота
            borderRadius: 18,
            background:
              "radial-gradient(1200px 600px at 20% 20%, rgba(170, 70, 255, 0.18), transparent 55%)," +
              "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.55)",
            overflow: "hidden",
            display: "flex",     // ✅ важно: делаем flex-контейнер
            minHeight: 0,
          }}
        >
          {/* ✅ вот тут будет скролл для любой страницы (Feed/Profile/Settings) */}
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
            {/* красивый скролл (только тут) */}
            <style>{`
              .appScroll::-webkit-scrollbar { width: 10px; }
              .appScroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 999px; }
              .appScroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 999px; }
              .appScroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }
            `}</style>

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
