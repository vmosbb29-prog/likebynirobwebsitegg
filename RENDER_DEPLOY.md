# 🚀 Like By Nirob — Render Deployment Guide

## এই guide অনুসরণ করলে 101% deploy হবে। ধাপে ধাপে যাও।

---

## Step 1: Database তৈরি করো (Neon — বিনামূল্যে, মেয়াদ নেই)

Render-এর নিজস্ব free PostgreSQL 90 দিন পর expire হয়।  
তাই **Neon** ব্যবহার করো — permanent free!

1. যাও: **https://neon.tech** → Sign Up (GitHub দিয়ে)
2. New Project তৈরি করো → নাম দাও: `like-by-nirob`
3. Region: **Asia Pacific (Singapore)** বেছে নাও
4. Project তৈরি হলে **Connection String** কপি করো:
   ```
   postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
5. এটা পরে লাগবে — সাইডে রাখো।

---

## Step 2: Code GitHub-এ push করো

1. যাও: **https://github.com** → New Repository
2. নাম দাও: `like-by-nirob`
3. Public বা Private — যেকোনো একটা
4. "Create repository" click করো
5. ZIP extract করে ওই folder-এ যাও, তারপর:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/তোমার-username/like-by-nirob.git
git push -u origin main
```

---

## Step 3: Render-এ Deploy করো

1. যাও: **https://render.com** → Sign Up (GitHub দিয়ে)
2. Dashboard → **New +** → **Web Service**
3. **"Connect a repository"** → তোমার `like-by-nirob` repo select করো
4. নিচের settings দাও:

| Field | Value |
|-------|-------|
| Name | `like-by-nirob` |
| Region | Singapore |
| Branch | `main` |
| Runtime | `Node` |
| Build Command | `npm install -g pnpm@10 && pnpm install && pnpm --filter @workspace/slv run build && pnpm --filter @workspace/api-server run build` |
| Start Command | `node artifacts/api-server/dist/index.mjs` |
| Instance Type | **Free** |

5. নিচে **Environment Variables** section-এ এগুলো add করো:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (Step 1 থেকে Neon connection string) |
| `SESSION_SECRET` | (যেকোনো random string, যেমন: `nirob360secretkey2024abc`) |

6. **"Create Web Service"** click করো
7. Build শুরু হবে — ৩-৫ মিনিট অপেক্ষা করো ☕

---

## Step 4: Health Check confirm করো

Build শেষ হলে তোমার URL পাবে:  
`https://like-by-nirob.onrender.com`

Browser-এ যাও:
```
https://like-by-nirob.onrender.com/api/ping
```
এটা দেখালে সব ঠিক আছে:
```json
{"ok":true,"service":"Like By Nirob","time":"..."}
```

---

## Step 5: Uptime Robot Setup করো (Free Sleep Prevention)

Render free service 15 মিনিট idle থাকলে sleep করে।  
Uptime Robot দিয়ে প্রতি 5 মিনিটে ping করলে সবসময় জেগে থাকবে।

1. যাও: **https://uptimerobot.com** → Sign Up
2. **Add New Monitor** click করো:

| Field | Value |
|-------|-------|
| Monitor Type | **HTTP(s)** |
| Friendly Name | `Like By Nirob` |
| URL | `https://like-by-nirob.onrender.com/api/ping` |
| Monitoring Interval | **5 minutes** |

3. **Create Monitor** click করো ✅

---

## Step 6: Admin Panel Access

Deploy হলে admin panel access করো:

- **URL:** `https://like-by-nirob.onrender.com/nirobff360adminp`
- **Password:** `nirob360`

⚠️ **প্রথম login করেই password পরিবর্তন করো!**

Admin panel থেকে:
- Like/Visit API URL set করো
- Telegram bot configure করো
- Price list setup করো
- Access keys generate করো

---

## Auto-Restart (Self-Healing) ✅

- Tables auto-create হয় প্রতি restart-এ (`CREATE TABLE IF NOT EXISTS`)
- Settings auto-seed হয় যদি empty থাকে
- Drizzle-kit push manually চালাতে হবে না
- Render code push করলে auto-redeploy হয়

---

## যদি কোনো Error আসে

### Error: `relation "keys" does not exist`
→ DATABASE_URL ঠিকমতো set হয়নি — Neon connection string আবার চেক করো।

### Error: `SESSION_SECRET is required`
→ Environment Variables-এ `SESSION_SECRET` add করোনি — Step 3 আবার দেখো।

### Build failed: `pnpm: command not found`
→ Build Command ঠিকমতো copy করোনি — পুরো command আবার paste করো।

### Site দেখাচ্ছে না
→ Render dashboard-এ "Logs" tab দেখো — error সেখানে পাবে।

---

## Environment Variables Summary

```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
SESSION_SECRET=যেকোনো-random-string-min-32-chars
```

Optional (Telegram notifications চাইলে):
```
(Admin panel থেকে set করো — env var লাগবে না)
```

---

_Made with ❤️ by Like By Nirob_
