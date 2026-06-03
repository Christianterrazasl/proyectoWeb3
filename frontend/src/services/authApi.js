import { AUTH_API_ROUTES } from "../config/authApiRoutes";

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
      throw new Error(getErrorMessage(data, "Error al iniciar sesión"));
    }

    return data;
  } catch (error) {
    console.error("Login request failed:", error);
    throw error;
  }
}

export async function getMeRequest(accessToken) {
  try {
    const response = await fetch(AUTH_API_ROUTES.me, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, "No se pudo recuperar la sesión"));
    }

    return data;
  } catch (error) {
    console.error("Get Me request failed:", error);
    throw error;
  }
}
