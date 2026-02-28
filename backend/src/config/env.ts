import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  botToken: process.env.BOT_TOKEN || '',
  tonApiKey: process.env.TON_API_KEY || '',
  tonWallet: process.env.TON_WALLET || '',
  tonJettonMaster: process.env.TON_JETTON_MASTER || '',
  tonJettonDecimals: parseInt(process.env.TON_JETTON_DECIMALS || '9', 10),
  tonapiKey: process.env.TONAPI_KEY || '',
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  adminApiKey: process.env.ADMIN_API_KEY || 'change-me',
  wsSecret: process.env.WS_SECRET || 'ws-secret',
  tonPollIntervalMs: parseInt(process.env.TON_POLL_INTERVAL_MS || '30000', 10)
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}
if (!env.botToken) {
  throw new Error('BOT_TOKEN is required for Telegram Mini App auth');
}
