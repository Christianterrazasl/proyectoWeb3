/**
 * Reportes NO interpreta ni valida tokens por su cuenta.
 * Ese contrato vive en auth para evitar reglas duplicadas entre microservicios.
 */
const DEFAULT_AUTH_ME_URL =
  process.env.AUTH_ME_URL || "http://auth:3000/api/auth/me/";

export function createSessionClient({
  authMeUrl = DEFAULT_AUTH_ME_URL,
  fetchImpl = fetch,
} = {}) {
  /**
   * Resuelve la sesión administrativa vigente consultando al servicio auth.
   * También reenvía `X-Company-Id` cuando el admin quiere operar con un scope puntual.
   */
  return async function fetchCurrentSession({ authorization, companyId }) {
    const headers = {
      Accept: "application/json",
      Authorization: authorization,
    };

    if (companyId !== undefined && companyId !== null) {
      headers["X-Company-Id"] = String(companyId);
    }

    try {
      const response = await fetchImpl(authMeUrl, {
        method: "GET",
        headers,
      });

      const body = await response.json().catch(() => null);

      return {
        ok: response.ok,
        status: response.status,
        body,
      };
    } catch {
      return {
        ok: false,
        status: 502,
        body: {
          detail: "No se pudo contactar al servicio de autenticación.",
        },
      };
    }
  };
}

export const fetchCurrentSession = createSessionClient();
