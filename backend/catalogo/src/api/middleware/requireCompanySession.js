import { fetchCurrentSession } from "../../infrastructure/auth/sessionClient.js";

/**
 * Valida una sesión autenticada con scope de company SIN aceptar que el cliente
 * elija libremente otro tenant por path/header. El scope sale del contexto real
 * devuelto por auth (`active_company_id`).
 */
export function createRequireCompanySession({
  fetchCurrentSessionFn = fetchCurrentSession,
} = {}) {
  return async function requireCompanySession(req, res, next) {
    const authorization = req.header("authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Se requiere un token Bearer válido.",
      });
    }

    const sessionResult = await fetchCurrentSessionFn({
      authorization,
      companyId: null,
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
    const globalRole = session?.user?.global_role;
    const companyId = session?.active_company_id ?? null;

    if (!["admin", "provider"].includes(globalRole)) {
      return res.status(403).json({
        success: false,
        message: "Solo usuarios administrativos o proveedores pueden acceder.",
      });
    }

    if (companyId === null || companyId === undefined) {
      return res.status(403).json({
        success: false,
        message: "No hay una empresa activa disponible para esta sesión.",
      });
    }

    req.authContext = session;
    req.companyId = companyId;

    return next();
  };
}

export const requireCompanySession = createRequireCompanySession();
