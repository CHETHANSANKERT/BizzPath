import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";
import AccessDenied from "@/components/account/AccessDenied";

const Fallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

export default function PortalRoute({ roles, unauthenticatedElement = <Navigate to="/login" replace /> }) {
  const { isAuthenticated, authChecked } = useAuth();
  const { role, loading } = useProfile();

  if (!authChecked || loading) return <Fallback />;
  if (!isAuthenticated) return unauthenticatedElement;
  if (roles && !roles.includes(role)) return <AccessDenied role={role} />;
  return <Outlet />;
}