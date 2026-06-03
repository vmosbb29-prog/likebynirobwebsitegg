import bcrypt from "bcryptjs";
import { db, settingsTable, pool } from "@workspace/db";
import { logger } from "./logger.js";

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS keys (
  key TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  like_used BOOLEAN NOT NULL DEFAULT FALSE,
  visit_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_count INTEGER NOT NULL DEFAULT 0,
  use_limit INTEGER,
  daily_use_limit INTEGER,
  daily_use_count INTEGER NOT NULL DEFAULT 0,
  daily_use_reset_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  key TEXT,
  uid TEXT,
  region TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banned_ips (
  ip TEXT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_like_tasks (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  days INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  total_likes_sent INTEGER NOT NULL DEFAULT 0,
  likes_last_run INTEGER NOT NULL DEFAULT 0,
  player_nickname TEXT,
  player_level TEXT,
  likes_before_last TEXT,
  likes_after_last TEXT,
  last_run_at TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add new columns to existing keys table (safe: IF NOT EXISTS)
ALTER TABLE keys ADD COLUMN IF NOT EXISTS daily_use_limit INTEGER;
ALTER TABLE keys ADD COLUMN IF NOT EXISTS daily_use_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE keys ADD COLUMN IF NOT EXISTS daily_use_reset_at TIMESTAMP;
ALTER TABLE keys ADD COLUMN IF NOT EXISTS key_type TEXT NOT NULL DEFAULT 'both';
`;

const DEFAULT_PASSWORD = "nirob360";

export async function initDb(): Promise<void> {
  try {
    await pool.query(CREATE_TABLES_SQL);
    logger.info("Tables verified/created OK");

    const [row] = await db.select({ id: settingsTable.id }).from(settingsTable).limit(1);
    if (!row) {
      const adminPasswordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
      await db.insert(settingsTable).values({
        data: {
          adminPasswordHash,
          likeEnabled: true,
          visitEnabled: true,
          likeApiUrl: "",
          visitApiUrl: "",
          telegramBotToken: "",
          telegramChatId: "",
          autoLikeEnabled: false,
          autoLikeApiUrl: "https://nirob-like-api-new-no-lag.vercel.app/like?uid={uid}&server_name={region}",
          autoLikeScheduleHour: 4,
          autoLikeScheduleMinute: 0,
          priceList: {
            currency: "৳",
            contactInfo: "Contact: @NIROBFF360",
            likeItems: [],
            visitItems: [],
            autoLikeItems: [],
          },
          supportLinks: {
            telegramUrl: "https://t.me/NIROBFF360",
            whatsappUrl: "",
            telegramChannelUrl: "https://t.me/likebynirob",
            telegramGroupUrl: "https://t.me/likebynirobgp",
          },
        } as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      });
      logger.info("DB seeded with default settings. Admin password: nirob360");
    }
  } catch (err) {
    logger.error({ err }, "Failed to initialize DB");
    throw err;
  }
}
