const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

// Middlewares globales
app.use(cors());
app.use(morgan("dev"));

// ---------------------------------------------------------
// MAPA DE RUTAS
// ---------------------------------------------------------
app.get("/", (_req, res) => {
  res.json({
    service: "multipagos-gateway",
    status: "active",
    instrucciones_frontend: {
      requerimiento_1_y_2:
        "Llamar a GET /api/catalog/public/services al iniciar la página para armar el buscador.",
      requerimiento_3:
        "Llamar a GET /debts/lookup?tenantId=X&serviceId=Y&customerRef=Z al darle al botón buscar.",
      requerimiento_4:
        "El login en POST /api/auth/login ahora devuelve el 'tenant_id' del admin de empresa.",
    },
    public_routes: [
      "GET /api/catalog/public/services",
      "GET /debts/lookup",
      "POST /api/auth/login",
    ],
    protected_routes: [
      "/api/admin/*",
      "/api/catalog/*",
      "/api/payments/*",
      "/api/admin/reports/*",
    ],
  });
});

// ---------------------------------------------------------
// ENRUTADOR (Proxy Middleware)
// ---------------------------------------------------------
const proxy = (target, pathRewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    ...(pathRewrite ? { pathRewrite } : {}),
  });

// Auth
app.use("/api/auth", proxy("http://auth:3000", { "^/": "/api/auth/" }));

// Reportes y Logs
app.use(
  "/api/admin/reports",
  proxy("http://reportes:3000", { "^/": "/api/admin/reports/" }),
);
app.use(
  "/api/admin/dashboard",
  proxy("http://reportes:3000", { "^/": "/api/admin/dashboard/" }),
);
app.use(
  "/api/admin/exports",
  proxy("http://reportes:3000", { "^/": "/api/admin/exports/" }),
);
app.use(
  "/api/admin/audit-logs",
  proxy("http://reportes:3000", { "^/": "/api/admin/audit-logs/" }),
);

// Catálogo (Protegido y Público)
app.use("/api/admin", proxy("http://catalogo:3000"));
app.use("/api/catalog", proxy("http://catalogo:3000"));

// Pagos
app.use(
  "/api/payments",
  proxy("http://pagos:3000", { "^/": "/api/payments/" }),
);

// Deudas (Protegido y Público)
app.use(
  "/api/admin/debts",
  proxy("http://deudas:3000", { "^/": "/admin/debts/" }),
);
app.use("/debts", proxy("http://deudas:3000", { "^/": "/debts/" }));

// Inicialización
app.listen(PORT, () => {
  console.log(`API Gateway corriendo en http://localhost:${PORT}`);
});
