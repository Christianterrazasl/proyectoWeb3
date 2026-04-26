const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(
  "/auth",
  createProxyMiddleware({
    target: "http://auth:3000",
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
  })
);

app.use(
  "/catalogo",
  createProxyMiddleware({
    target: "http://catalogo:3000",
    changeOrigin: true,
    pathRewrite: { "^/catalogo": "" },
  })
);

app.use(
  "/deudas",
  createProxyMiddleware({
    target: "http://deudas:3000",
    changeOrigin: true,
    pathRewrite: { "^/deudas": "" },
  })
);

app.use(
  "/pagos",
  createProxyMiddleware({
    target: "http://pagos:3000",
    changeOrigin: true,
    pathRewrite: { "^/pagos": "" },
  })
);

app.use(
  "/reportes",
  createProxyMiddleware({
    target: "http://reportes:3000",
    changeOrigin: true,
    pathRewrite: { "^/reportes": "" },
  })
);

app.listen(PORT, () => {
  console.log(`API Gateway corriendo en http://localhost:${PORT}`);
});