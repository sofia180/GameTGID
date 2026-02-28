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
- Платежи: генерация intent (TON), верификация через toncenter, таблица payments.
- Match & tournament события через WebSocket с токеном.
- Админ‑панель в Mini App (ключ в `ADMIN_API_KEY`).
- Бот: кнопка открытия Mini App и уведомления.

## Переменные окружения (бэкенд)
- `PORT`, `DATABASE_URL`, `BOT_TOKEN`, `ADMIN_API_KEY`
- `TON_API_KEY`, `TON_WALLET`
- `ALLOWED_ORIGIN`, `WS_SECRET`

Фронт: `VITE_API_BASE`, `VITE_WS_URL`  
Бот: `BOT_TOKEN`, `MINI_APP_URL`, `API_BASE`
