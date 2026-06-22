const ACCESS_KEY = "auth_access";
const REFRESH_KEY = "auth_refresh";
const USER_KEY = "auth_user";
const ACTIVE_COMPANY_KEY = "auth_active_company_id";

export function saveAuthSession({ access, refresh, user }) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Guardamos la empresa activa en frontend para recordar el scope
// entre recargas y futuras llamadas protegidas.
export function saveActiveCompanyId(companyId) {
  if (companyId === null || companyId === undefined || companyId === "") {
    localStorage.removeItem(ACTIVE_COMPANY_KEY);
    return;
  }

  localStorage.setItem(ACTIVE_COMPANY_KEY, String(companyId));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function getStoredActiveCompanyId() {
  const rawCompanyId = localStorage.getItem(ACTIVE_COMPANY_KEY);

  if (!rawCompanyId) {
    return null;
  }

  const parsedCompanyId = Number(rawCompanyId);

  if (!Number.isInteger(parsedCompanyId) || parsedCompanyId <= 0) {
    localStorage.removeItem(ACTIVE_COMPANY_KEY);
    return null;
  }

  return parsedCompanyId;
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACTIVE_COMPANY_KEY);
}