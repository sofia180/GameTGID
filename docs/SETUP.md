# GameTG MVP Setup

## Installation
1. Install `pnpm`.
2. Install dependencies:
   - `pnpm install`

## Environment Variables
Server (`apps/server/.env`)
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `FRONTEND_URL`
- `ADMIN_API_KEY`
- `ENABLE_DEV_AUTH`
- `PLATFORM_FEE_BPS`
- `REFERRAL_SHARE`

Web (`apps/web/.env`)
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `NEXT_PUBLIC_WEB_URL`
- `NEXT_PUBLIC_TELEGRAM_BOT`

## Database
- Create a Postgres database.
- Run Prisma migration:
  - `pnpm --filter server prisma migrate dev`

## Run (Local)
- `pnpm dev:server`
- `pnpm dev:web`

## Deployment
- Server
  - `pnpm --filter server start`
  - Set `DATABASE_URL` and run migrations in the target environment.
  - For production hardening, add a build step for workspace packages and switch `start` to the compiled output.
- Web
  - `pnpm --filter web build`
  - `pnpm --filter web start`
  - Configure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to point to your server.

## Add New Games (Modular)
1. Create a package under `packages/games/<newgame>/src/index.ts`.
2. Implement `state` and `applyMove(player, move)`.
3. Register the engine in `apps/server/src/games/registry.ts`.
4. Extend Prisma `GameType` enum in `apps/server/prisma/schema.prisma`.
5. Add the game to UI selection in `apps/web/app/lobby/page.tsx`.
6. If the game has hidden information, update the `sanitizeState` function in `apps/server/src/realtime.ts`.
