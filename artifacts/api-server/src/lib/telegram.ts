import { getSettings } from "./settings.js";
import { logger } from "./logger.js";

async function sendTelegram(text: string): Promise<void> {
  const settings = await getSettings();
  const { telegramBotToken, telegramChatId } = settings;
  if (!telegramBotToken || !telegramChatId) return;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegramChatId, text, parse_mode: "HTML" }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      logger.warn({ status: res.status, body }, "Telegram sendMessage failed");
    }
  } catch (err) {
    logger.warn({ err }, "Telegram notification error");
  }
}

interface LikeInfo {
  likesBefore?: number | null;
  likesAfter?: number | null;
  likesGiven?: number | null;
  playerNickname?: string | null;
  playerLevel?: string | null;
}

interface VisitInfo {
  visitCount?: number | null;
  playerNickname?: string | null;
  playerLevel?: string | null;
}

export async function notifyLike(uid: string, region: string, key: string, ip: string, info?: LikeInfo): Promise<void> {
  const lines: string[] = [
    `👍 <b>LIKE SENT</b>`,
    `━━━━━━━━━━━━━━━`,
  ];
  if (info?.playerNickname) lines.push(`👤 Player: <b>${info.playerNickname}</b>${info.playerLevel ? ` (Lv.${info.playerLevel})` : ""}`);
  lines.push(`🆔 UID: <code>${uid}</code>`);
  lines.push(`🌍 Region: <b>${region}</b>`);
  if (info?.likesBefore != null) lines.push(`📊 Before: <b>${info.likesBefore}</b>`);
  if (info?.likesGiven   != null) lines.push(`➕ Sent: <b>+${info.likesGiven}</b>`);
  if (info?.likesAfter   != null) lines.push(`📈 After: <b>${info.likesAfter}</b>`);
  lines.push(`🔑 Key: <code>${key}</code>`);
  lines.push(`📍 IP: <code>${ip}</code>`);
  await sendTelegram(lines.join("\n"));
}

export async function notifyVisit(uid: string, region: string, key: string, ip: string, info?: VisitInfo): Promise<void> {
  const lines: string[] = [
    `👁 <b>VISIT SENT</b>`,
    `━━━━━━━━━━━━━━━`,
  ];
  if (info?.playerNickname) lines.push(`👤 Player: <b>${info.playerNickname}</b>${info.playerLevel ? ` (Lv.${info.playerLevel})` : ""}`);
  lines.push(`🆔 UID: <code>${uid}</code>`);
  lines.push(`🌍 Region: <b>${region}</b>`);
  if (info?.visitCount != null) lines.push(`👁 Visits Sent: <b>${info.visitCount}</b>`);
  lines.push(`🔑 Key: <code>${key}</code>`);
  lines.push(`📍 IP: <code>${ip}</code>`);
  await sendTelegram(lines.join("\n"));
}

export async function notifyKeyCheck(key: string, valid: boolean, ip: string): Promise<void> {
  const status = valid ? "✅ Valid" : "❌ Invalid/Expired";
  await sendTelegram(
    `🔑 <b>KEY CHECKED</b>\nKey: <code>${key}</code>\nStatus: ${status}\nIP: <code>${ip}</code>`
  );
}

export async function notifyAdminLogin(success: boolean, ip: string): Promise<void> {
  const status = success ? "✅ SUCCESS" : "❌ FAILED";
  await sendTelegram(
    `🔐 <b>ADMIN LOGIN</b>\nStatus: ${status}\nIP: <code>${ip}</code>`
  );
}

export async function notifyKeyCreated(key: string, validityDays: number, useLimit: number | null, keyType = "both"): Promise<void> {
  const typeLabel = keyType === "like" ? "👍 Like Only" : keyType === "visit" ? "👁 Visit Only" : "👍👁 Both";
  await sendTelegram(
    `➕ <b>KEY CREATED</b>\nKey: <code>${key}</code>\nType: <b>${typeLabel}</b>\nValidity: <b>${validityDays} days</b>\nLimit: <b>${useLimit ?? "∞"}</b>`
  );
}

export async function notifyKeyDeleted(key: string): Promise<void> {
  await sendTelegram(
    `🗑 <b>KEY DELETED</b>\nKey: <code>${key}</code>`
  );
}

export async function notifyIpBanned(ip: string): Promise<void> {
  await sendTelegram(
    `🚫 <b>IP BANNED</b>\nIP: <code>${ip}</code>`
  );
}

export async function sendAutoLikeResult(data: {
  uid: string;
  region: string;
  nickname: string;
  level: string;
  likesBefore: string;
  likesAfter: string;
  likesGiven: number;
  remaining: number;
  success: boolean;
}): Promise<void> {
  const status = data.success ? "✅ <b>AUTO LIKE SUCCESS</b>" : "❌ <b>AUTO LIKE FAILED</b>";
  await sendTelegram(
    `${status}\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `👤 Name: <b>${data.nickname}</b>\n` +
    `🌍 Region: <b>${data.region.toUpperCase()}</b>\n` +
    `🆔 UID: <code>${data.uid}</code>\n` +
    `📈 Level: <b>${data.level}</b>\n\n` +
    `📊 Before: <b>${data.likesBefore}</b>\n` +
    `➕ Given: <b>+${data.likesGiven}</b>\n` +
    `📊 After: <b>${data.likesAfter}</b>\n\n` +
    `📉 Days Left: <b>${data.remaining}</b>\n` +
    `━━━━━━━━━━━━━━━━━`
  );
}
