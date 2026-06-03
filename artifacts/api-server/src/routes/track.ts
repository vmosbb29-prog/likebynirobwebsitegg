import { Router, type IRouter } from "express";
import { heartbeat } from "../lib/online.js";

const router: IRouter = Router();

router.post("/track/heartbeat", (req, res) => {
  const { sessionId, page } = req.body as { sessionId?: string; page?: string };
  if (sessionId && typeof sessionId === "string") {
    heartbeat(sessionId.slice(0, 64), (page ?? "/").slice(0, 128));
  }
  res.json({ ok: true });
});

export default router;
