import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const botToken = process.env.BOT_TOKEN;
const miniAppUrl = process.env.MINI_APP_URL || 'https://t.me/your_bot/miniapp';
const apiBase = process.env.API_BASE || 'http://localhost:4000/api';

if (!botToken) throw new Error('BOT_TOKEN missing');

const bot = new Telegraf(botToken);

bot.start((ctx) => {
  const kb = Markup.inlineKeyboard([
    Markup.button.webApp('Open Tournament', miniAppUrl),
  ]);
  ctx.reply('Welcome to the Tournament Mini App!', kb);
});

bot.command('notify', async (ctx) => {
  const { data } = await axios.get(apiBase + '/tournaments');
  const open = data.tournaments?.[0];
  if (open) {
    ctx.reply(`Current tournament: ${open.title} — entry ${open.entry_fee} TON`);
  } else {
    ctx.reply('No tournaments live.');
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
