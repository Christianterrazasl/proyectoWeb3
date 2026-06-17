function registerHealthRoutes(app) {
  app.get("/health", (_req, res) => {
    res.json({ service: "deudas", status: "ok" });
  });
}

module.exports = { registerHealthRoutes };
