import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getDefaultRouteForUser, isAdminRole, isProviderRole, isStaffRole } from "../utils/roleRouting";

const ProtectedRoute = ({ children, requireAdmin = false, requireProvider = false }) => {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="lumina-page flex min-h-screen items-center justify-center px-6">
        <div className="lumina-shell text-center">
          <p className="text-sm text-slate-200">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isStaffRole(user)) {
    return <Navigate to="/" replace />;
  }

  const userIsAdmin = isAdminRole(user);
  const userIsProvider = isProviderRole(user);

  if (requireAdmin && !userIsAdmin) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  if (requireProvider && !userIsProvider) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }

  return children;
};

export default ProtectedRoute;
