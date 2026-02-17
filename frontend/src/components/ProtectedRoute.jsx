import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";

export default function ProtectedRoute() {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Outlet />;
}
