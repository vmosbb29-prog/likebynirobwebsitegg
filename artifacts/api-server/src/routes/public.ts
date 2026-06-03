import { Router, type IRouter } from "express";
import { db, keysTable, logsTable, bannedIpsTable, autoLikeTasksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getSettings } from "../lib/settings.js";
import { notifyLike, notifyVisit, notifyKeyCheck } from "../lib/telegram.js";
import { getOnlineCount } from "../lib/online.js";

const router: IRouter = Router();

router.post("/public/check-key", async (req, res) => {
  const { key } = req.body as { key?: string };
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "unknown";

  if (!key) {
    res.status(400).json({ message: "Key required" });
    return;
  }

  try {
    const [banned] = await db.select().from(bannedIpsTable).where(eq(bannedIpsTable.ip, ip)).limit(1);
    if (banned) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const [keyRow] = await db.select().from(keysTable).where(eq(keysTable.key, key)).limit(1);
    if (!keyRow) {
      notifyKeyCheck(key, false, ip).catch(() => {});
      res.status(404).json({ message: "Key not found" });
      return;
    }

    notifyKeyCheck(key, new Date(keyRow.expiresAt).getTime() > Date.now(), ip).catch(() => {});
    res.json({
      key: keyRow.key,
      expiresAt: keyRow.expiresAt,
      likeUsed: keyRow.likeUsed,
      visitUsed: keyRow.visitUsed,
      usedCount: keyRow.usedCount,
      useLimit: keyRow.useLimit,
    });
  } catch (err) {
    req.log.error({ err }, "check-key error");
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/public/like", async (req, res) => {
  const { key, uid, region } = req.body as { key?: string; uid?: string; region?: string };
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "unknown";

  if (!key || !uid || !region) {
    res.status(400).json({ message: "key, uid, and region are required" });
    return;
  }

  try {
    const [banned] = await db.select().from(bannedIpsTable).where(eq(bannedIpsTable.ip, ip)).limit(1);
    if (banned) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const settings = await getSettings();
    if (!settings.likeEnabled) {
      res.status(503).json({ message: "Like Method In Maintenance — Please try again later", maintenance: true });
      return;
    }

    const [keyRow] = await db.select().from(keysTable).where(eq(keysTable.key, key)).limit(1);
    if (!keyRow) {
      await db.insert(logsTable).values({ key, uid, region, action: "like", status: "fail", ipAddress: ip });
      res.status(404).json({ message: "Key not found" });
      return;
    }

    if (new Date(keyRow.expiresAt).getTime() < Date.now()) {
      await db.insert(logsTable).values({ key, uid, region, action: "like", status: "fail", ipAddress: ip });
      res.status(403).json({ message: "Key expired" });
      return;
    }

    if (keyRow.useLimit !== null && keyRow.usedCount >= keyRow.useLimit) {
      await db.insert(logsTable).values({ key, uid, region, action: "like", status: "fail", ipAddress: ip });
      res.status(403).json({ message: "Key use limit reached" });
      return;
    }

    if (!settings.likeApiUrl) {
      res.status(503).json({ message: "Like API not configured", maintenance: true });
      return;
    }

    const apiUrl = settings.likeApiUrl.replace("{uid}", encodeURIComponent(uid)).replace("{region}", encodeURIComponent(region));

    let apiSuccess = false;
    let apiMessage = "Like sent successfully!";
    try {
      const apiRes = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
      apiSuccess = apiRes.ok;
      const body = await apiRes.text();
      try {
        const json = JSON.parse(body) as { message?: string; msg?: string; status?: string };
        apiMessage = json.message ?? json.msg ?? (apiSuccess ? "Like sent successfully!" : "API error");
      } catch {
        apiMessage = apiSuccess ? "Like sent successfully!" : body.slice(0, 100);
      }
    } catch {
      res.status(502).json({ message: "Failed to reach Like API" });
      return;
    }

    await db.update(keysTable)
      .set({ likeUsed: true, usedCount: sql`${keysTable.usedCount} + 1` })
      .where(eq(keysTable.key, key));
    await db.insert(logsTable).values({ key, uid, region, action: "like", status: apiSuccess ? "success" : "fail", ipAddress: ip });

    notifyLike(uid, region, key, ip).catch(() => {});
    res.json({ success: apiSuccess, message: apiMessage });
  } catch (err) {
    req.log.error({ err }, "like error");
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/public/visit", async (req, res) => {
  const { key, uid, region } = req.body as { key?: string; uid?: string; region?: string };
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "unknown";

  if (!key || !uid || !region) {
    res.status(400).json({ message: "key, uid, and region are required" });
    return;
  }

  try {
    const [banned] = await db.select().from(bannedIpsTable).where(eq(bannedIpsTable.ip, ip)).limit(1);
    if (banned) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const settings = await getSettings();
    if (!settings.visitEnabled) {
      res.status(503).json({ message: "Visit Method In Maintenance — Please try again later", maintenance: true });
      return;
    }

    const [keyRow] = await db.select().from(keysTable).where(eq(keysTable.key, key)).limit(1);
    if (!keyRow) {
      await db.insert(logsTable).values({ key, uid, region, action: "visit", status: "fail", ipAddress: ip });
      res.status(404).json({ message: "Key not found" });
      return;
    }

    if (new Date(keyRow.expiresAt).getTime() < Date.now()) {
      await db.insert(logsTable).values({ key, uid, region, action: "visit", status: "fail", ipAddress: ip });
      res.status(403).json({ message: "Key expired" });
      return;
    }

    if (keyRow.useLimit !== null && keyRow.usedCount >= keyRow.useLimit) {
      await db.insert(logsTable).values({ key, uid, region, action: "visit", status: "fail", ipAddress: ip });
      res.status(403).json({ message: "Key use limit reached" });
      return;
    }

    if (!settings.visitApiUrl) {
      res.status(503).json({ message: "Visit API not configured", maintenance: true });
      return;
    }

    const apiUrl = settings.visitApiUrl.replace("{uid}", encodeURIComponent(uid)).replace("{region}", encodeURIComponent(region));

    let apiSuccess = false;
    let apiMessage = "Visit sent successfully!";
    try {
      const apiRes = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
      apiSuccess = apiRes.ok;
      const body = await apiRes.text();
      try {
        const json = JSON.parse(body) as { message?: string; msg?: string; status?: string };
        apiMessage = json.message ?? json.msg ?? (apiSuccess ? "Visit sent successfully!" : "API error");
      } catch {
        apiMessage = apiSuccess ? "Visit sent successfully!" : body.slice(0, 100);
      }
    } catch {
      res.status(502).json({ message: "Failed to reach Visit API" });
      return;
    }

    await db.update(keysTable)
      .set({ visitUsed: true, usedCount: sql`${keysTable.usedCount} + 1` })
      .where(eq(keysTable.key, key));
    await db.insert(logsTable).values({ key, uid, region, action: "visit", status: apiSuccess ? "success" : "fail", ipAddress: ip });

    notifyVisit(uid, region, key, ip).catch(() => {});
    res.json({ success: apiSuccess, message: apiMessage });
  } catch (err) {
    req.log.error({ err }, "visit error");
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/public/price-list", async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings.priceList);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/public/config", async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json({ supportLinks: settings.supportLinks });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/public/online", (_req, res) => {
  res.json({ count: getOnlineCount() });
});

router.get("/public/auto-like", async (_req, res) => {
  try {
    const tasks = await db.select().from(autoLikeTasksTable).orderBy(sql`${autoLikeTasksTable.createdAt} DESC`);
    const settings = await getSettings();
    const h = settings.autoLikeScheduleHour ?? 4;
    const m = settings.autoLikeScheduleMinute ?? 0;
    const BST_OFFSET_MS = 6 * 60 * 60 * 1000;
    const bstNow = new Date(Date.now() + BST_OFFSET_MS);
    const target = new Date(bstNow);
    target.setHours(h, m, 0, 0);
    if (bstNow >= target) target.setDate(target.getDate() + 1);
    const msLeft = target.getTime() - bstNow.getTime();
    const hoursLeft = (msLeft / 3600000).toFixed(1);
    const nextRun = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} BST`;
    const activeTasks = tasks.filter(t => t.active);
    const totalLikesSent = tasks.reduce((s, t) => s + t.totalLikesSent, 0);
    res.json({ tasks, nextRun, hoursLeft, autoLikeEnabled: settings.autoLikeEnabled, activeCount: activeTasks.length, totalLikesSent });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/ping", (_req, res) => {
  res.json({ ok: true, service: "Like By Nirob", time: new Date().toISOString() });
});

export default router;
