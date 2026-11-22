import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { publicRoutes } from "./routes/public";
import { authRoutes } from "./routes/auth";
import { orderRoutes } from "./routes/orders";
import { adminRoutes } from "./routes/admin";
import { catalogRoutes } from "./routes/admin-catalog";
import { mediaRoutes } from "./routes/media";
import { customerRoutes } from "./routes/customer";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","), credentials: true }));
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());
  app.use("/api", rateLimit({ windowMs: 60_000, limit: 240 }));
  const strict = rateLimit({ windowMs: 60_000, limit: 10 });  // anti-spam on public write endpoints
  app.post(["/api/orders", "/api/contact", "/api/newsletter"], strict);
  app.post("/api/auth/admin/login", rateLimit({ windowMs: 15 * 60_000, limit: 10, message: { error: "Too many login attempts, try again later" } }));
  // CSRF defence in depth: cookies are SameSite=Lax; additionally reject cross-origin state-changing requests.
  const allowed = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");
  app.use((req, res, next) => {
    const o = req.headers.origin;
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && o && !allowed.includes(o)) return res.status(403).json({ error: "Origin not allowed" });
    next();
  });
  app.use("/api/auth", rateLimit({ windowMs: 15 * 60_000, limit: 30 }));
  app.get("/health", (_q, r) => r.json({ ok: true }));
  app.use("/api/auth", authRoutes);
  app.use("/api", publicRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/me", customerRoutes);
  app.use("/api/admin/media", mediaRoutes);
  app.use("/api/admin", catalogRoutes);
  app.use("/api/admin", adminRoutes);
  app.use((err: any, _q: express.Request, res: express.Response, _n: express.NextFunction) => {
    if (err?.name === "ZodError") return res.status(400).json({ error: "Validation failed", issues: err.issues });
    if (err?.name === "MulterError") return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: err.code === "LIMIT_FILE_SIZE" ? `File too large (max ${process.env.UPLOAD_MAX_MB || 8} MB)` : err.message });
    if (err?.code === "P2025") return res.status(404).json({ error: "Not found" });
    if (err?.code === "P2002") return res.status(409).json({ error: `Already exists: ${(err.meta?.target || []).join?.(", ") || "duplicate value"}` });
    if (err?.code === "P2003") return res.status(409).json({ error: "Referenced record does not exist or is still in use" });
    if (err?.status) return res.status(err.status).json({ error: err.message });
    console.error(err); res.status(500).json({ error: "Internal error" });
  });
  return app;
}
