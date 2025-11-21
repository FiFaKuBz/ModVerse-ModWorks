import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "./SessionContext";

export default function ProtectedRoute({ children }) {
  const { expiresAt } = useSession();
  if (!expiresAt || Date.now() > expiresAt) {
    return <Navigate to="/login" replace />;
  }
  // When used as <Route element={<ProtectedRoute />}>,
  // render nested routes via <Outlet />
  return children || <Outlet />;
}
