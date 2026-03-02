import dotenv from "dotenv";

dotenv.config();

const required = (key: string, fallback?: string) => process.env[key] ?? fallback ?? "";

export const config = {
  port: Number(required("PORT", "4000")),
  jwtSecret: required("JWT_SECRET", "dev-secret"),
  telegramBotToken: required("TELEGRAM_BOT_TOKEN", ""),
  frontendUrl: required("FRONTEND_URL", "http://localhost:3000"),
  adminApiKey: required("ADMIN_API_KEY", "change-me"),
  enableDevAuth: required("ENABLE_DEV_AUTH", "true") === "true",
  platformFeeBps: Number(required("PLATFORM_FEE_BPS", "500")),
  referralShare: Number(required("REFERRAL_SHARE", "0.1"))
};
