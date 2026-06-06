import { fetchCurrentSession } from "../../infrastructure/auth/sessionClient.js";

function parseCompanyId(rawCompanyId) {
  if (!rawCompanyId) {
    return { ok: true, value: undefined };
  }

  const companyId = Number(rawCompanyId);

  if (!Number.isInteger(companyId)) {
    return { ok: false };
  }

  return {
    ok: true,
    value: companyId,
  };
}

/**
 * Protege endpoints administrativos de catálogo.
 *
 * Responsabilidades:
 * 1. Exigir Bearer token.
 * 2. Leer opcionalmente X-Company-Id para operar sobre un tenant concreto.
 * 3. Validar la sesión real contra el microservicio auth.
 * 4. Permitir solo usuarios con rol global admin.
 * 5. Dejar el contexto resuelto disponible para controladores posteriores.
 */
export async function requireAdminSession(req, res, next) {
  const authorization = req.header("authorization");
  const rawCompanyId = req.header("x-company-id");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Se requiere un token Bearer válido.",
    });
  }

  // X-Company-Id es opcional aquí porque no todas las rutas admin lo necesitan.
  // Pero si viene, debe representar un entero válido.
  const parsedCompanyId = parseCompanyId(rawCompanyId);

  if (!parsedCompanyId.ok) {
    return res.status(400).json({
      success: false,
      message: "El header X-Company-Id debe ser un entero.",
    });
  }

  const companyId = parsedCompanyId.value;

  const sessionResult = await fetchCurrentSession({
    authorization,
    companyId,
  });

  // Si auth rechaza el token, el tenant o la sesión, propagamos ese resultado.
  if (!sessionResult.ok) {
    return res.status(sessionResult.status).json({
      success: false,
      message:
        sessionResult.body?.detail ||
        "No se pudo validar la sesión contra auth.",
    });
  }

  const session = sessionResult.body;

  if (session?.user?.global_role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Solo un administrador puede acceder a este endpoint.",
    });
  }

  // Dejamos el contexto autenticado disponible para el controller.
  req.authContext = session;
  req.companyId = companyId ?? session.active_company_id ?? null;

  return next();
}
