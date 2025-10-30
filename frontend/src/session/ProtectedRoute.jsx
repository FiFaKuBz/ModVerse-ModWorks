import { Navigate } from "react-router-dom";
import { useSession } from "./SessionProvider";

export default function ProtectedRoute({ children }) {
  const { expiresAt } = useSession();
  if (!expiresAt || Date.now() > expiresAt) {
    return <Navigate to="/" replace />;
  }
  return children;
}
