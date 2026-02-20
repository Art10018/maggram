import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

export default function Layout() {
  return (
    <div className="appShell">
      <Sidebar />
      <main className="mainPanel">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
