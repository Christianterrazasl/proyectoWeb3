const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = 3000; 

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

// Deudas admin (debe ir ANTES del catch-all /api/admin del catálogo)
app.use(
  "/api/admin/debts",
  proxy("http://deudas:3000", { "^/": "/admin/debts/" }),
);
app.use(
  "/api/admin/providers",
  proxy("http://deudas:3000", { "^/": "/admin/providers/" }),
);

// Catálogo admin (rutas explícitas antes del catch-all)
app.use(
  "/api/admin/companies",
  proxy("http://catalogo:3000", { "^/api/admin/companies": "/api/companies" }),
);
app.use(
  "/api/admin/services",
  proxy("http://catalogo:3000", { "^/api/admin/services": "/api/services" }),
);

// Catálogo admin
app.use(
  "/api/admin",
  proxy("http://catalogo:3000", { "^/": "/api/admin/" }),
);

// Catálogo público
app.use(
  createProxyMiddleware({
    target: "http://catalogo:3000",
    changeOrigin: true,
    pathFilter: (pathname) => pathname.startsWith("/api/catalog"),
    pathRewrite: (path) => path.replace(/^\/api\/catalog/, "/api"),
  }),
);

// Pagos
app.use(
  "/api/payments",
  createProxyMiddleware({
    target: "http://pagos:3000",
    changeOrigin: true,
    pathRewrite: { "^/": "/api/payments/" },
    onProxyRes(proxyRes) {
      const contentType = proxyRes.headers["content-type"] || "";

      if (contentType.startsWith("text/html") && !contentType.includes("charsesit=")) {
        proxyRes.headers["content-type"] = "text/html; charset=utf-8";
      }
    },
  }),
);

// Deudas públicas
app.use("/debts", proxy("http://deudas:3000", { "^/": "/debts/" }));

// Inicialización
app.listen(PORT, () => {
  console.log(`API Gateway corriendo en http://localhost:${PORT}`);
});
