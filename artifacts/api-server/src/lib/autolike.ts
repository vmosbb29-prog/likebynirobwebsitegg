import { db, autoLikeTasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getSettings } from "./settings.js";
import { logger } from "./logger.js";
import { sendAutoLikeResult } from "./telegram.js";

// BST = Bangladesh Standard Time = UTC+6
const BST_OFFSET_MS = 6 * 60 * 60 * 1000;

function nowBST(): Date {
  return new Date(Date.now() + BST_OFFSET_MS);
}

let schedulerTimer: ReturnType<typeof setTimeout> | null = null;

export function startScheduler(): void {
  if (schedulerTimer) clearTimeout(schedulerTimer);
  scheduleNextDynamic();
  logger.info("Auto-like scheduler initialized (BST timezone)");
}

async function msUntilScheduledRun(): Promise<number> {
  const settings = await getSettings();
  const h = settings.autoLikeScheduleHour ?? 4;
  const m = settings.autoLikeScheduleMinute ?? 0;

  const bstNow = nowBST();
  const target = new Date(bstNow);
  target.setHours(h, m, 0, 0);
  if (bstNow >= target) target.setDate(target.getDate() + 1);

  const msLeft = target.getTime() - bstNow.getTime();
  return Math.max(msLeft, 5000);
}

function scheduleNextDynamic(): void {
  if (schedulerTimer) clearTimeout(schedulerTimer);

  msUntilScheduledRun()
    .then(ms => {
      const hours = (ms / 3600000).toFixed(2);
      logger.info({ ms, hours }, "Next auto-like scheduled");
      schedulerTimer = setTimeout(async () => {
        const settings = await getSettings().catch(() => null);
        if (settings?.autoLikeEnabled) {
          logger.info("Running auto-like batch (BST scheduled)");
          await runBatch();
        } else {
          logger.info("Auto-like disabled, skipping batch");
        }
        scheduleNextDynamic();
      }, ms);
    })
    .catch(err => {
      logger.error({ err }, "Failed to schedule auto-like, retrying in 60s");
      schedulerTimer = setTimeout(scheduleNextDynamic, 60_000);
    });
}

export async function runBatch(): Promise<void> {
  const settings = await getSettings();
  if (!settings.autoLikeEnabled) return;

  const apiUrlTemplate = settings.autoLikeApiUrl;
  if (!apiUrlTemplate) {
    logger.warn("Auto-like API URL not configured");
    return;
  }

  const tasks = await db
    .select()
    .from(autoLikeTasksTable)
    .where(and(eq(autoLikeTasksTable.active, true)));

  if (tasks.length === 0) {
    logger.info("No active auto-like tasks");
    return;
  }

  logger.info({ count: tasks.length }, "Processing auto-like tasks");

  for (const task of tasks) {
    try {
      const url = apiUrlTemplate
        .replace("{uid}", encodeURIComponent(task.uid))
        .replace("{region}", encodeURIComponent(task.region));

      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      const body = await res.text();

      let likesGiven = 0;
      let likesBefore = "N/A";
      let likesAfter = "N/A";
      let nickname = task.playerNickname ?? "Unknown";
      let level = task.playerLevel ?? "N/A";

      try {
        const json = JSON.parse(body) as Record<string, unknown>;
        likesGiven = Number(json["LikesGivenByAPI"] ?? json["likes_given"] ?? 0);
        likesBefore = String(json["LikesbeforeCommand"] ?? json["likes_before"] ?? "N/A");
        likesAfter = String(json["LikesafterCommand"] ?? json["likes_after"] ?? "N/A");
        nickname = String(json["PlayerNickname"] ?? json["player_nickname"] ?? nickname);
        level = String(json["PlayerLevel"] ?? json["player_level"] ?? level);
      } catch {
        // Non-JSON response
      }

      const newRemaining = Math.max(0, task.remaining - 1);
      const newActive = newRemaining > 0;
      const newTotal = task.totalLikesSent + likesGiven;

      await db
        .update(autoLikeTasksTable)
        .set({
          remaining: newRemaining,
          active: newActive,
          totalLikesSent: newTotal,
          likesLastRun: likesGiven,
          playerNickname: nickname,
          playerLevel: level,
          likesBeforeLast: likesBefore,
          likesAfterLast: likesAfter,
          lastRunAt: new Date(),
        })
        .where(eq(autoLikeTasksTable.id, task.id));

      logger.info({ uid: task.uid, likesGiven, remaining: newRemaining }, "Auto-like sent");

      await sendAutoLikeResult({
        uid: task.uid,
        region: task.region,
        nickname,
        level,
        likesBefore,
        likesAfter,
        likesGiven,
        remaining: newRemaining,
        success: res.ok && likesGiven >= 0,
      }).catch(() => {});

    } catch (err) {
      logger.error({ err, uid: task.uid }, "Auto-like task failed");
    }

    // Small delay between UIDs to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  logger.info("Auto-like batch complete");
}

export async function runBatchNow(): Promise<{ uid: string; likesGiven: number; success: boolean }[]> {
  const settings = await getSettings();
  const apiUrlTemplate = settings.autoLikeApiUrl;
  if (!apiUrlTemplate) throw new Error("Auto-like API URL not configured");

  const tasks = await db
    .select()
    .from(autoLikeTasksTable)
    .where(and(eq(autoLikeTasksTable.active, true)));

  const results: { uid: string; likesGiven: number; success: boolean }[] = [];

  for (const task of tasks) {
    try {
      const url = apiUrlTemplate
        .replace("{uid}", encodeURIComponent(task.uid))
        .replace("{region}", encodeURIComponent(task.region));

      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      const body = await res.text();

      let likesGiven = 0;
      let likesBefore = "N/A";
      let likesAfter = "N/A";
      let nickname = task.playerNickname ?? "Unknown";
      let level = task.playerLevel ?? "N/A";

      try {
        const json = JSON.parse(body) as Record<string, unknown>;
        likesGiven = Number(json["LikesGivenByAPI"] ?? json["likes_given"] ?? 0);
        likesBefore = String(json["LikesbeforeCommand"] ?? json["likes_before"] ?? "N/A");
        likesAfter = String(json["LikesafterCommand"] ?? json["likes_after"] ?? "N/A");
        nickname = String(json["PlayerNickname"] ?? json["player_nickname"] ?? nickname);
        level = String(json["PlayerLevel"] ?? json["player_level"] ?? level);
      } catch { /* ignore */ }

      const newRemaining = Math.max(0, task.remaining - 1);
      const newActive = newRemaining > 0;
      const newTotal = task.totalLikesSent + likesGiven;

      await db
        .update(autoLikeTasksTable)
        .set({
          remaining: newRemaining,
          active: newActive,
          totalLikesSent: newTotal,
          likesLastRun: likesGiven,
          playerNickname: nickname,
          playerLevel: level,
          likesBeforeLast: likesBefore,
          likesAfterLast: likesAfter,
          lastRunAt: new Date(),
        })
        .where(eq(autoLikeTasksTable.id, task.id));

      results.push({ uid: task.uid, likesGiven, success: res.ok });
    } catch {
      results.push({ uid: task.uid, likesGiven: 0, success: false });
    }
  }

  return results;
}
