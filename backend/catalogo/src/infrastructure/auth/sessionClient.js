/**
 * Cliente HTTP mínimo para consultar el contexto de sesión al microservicio auth.
 * Catálogo NO valida JWT por su cuenta: delega autenticación/autorización a auth.
 */
const AUTH_ME_URL =
  process.env.AUTH_ME_URL || "http://auth:3000/api/auth/me/";

export async function fetchCurrentSession({ authorization, companyId }) {
  const headers = {
    Accept: "application/json",
    Authorization: authorization,
  };

  // Solo mandamos el tenant si el request ya lo trae.
  if (companyId !== undefined && companyId !== null) {
    headers["X-Company-Id"] = String(companyId);
  }

  try {
    const response = await fetch(AUTH_ME_URL, {
      method: "GET",
      headers,
    });

    const body = await response.json().catch(() => null);

    // No lanzamos excepción: devolvemos un resultado uniforme para que
    // el middleware decida cómo responder al cliente.
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        body,
      };
    }

    return {
      ok: true,
      status: response.status,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      body: {
        detail: "No se pudo contactar al servicio de autenticación.",
      },
    };
  }
}