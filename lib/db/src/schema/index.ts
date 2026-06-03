import { pgTable, text, serial, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const keysTable = pgTable("keys", {
  key: text("key").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  likeUsed: boolean("like_used").notNull().default(false),
  visitUsed: boolean("visit_used").notNull().default(false),
  usedCount: integer("used_count").notNull().default(0),
  useLimit: integer("use_limit"),
  dailyUseLimit: integer("daily_use_limit"),
  dailyUseCount: integer("daily_use_count").notNull().default(0),
  dailyUseResetAt: timestamp("daily_use_reset_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const logsTable = pgTable("logs", {
  id: serial("id").primaryKey(),
  key: text("key"),
  uid: text("uid"),
  region: text("region"),
  action: text("action").notNull(),
  status: text("status").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bannedIpsTable = pgTable("banned_ips", {
  ip: text("ip").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const autoLikeTasksTable = pgTable("auto_like_tasks", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  region: text("region").notNull(),
  days: integer("days").notNull(),
  remaining: integer("remaining").notNull(),
  totalLikesSent: integer("total_likes_sent").notNull().default(0),
  likesLastRun: integer("likes_last_run").notNull().default(0),
  playerNickname: text("player_nickname"),
  playerLevel: text("player_level"),
  likesBeforeLast: text("likes_before_last"),
  likesAfterLast: text("likes_after_last"),
  lastRunAt: timestamp("last_run_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Key = typeof keysTable.$inferSelect;
export type Log = typeof logsTable.$inferSelect;
export type AutoLikeTask = typeof autoLikeTasksTable.$inferSelect;
