import { createContext, useContext, useEffect, useState } from "react";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredActiveCompanyId,
  saveActiveCompanyId,
  saveAuthSession,
} from "../utils/authStorage";
import { getMeRequest } from "../services/authApi";
import { getActiveCompany } from "../utils/tenancyUi";

const AuthContext = createContext(null);

function normalizeMePayload(mePayload) {
  if (!mePayload || typeof mePayload !== "object") {
    return null;
  }

  const normalizedUser =
    mePayload.user && typeof mePayload.user === "object"
      ? mePayload.user
      : mePayload;

  return {
    user: normalizedUser,
    memberships: Array.isArray(mePayload.memberships)
      ? mePayload.memberships
      : [],
    accessibleCompanies: Array.isArray(mePayload.accessible_companies)
      ? mePayload.accessible_companies
      : [],
    activeCompanyId: mePayload.active_company_id ?? null,
    raw: mePayload,
  };
}

function normalizeCompanyId(companyId) {
  const parsedCompanyId = Number(companyId);

  return Number.isInteger(parsedCompanyId) && parsedCompanyId > 0
    ? parsedCompanyId
    : null;
}

// Regla del frontend:
// 1. si hay una empresa guardada y el usuario todavía tiene acceso, la usamos
// 2. si no, usamos la que venga desde /me
// 3. si tampoco existe, usamos la primera accesible
function resolveActiveCompanyId(normalizedState) {
  const storedActiveCompanyId = getStoredActiveCompanyId();
  const accessibleCompanies = Array.isArray(normalizedState?.accessibleCompanies)
    ? normalizedState.accessibleCompanies
    : [];

  const hasStoredAccessibleCompany = accessibleCompanies.some(
    (company) => company.id === storedActiveCompanyId,
  );

  const fallbackCompanyId =
    normalizedState?.activeCompanyId ?? accessibleCompanies[0]?.id ?? null;

  const nextActiveCompanyId = hasStoredAccessibleCompany
    ? storedActiveCompanyId
    : fallbackCompanyId;

  saveActiveCompanyId(nextActiveCompanyId);

  return nextActiveCompanyId;
}

function buildAuthState(mePayload) {
  const normalized = normalizeMePayload(mePayload);

  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    activeCompanyId: resolveActiveCompanyId(normalized),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authState, setAuthState] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const user = authState?.user ?? null;
  const memberships = authState?.memberships ?? [];
  const accessibleCompanies = authState?.accessibleCompanies ?? [];
  const activeCompanyId = authState?.activeCompanyId ?? null;
  const activeCompany = getActiveCompany(accessibleCompanies, activeCompanyId);

  const isAuthenticated = Boolean(user && session?.access && session?.refresh);

  const login = ({ access, refresh, me }) => {
    const nextAuthState = buildAuthState(me);

    saveAuthSession({ access, refresh, user: me });
    setSession({ access, refresh });
    setAuthState(nextAuthState);
  };

  const logout = () => {
    clearAuthSession();
    setSession(null);
    setAuthState(null);
  };

  // Esto cambia el tenant activo SOLO en frontend por ahora.
  // Luego las futuras APIs protegidas usarán este valor en X-Company-Id.
  const setActiveCompany = (companyId) => {
    const nextCompanyId = normalizeCompanyId(companyId);

    setAuthState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const hasAccess = currentState.accessibleCompanies.some(
        (company) => company.id === nextCompanyId,
      );

      if (!hasAccess) {
        return currentState;
      }

      saveActiveCompanyId(nextCompanyId);

      return {
        ...currentState,
        activeCompanyId: nextCompanyId,
      };
    });
  };

  const refreshSession = async () => {
    const access = getAccessToken();
    const refresh = getRefreshToken();

    if (!access || !refresh) {
      logout();
      return;
    }

    const meData = await getMeRequest(access);
    const nextAuthState = buildAuthState(meData);

    saveAuthSession({ access, refresh, user: meData });
    setSession({ access, refresh });
    setAuthState(nextAuthState);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        await refreshSession();
      } catch (error) {
        console.error("Error during auth bootstrap:", error);
        logout();
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        memberships,
        accessibleCompanies,
        activeCompanyId,
        activeCompany,
        isAuthenticated,
        isBootstrapping,
        login,
        logout,
        refreshSession,
        setActiveCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
