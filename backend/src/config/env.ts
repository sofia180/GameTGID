import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  botToken: process.env.BOT_TOKEN || '',
  tonApiKey: process.env.TON_API_KEY || '',
  tonWallet: process.env.TON_WALLET || '',
  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  adminApiKey: process.env.ADMIN_API_KEY || 'change-me'
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}
if (!env.botToken) {
  throw new Error('BOT_TOKEN is required for Telegram Mini App auth');
}
