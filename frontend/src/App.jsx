import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppShell from "./components/AppShell.jsx";

import Feed from "./pages/Feed.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import NewPost from "./pages/NewPost.jsx";
import Settings from "./pages/Settings.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

import Chats from "./pages/Chats.jsx";
import ChatRoom from "./pages/ChatRoom.jsx";

// заглушка под будущие экраны
function ComingSoon({ title }) {
  return (
    <div style={{ color: "rgba(255,255,255,0.85)" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div style={{ opacity: 0.7 }}>Soon...</div>
    </div>
  );
}

function Shell() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* private */}
      <Route element={<ProtectedRoute />}>
        {/* все приватные страницы живут внутри одного AppShell */}
        <Route element={<Shell />}>
          <Route path="/" element={<Feed />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />

          <Route path="/new-post" element={<NewPost />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="/search" element={<ComingSoon title="Search" />} />

          {/* ✅ ЧАТЫ: layout + вложенный роут комнаты */}
          <Route path="/chats" element={<Chats />}>
            <Route index element={<div style={{ color: "rgba(255,255,255,0.75)", fontWeight: 800 }}>Выбери чат слева</div>} />
            <Route path=":id" element={<ChatRoom />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
