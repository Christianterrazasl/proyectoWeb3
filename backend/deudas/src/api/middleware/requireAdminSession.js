const { fetchCurrentSession } = require("../../infrastructure/auth/sessionClient");

function createRequireAdminSession({
  fetchCurrentSession: fetchCurrentSessionDependency = fetchCurrentSession,
} = {}) {
  return async function requireAdminSession(req, res, next) {
    const authorization = req.header("authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Se requiere un token Bearer válido.",
      });
    }

    const sessionResult = await fetchCurrentSessionDependency({
      authorization,
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

    if (globalRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Solo un administrador puede acceder a este endpoint.",
      });
    }

    req.authContext = session;
    return next();
  };
}

const requireAdminSession = createRequireAdminSession();

module.exports = { createRequireAdminSession, requireAdminSession };
