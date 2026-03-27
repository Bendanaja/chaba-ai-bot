# Chaba AI Bot - Project Rules

## Project Overview
LINE Bot ที่ใช้ Kie.ai API สร้างรูปภาพ, วิดีโอ, เสียง, เพลง ด้วย AI พร้อมระบบ wallet
- **Bot**: Express.js + TypeScript + SQLite (better-sqlite3)
- **Dashboard**: Next.js 15 + shadcn/ui + Tailwind CSS
- **Deploy**: Dokploy at https://chaba.icutmc.com
- **LINE Webhook**: /webhook/line
- **Kie.ai Callback**: /webhook/kieai

## Agent Teams Rule
**ทุกงานที่ต้องทำมากกว่า 1 อย่าง ให้ใช้ Agent Teams เสมอ** ไม่ใช้ subagents ธรรมดา
- ใช้ TeamCreate สร้างทีม
- สร้าง Tasks ด้วย TaskCreate
- Spawn teammates ด้วย Agent tool + team_name parameter
- แต่ละ teammate ทำไฟล์ที่ไม่ซ้ำกัน ไม่ให้ conflict
- Team lead คอย coordinate และ review ผลงาน

## Theme & Design
- **Mascot**: น้องชบา - anime girl ผมชมพู ชุดไทย ดอกชบา
- **Colors**: Pink #D63384, Gold #C8A951, Cream #FFF8F0, Purple #6C5CE7
- **Style**: น่ารัก สดใส โทนชมพู-ทอง-ครีม
- **Font**: Kanit (Thai support)
- **LINE Flex Messages**: ใช้ gradient, corner radius, emoji

## Tech Stack
- **Bot**: Express 5, TypeScript, better-sqlite3, @line/bot-sdk, axios
- **Dashboard**: Next.js 15 (App Router), shadcn/ui, Tailwind CSS, Recharts, lucide-react
- **Deploy**: Docker + Dokploy on VPS 72.61.112.117
- **DNS**: Cloudflare (SSL: Flexible mode)

## Key Files
- `src/index.ts` — Express entry point
- `src/services/database.ts` — SQLite DB (users, transactions, tasks tables)
- `src/services/kieai.ts` — Kie.ai API client
- `src/handlers/menus.ts` — LINE Flex Message menus with Chaba theme
- `src/handlers/session.ts` — Interactive step-by-step parameter collection
- `src/models/kieai-models.ts` — 18 AI models registry
- `dashboard/` — Next.js admin dashboard

## Conventions
- ใช้ภาษาไทยใน UI ทั้งหมด
- ใช้ TypeScript strict mode
- ESM modules (type: "module" in package.json)
- Commit messages in English
- Deploy ผ่าน Playwright automation to Dokploy API

## Environment Variables
- LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN
- KIEAI_API_KEY, KIEAI_CALLBACK_BASE_URL
- ADMIN_USER_IDS (comma-separated LINE user IDs)
- DB_PATH (database directory)
- PORT (default 3000)
