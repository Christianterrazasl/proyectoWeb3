import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    service: "reportes",
    status: "ready",
  });
});

router.get("/health", (_req, res) => {
  res.status(200).json({
    service: "reportes",
    status: "ok",
  });
});

export default router;
