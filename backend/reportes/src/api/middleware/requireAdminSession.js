import { fetchCurrentSession } from "../../infrastructure/auth/sessionClient.js";

function parseCompanyId(rawCompanyId) {
  // El header es opcional: sin él la sesión admin queda global.
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

export function createRequireAdminSession({
  fetchCurrentSession: fetchCurrentSessionDependency = fetchCurrentSession,
} = {}) {
  /**
   * Middleware común para TODA la superficie admin de reportes.
   * Auth valida token, rol y alcance real de empresa; reportes solo reutiliza ese veredicto.
   */
  return async function requireAdminSession(req, res, next) {
    const authorization = req.header("authorization");
    const rawCompanyId = req.header("x-company-id");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Se requiere un token Bearer válido.",
      });
    }

    const parsedCompanyId = parseCompanyId(rawCompanyId);

    if (!parsedCompanyId.ok) {
      return res.status(400).json({
        success: false,
        message: "El header X-Company-Id debe ser un entero.",
      });
    }

    const sessionResult = await fetchCurrentSessionDependency({
      authorization,
      companyId: parsedCompanyId.value,
    });

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

    const resolvedCompanyId = parsedCompanyId.value ?? session.active_company_id ?? null;

    // El cliente puede pedir un scope, pero el contexto real lo resuelve auth.
    // Así evitamos confiar en headers/body para decidir permisos o tenant final.
    req.authContext = {
      ...session,
      resolvedCompanyId,
    };
    req.companyId = resolvedCompanyId;

    return next();
  };
}

export const requireAdminSession = createRequireAdminSession();
