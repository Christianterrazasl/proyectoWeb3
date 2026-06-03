const rawAuthApiUrl = import.meta.env.VITE_AUTH_API_URL || "/api/auth";

const authApiBaseUrl = rawAuthApiUrl.endsWith("/")
  ? rawAuthApiUrl.slice(0, -1)
  : rawAuthApiUrl;

export const AUTH_API_ROUTES = Object.freeze({
  base: authApiBaseUrl,
  login: `${authApiBaseUrl}/login/`,
  register: `${authApiBaseUrl}/register/`,
  me: `${authApiBaseUrl}/me/`,
  users: `${authApiBaseUrl}/users/`,
  companies: `${authApiBaseUrl}/companies/`,
  memberships: `${authApiBaseUrl}/memberships/`,
});
