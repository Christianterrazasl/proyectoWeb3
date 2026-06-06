import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDefaultRouteForUser, isAdminRole } from "../utils/roleRouting";

const ProtectedRoute = ({ children, requireAdmin = false, blockAdmin = false }) => {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="lumina-page flex min-h-screen items-center justify-center px-6">
        <div className="lumina-card rounded-3xl px-6 py-5 text-center">
          <p className="lumina-label text-cyan-300">Cargando sesión</p>
          <p className="mt-3 text-sm text-slate-300">Validando acceso seguro...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userIsAdmin = isAdminRole(user?.global_role);

  if (requireAdmin && !userIsAdmin) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  if (blockAdmin && userIsAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
