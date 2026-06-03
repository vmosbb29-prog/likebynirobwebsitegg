import { Router, type IRouter } from "express";
import { db, keysTable, logsTable, bannedIpsTable, settingsTable, autoLikeTasksTable } from "@workspace/db";
import { eq, sql, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getSettings, saveSettings, invalidateCache } from "../lib/settings.js";
import { notifyAdminLogin, notifyKeyCreated, notifyKeyDeleted, notifyIpBanned } from "../lib/telegram.js";
import { getOnlineCount, getOnlineByPage } from "../lib/online.js";
import { requireAdmin } from "../middlewares/auth.js";
import { runBatchNow } from "../lib/autolike.js";

const router: IRouter = Router();

function randomKey(length = 24): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

router.post("/admin/login", async (req, res) => {
  const { password } = req.body as { password?: string };
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? "unknown";

  if (!password) {
    res.status(400).json({ message: "Password required" });
    return;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(500).json({ message: "Server misconfiguration" });
    return;
  }

  try {
    const settings = await getSettings();
    const valid = bcrypt.compareSync(password, settings.adminPasswordHash);
    notifyAdminLogin(valid, ip).catch(() => {});

    if (!valid) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    req.log.error({ err }, "admin login error");
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const [totalKeys] = await db.select({ count: count() }).from(keysTable);
    const [totalLogs] = await db.select({ count: count() }).from(logsTable);
    const [bannedIps] = await db.select({ count: count() }).from(bannedIpsTable);

    const allKeys = await db.select({ expiresAt: keysTable.expiresAt }).from(keysTable);
    const now = Date.now();
    const activeKeys = allKeys.filter(k => new Date(k.expiresAt).getTime() > now).length;

    const likeLogs = await db.select({ count: count() }).from(logsTable)
      .where(eq(logsTable.action, "like"));
    const visitLogs = await db.select({ count: count() }).from(logsTable)
      .where(eq(logsTable.action, "visit"));

    res.json({
      totalKeys: totalKeys?.count ?? 0,
      activeKeys,
      totalLikes: likeLogs[0]?.count ?? 0,
      totalVisits: visitLogs[0]?.count ?? 0,
      totalLogs: totalLogs?.count ?? 0,
      bannedIps: bannedIps?.count ?? 0,
      onlineUsers: getOnlineCount(),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/online", requireAdmin, async (_req, res) => {
  res.json({
    count: getOnlineCount(),
    byPage: getOnlineByPage(),
  });
});

router.get("/admin/keys", requireAdmin, async (_req, res) => {
  try {
    const keys = await db.select().from(keysTable).orderBy(sql`${keysTable.createdAt} DESC`);
    res.json(keys);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/keys", requireAdmin, async (req, res) => {
  const { validityDays = 30, useLimit, customKey } = req.body as {
    validityDays?: number;
    useLimit?: number | null;
    customKey?: string;
  };

  try {
    const key = customKey?.trim() || randomKey();
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    await db.insert(keysTable).values({
      key,
      expiresAt,
      useLimit: useLimit ?? null,
    });

    notifyKeyCreated(key, validityDays, useLimit ?? null).catch(() => {});
    res.json({ key, expiresAt });
  } catch (err) {
    req.log.error({ err }, "create key error");
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/admin/keys/:key", requireAdmin, async (req, res) => {
  const { key } = req.params;
  try {
    await db.delete(keysTable).where(eq(keysTable.key, key));
    notifyKeyDeleted(key).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/logs", requireAdmin, async (_req, res) => {
  try {
    const logs = await db.select().from(logsTable).orderBy(sql`${logsTable.createdAt} DESC`).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/ban-ip", requireAdmin, async (req, res) => {
  const { ip } = req.body as { ip?: string };
  if (!ip) {
    res.status(400).json({ message: "IP required" });
    return;
  }
  try {
    await db.insert(bannedIpsTable).values({ ip }).onConflictDoNothing();
    notifyIpBanned(ip).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/admin/ban-ip/:ip", requireAdmin, async (req, res) => {
  const { ip } = req.params;
  try {
    await db.delete(bannedIpsTable).where(eq(bannedIpsTable.ip, ip));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/banned-ips", requireAdmin, async (_req, res) => {
  try {
    const ips = await db.select().from(bannedIpsTable).orderBy(sql`${bannedIpsTable.createdAt} DESC`);
    res.json(ips);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/settings", requireAdmin, async (_req, res) => {
  try {
    const settings = await getSettings();
    const { adminPasswordHash: _pw, ...safe } = settings;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/settings", requireAdmin, async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const { adminPasswordHash: _remove, ...updates } = body;
  try {
    await saveSettings(updates as Parameters<typeof saveSettings>[0]);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "save settings error");
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/admin/password", requireAdmin, async (req, res) => {
  const { oldPassword, newPassword } = req.body as { oldPassword?: string; newPassword?: string };
  if (!oldPassword || !newPassword) {
    res.status(400).json({ message: "oldPassword and newPassword required" });
    return;
  }
  try {
    const settings = await getSettings();
    if (!bcrypt.compareSync(oldPassword, settings.adminPasswordHash)) {
      res.status(401).json({ message: "Current password incorrect" });
      return;
    }
    const adminPasswordHash = bcrypt.hashSync(newPassword, 10);
    await saveSettings({ adminPasswordHash });
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "change password error");
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/telegram-test", requireAdmin, async (req, res) => {
  const { botToken, chatId } = req.body as { botToken?: string; chatId?: string };
  if (!botToken || !chatId) {
    res.status(400).json({ message: "botToken and chatId required" });
    return;
  }
  try {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "✅ <b>NIROB SLV</b> — Telegram notifications connected!", parse_mode: "HTML" }),
    });
    const data = await r.json() as { ok?: boolean; description?: string };
    if (data.ok) {
      res.json({ success: true });
    } else {
      res.status(400).json({ message: data.description ?? "Telegram error" });
    }
  } catch (err) {
    res.status(502).json({ message: "Failed to reach Telegram" });
  }
});

// ===== AUTO LIKE ROUTES =====

router.get("/admin/auto-like", requireAdmin, async (_req, res) => {
  try {
    const tasks = await db.select().from(autoLikeTasksTable).orderBy(sql`${autoLikeTasksTable.createdAt} DESC`);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/auto-like", requireAdmin, async (req, res) => {
  const { uid, region, days } = req.body as { uid?: string; region?: string; days?: number };
  if (!uid || !region || !days) {
    res.status(400).json({ message: "uid, region, and days are required" });
    return;
  }
  try {
    const [existing] = await db.select({ id: autoLikeTasksTable.id }).from(autoLikeTasksTable).where(eq(autoLikeTasksTable.uid, uid.trim())).limit(1);
    if (existing) {
      const [current] = await db.select().from(autoLikeTasksTable).where(eq(autoLikeTasksTable.uid, uid.trim())).limit(1);
      const newRemaining = (current?.remaining ?? 0) + Number(days);
      const newTotal = (current?.days ?? 0) + Number(days);
      await db.update(autoLikeTasksTable)
        .set({ days: newTotal, remaining: newRemaining, active: true, region: region.trim() })
        .where(eq(autoLikeTasksTable.uid, uid.trim()));
      res.json({ success: true, extended: true });
    } else {
      await db.insert(autoLikeTasksTable).values({
        uid: uid.trim(),
        region: region.trim(),
        days: Number(days),
        remaining: Number(days),
        active: true,
      });
      res.json({ success: true, extended: false });
    }
  } catch (err) {
    req.log.error({ err }, "auto-like create error");
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/admin/auto-like/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid ID" });
    return;
  }
  try {
    await db.delete(autoLikeTasksTable).where(eq(autoLikeTasksTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/admin/auto-like/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { active, remaining, region } = req.body as { active?: boolean; remaining?: number; region?: string };
  try {
    const updates: Record<string, unknown> = {};
    if (active !== undefined) updates.active = active;
    if (remaining !== undefined) updates.remaining = remaining;
    if (region !== undefined) updates.region = region;
    await db.update(autoLikeTasksTable).set(updates).where(eq(autoLikeTasksTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/auto-like/run-now", requireAdmin, async (req, res) => {
  try {
    const results = await runBatchNow();
    res.json({ success: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    res.status(500).json({ message: msg });
  }
});

export default router;
