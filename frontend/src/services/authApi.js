import { AUTH_API_ROUTES } from "../config/authApiRoutes.js";
import { getStoredActiveCompanyId } from "../utils/authStorage.js";

class AuthApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "AuthApiError";
    this.status = status ?? null;
    this.data = data ?? null;
  }
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return null;
}

function getErrorMessage(data, fallback) {
  return data?.detail || data?.email?.[0] || data?.password?.[0] || fallback;
}

function buildAuthApiError(response, data, fallback) {
  return new AuthApiError(getErrorMessage(data, fallback), {
    status: response.status,
    data,
  });
}

// Este helper será la base para futuras llamadas autenticadas.
// Agrega JWT y, cuando corresponda, también X-Company-Id.
export function buildAuthenticatedHeaders(
  accessToken,
  companyId = getStoredActiveCompanyId(),
) {
  const headers = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (companyId !== null && companyId !== undefined && companyId !== "") {
    headers["X-Company-Id"] = String(companyId);
  }

  return headers;
}

export function buildAuthenticatedRequestInit({
  accessToken,
  companyId = getStoredActiveCompanyId(),
  headers = {},
  ...requestInit
} = {}) {
  return {
    ...requestInit,
    headers: {
      ...headers,
      ...buildAuthenticatedHeaders(accessToken, companyId),
    },
  };
}

export async function loginRequest({ email, password }) {
  try {
    const response = await fetch(AUTH_API_ROUTES.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw buildAuthApiError(response, data, "Error al iniciar sesión");
    }

    return data;
  } catch (error) {
    console.error("Login request failed:", error);
    throw error;
  }
}

export async function getMeRequest(accessToken) {
  try {
    const response = await fetch(
      AUTH_API_ROUTES.me,
      buildAuthenticatedRequestInit({
        method: "GET",
        // OJO: aquí NO mandamos X-Company-Id todavía para no romper el bootstrap
        // si quedó una empresa vieja guardada en localStorage.
        accessToken,
        companyId: null,
      }),
    );

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw buildAuthApiError(response, data, "No se pudo recuperar la sesión");
    }

    return data;
  } catch (error) {
    console.error("Get Me request failed:", error);
    throw error;
  }
}

export async function refreshAccessTokenRequest(refreshToken) {
  const response = await fetch(AUTH_API_ROUTES.refresh, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw buildAuthApiError(response, data, "No se pudo renovar la sesión");
  }

  return data;
}

export async function listCompaniesRequest(accessToken) {
  const response = await fetch(
    AUTH_API_ROUTES.companies,
    buildAuthenticatedRequestInit({
      method: "GET",
      accessToken,
      companyId: null,
    }),
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw buildAuthApiError(response, data, "No se pudieron cargar las empresas");
  }

  return Array.isArray(data) ? data : [];
}

export async function createCompanyRequest(
  accessToken,
  { name, nit, fiscal_address, logo_url, description, category },
) {
  const response = await fetch(
    AUTH_API_ROUTES.companies,
    buildAuthenticatedRequestInit({
      method: "POST",
      accessToken,
      companyId: null,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        nit,
        fiscal_address,
        logo_url,
        description,
        category,
      }),
    }),
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw buildAuthApiError(response, data, "No se pudo crear la empresa");
  }

  return data;
}

export async function deleteCompanyRequest(accessToken, companyId) {
  const response = await fetch(
    `${AUTH_API_ROUTES.companies}${companyId}/`,
    buildAuthenticatedRequestInit({
      method: "DELETE",
      accessToken,
      companyId: null,
    }),
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw buildAuthApiError(response, data, "No se pudo eliminar la empresa");
  }

  return data;
}
