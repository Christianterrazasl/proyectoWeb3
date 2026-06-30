import { useCallback, useEffect, useState } from "react";
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
import { AuthContext } from "./auth-context";

function normalizeMePayload(mePayload) {
  if (!mePayload || typeof mePayload !== "object") {
    return null;
  }

  const normalizedUser =
    mePayload.user && typeof mePayload.user === "object"
      ? mePayload.user
      : mePayload;

  const tenantId = normalizedUser?.tenant_id || mePayload.tenant_id;

  return {
    user: normalizedUser,
    memberships: Array.isArray(mePayload.memberships)
      ? mePayload.memberships
      : [],
    accessibleCompanies: Array.isArray(mePayload.accessible_companies)
      ? mePayload.accessible_companies
      : [],
    activeCompanyId: tenantId ?? mePayload.active_company_id ?? null,
    raw: mePayload,
  };
}

function normalizeCompanyId(companyId) {
  const parsedCompanyId = Number(companyId);

  return Number.isInteger(parsedCompanyId) && parsedCompanyId > 0
    ? parsedCompanyId
    : null;
}

function resolveActiveCompanyId(normalizedState) {
  const storedActiveCompanyId = getStoredActiveCompanyId();
  const accessibleCompanies = Array.isArray(
    normalizedState?.accessibleCompanies,
  )
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

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
    setAuthState(null);
  }, []);

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

  const refreshSession = useCallback(async () => {
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
  }, [logout]);

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
  }, [logout, refreshSession]);

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
