const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    service: "multipagos-gateway",
    routes: [
      "/api/auth",
      "/api/admin",
      "/api/admin/debts",
      "/api/catalog",
      "/api/payments",
      "/debts",
      "/api/admin/reports",
      "/api/admin/dashboard",
      "/api/admin/audit-logs",
    ],
  });
});

const proxy = (target, pathRewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    ...(pathRewrite ? { pathRewrite } : {}),
  });

app.use(
  "/api/auth",
  proxy("http://auth:3000", {
    "^/": "/api/auth/",
  }),
);
app.use(
  "/api/admin/debts",
  proxy("http://deudas:3000", {
    "^/": "/admin/debts/",
  })
);
app.use(
  "/api/admin/reports",
  proxy("http://reportes:3000", {
    "^/": "/api/admin/reports/",
  }),
);
app.use(
  "/api/admin/dashboard",
  proxy("http://reportes:3000", {
    "^/": "/api/admin/dashboard/",
  }),
);
app.use(
  "/api/admin/exports",
  proxy("http://reportes:3000", {
    "^/": "/api/admin/exports/",
  }),
);
app.use(
  "/api/admin/audit-logs",
  proxy("http://reportes:3000", {
    "^/": "/api/admin/audit-logs/",
  }),
);
app.use("/api/admin", proxy("http://catalogo:3000"));
app.use("/api/catalog", proxy("http://catalogo:3000"));
app.use(
  "/api/payments",
  proxy("http://pagos:3000", {
    "^/": "/api/payments/",
  }),
);
app.use(
  "/debts",
  proxy("http://deudas:3000", {
    "^/": "/debts/",
  })
);

app.listen(PORT, () => {
  console.log(`API Gateway corriendo en http://localhost:${PORT}`);
});
