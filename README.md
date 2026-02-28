# GameTGID – Telegram Mini App Tournament Platform

Стек: Vite/React/Tailwind (Mini App), Node/Express/TS, PostgreSQL, WebSocket, Telegraf bot, TON-ready платежи.

## Запуск локально
```bash
psql $DATABASE_URL -f database/schema.sql

cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && cp .env.example .env && npm install && npm run dev
cd bot && cp .env.example .env && npm install && npm run dev   # опционально
```

## Основные возможности
- Telegram initData auth, профили пользователей.
- Турниры: создание, старт/завершение, вступление, матчмейкинг.
- Платежи: TON Connect кошелёк на фронте, intent (memo), верификация через toncenter, таблица payments.
- Match & tournament события через WebSocket с токеном (`/auth/socket-token`, `WS_SECRET`).
- Админ‑панель в Mini App (ключ в `ADMIN_API_KEY`) + кнопки старт/complete.
- Бот: кнопка открытия Mini App и уведомления.

## Переменные окружения (бэкенд)
- `PORT`, `DATABASE_URL`, `BOT_TOKEN`, `ADMIN_API_KEY`
- `TON_API_KEY`, `TON_WALLET`
- `ALLOWED_ORIGIN`, `WS_SECRET`

Фронт: `VITE_API_BASE`, `VITE_WS_URL`  
Бот: `BOT_TOKEN`, `MINI_APP_URL`, `API_BASE`

## Seed демо-турниров
```bash
node scripts/seed.js
```

## CI/CD
- CI: `.github/workflows/ci.yml` (build backend/frontend).
- Deploy to Railway: `.github/workflows/deploy.yml` (требует secrets: `RAILWAY_TOKEN`, `RAILWAY_PROJECT_ID`, `RAILWAY_BACKEND_SERVICE_ID`, `RAILWAY_FRONTEND_SERVICE_ID`).
