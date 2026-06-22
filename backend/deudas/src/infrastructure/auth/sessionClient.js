const AUTH_ME_URL = process.env.AUTH_ME_URL || "http://auth:3000/api/auth/me/";

async function fetchCurrentSession({ authorization, companyId }) {
  const headers = {
    Accept: "application/json",
    Authorization: authorization,
  };

  if (companyId !== undefined && companyId !== null) {
    headers["X-Company-Id"] = String(companyId);
  }

  try {
    const response = await fetch(AUTH_ME_URL, { method: "GET", headers });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, status: response.status, body };
    }

    return { ok: true, status: response.status, body };
  } catch {
    return {
      ok: false,
      status: 502,
      body: { detail: "No se pudo contactar al servicio de autenticación." },
    };
  }
}

module.exports = { fetchCurrentSession };
