import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve built frontend in production (Render deployment)
// In dev the Vite server handles the frontend separately
if (process.env.NODE_ENV === "production") {
  // The built frontend lives at <repo-root>/artifacts/slv/dist/public/
  // process.cwd() on Render is the repo root
  const staticDir = path.join(process.cwd(), "artifacts", "slv", "dist", "public");

  if (existsSync(staticDir)) {
    logger.info({ staticDir }, "Serving frontend static files");
    app.use(express.static(staticDir, { maxAge: "1d" }));
    // SPA fallback — all non-API routes serve index.html
    app.use((_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  } else {
    logger.warn({ staticDir }, "Frontend static dir not found — frontend not served");
  }
}

export default app;
