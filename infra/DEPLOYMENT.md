# Deployment

## Prerequisites
- Node.js 20+
- PostgreSQL 14+
- TON API key from toncenter.com (or your own node)
- Telegram Bot token and Mini App domain added to BotFather

## Backend
```
cd backend
cp .env.example .env
# edit DATABASE_URL, BOT_TOKEN, TON_API_KEY, TON_WALLET, ADMIN_API_KEY
npm install
npm run dev  # for local
npm run build && npm start  # production
```

Expose port 4000. Set `ALLOWED_ORIGIN` to your Mini App domain.

## Frontend (Telegram Mini App)
```
cd frontend
cp .env.example .env
# set VITE_API_BASE and VITE_WS_URL to deployed backend
npm install
npm run dev  # local at http://localhost:5173
npm run build  # outputs dist/
```
Host dist/ on HTTPS. In BotFather -> /setdomain configure the web app URL.

## Bot
```
cd bot
cp .env.example .env
# set BOT_TOKEN, MINI_APP_URL, API_BASE
npm install
npm run dev
```
Deploy as a long-running process (PM2/systemd) or serverless webhook.

## Database
```
psql $DATABASE_URL -f ../database/schema.sql
```

## Docker (compose sketch)
Create a compose file to run backend + postgres + bot; bind frontend dist via CDN.

## Environment variables
- PORT: API port
- DATABASE_URL: postgres connection string
- BOT_TOKEN: Telegram bot token
- ADMIN_API_KEY: admin header value
- TON_API_KEY: toncenter API key
- TON_WALLET: wallet address receiving entry fees
- ALLOWED_ORIGIN: frontend origin
- VITE_API_BASE: frontend API URL
- VITE_WS_URL: frontend websocket URL
- MINI_APP_URL: full Mini App URL for bot
- API_BASE: backend base for bot
