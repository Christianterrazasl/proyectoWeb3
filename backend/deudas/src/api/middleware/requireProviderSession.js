const { fetchCurrentSession } = require("../../infrastructure/auth/sessionClient");

function parseCompanyId(rawCompanyId) {
  if (!rawCompanyId) {
    return { ok: false, required: true };
  }

  const companyId = Number(rawCompanyId);

  if (!Number.isInteger(companyId) || companyId <= 0) {
    return { ok: false, required: false };
  }

  return { ok: true, value: companyId };
}

async function requireProviderSession(req, res, next) {
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
      message: parsedCompanyId.required
        ? "El header X-Company-Id es obligatorio para operaciones de proveedor."
        : "El header X-Company-Id debe ser un entero válido.",
    });
  }

  const sessionResult = await fetchCurrentSession({
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
  const globalRole = session?.user?.global_role;

  if (!["provider", "admin"].includes(globalRole)) {
    return res.status(403).json({
      success: false,
      message: "Solo proveedores o administradores pueden acceder a este endpoint.",
    });
  }

  req.authContext = session;
  req.companyId = parsedCompanyId.value;
  req.tenantId = String(parsedCompanyId.value);

  return next();
}

module.exports = { requireProviderSession };
