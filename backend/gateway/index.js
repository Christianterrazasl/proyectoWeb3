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
      "/api/catalog",
      "/api/payments",
      "/debts",
      "/reportes",
    ],
  });
});

const proxy = (target, pathRewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    ...(pathRewrite ? { pathRewrite } : {}),
  });

app.use("/api/auth", proxy("http://auth:3000"));
app.use("/api/admin", proxy("http://catalogo:3000"));
app.use("/api/catalog", proxy("http://catalogo:3000"));
app.use("/api/payments", proxy("http://pagos:3000"));
app.use(
  "/debts",
  proxy("http://deudas:3000", {
    "^/": "/debts/",
  })
);
app.use("/reportes", proxy("http://reportes:3000"));

app.listen(PORT, () => {
  console.log(`API Gateway corriendo en http://localhost:${PORT}`);
});
