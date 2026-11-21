import { Navigate } from "react-router-dom";
import { useProfile } from "@/lib/ProfileContext";
import { portalHome } from "@/lib/portal";

export default function PortalRedirect() {
  const { role, loading } = useProfile();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return <Navigate to={portalHome(role)} replace />;
}