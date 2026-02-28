import crypto from 'crypto';
import { env } from '../config/env.js';

// Validate Telegram initData per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function validateInitData(initData: string): { valid: boolean; data?: Record<string, string> } {
  if (!initData) return { valid: false };
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return { valid: false };
  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(env.botToken).digest();
  const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return { valid: false };
  const data: Record<string, string> = {};
  urlParams.forEach((value, key) => {
    data[key] = value;
  });
  return { valid: true, data };
}
