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

export async function notifyLike(uid: string, region: string, key: string, ip: string): Promise<void> {
  await sendTelegram(
    `👍 <b>LIKE SENT</b>\nUID: <code>${uid}</code>\nRegion: <b>${region}</b>\nKey: <code>${key}</code>\nIP: <code>${ip}</code>`
  );
}

export async function notifyVisit(uid: string, region: string, key: string, ip: string): Promise<void> {
  await sendTelegram(
    `👁 <b>VISIT SENT</b>\nUID: <code>${uid}</code>\nRegion: <b>${region}</b>\nKey: <code>${key}</code>\nIP: <code>${ip}</code>`
  );
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

export async function notifyKeyCreated(key: string, validityDays: number, useLimit: number | null): Promise<void> {
  await sendTelegram(
    `➕ <b>KEY CREATED</b>\nKey: <code>${key}</code>\nValidity: <b>${validityDays} days</b>\nLimit: <b>${useLimit ?? "∞"}</b>`
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
