import axios from 'axios';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { markPaymentConfirmed } from './paymentService.js';

// Poll toncenter and confirm pending payments by memo & amount
export function startPaymentWatcher() {
  if (!env.tonApiKey || !env.tonWallet) {
    console.warn('TON watcher disabled: TON_API_KEY or TON_WALLET missing');
    return;
  }
  const interval = Math.max(5000, env.tonPollIntervalMs);
  setInterval(async () => {
    try {
      const pend = await pool.query(
        `SELECT memo, amount FROM payments WHERE status='pending' ORDER BY created_at DESC LIMIT 50`
      );
      if (!pend.rowCount) return;
      const memos = new Map<string, number>();
      pend.rows.forEach((p) => memos.set(p.memo, Number(p.amount)));

      const { data } = await axios.get('https://toncenter.com/api/v2/getTransactions', {
        params: { address: env.tonWallet, limit: 100, api_key: env.tonApiKey },
      });
      const txs = data?.result || [];
      for (const tx of txs) {
        const comment = tx?.in_msg?.message;
        if (!comment || !memos.has(comment)) continue;
        const expectedAmount = BigInt(Math.ceil(memos.get(comment)! * 1e9));
        const value = BigInt(tx?.in_msg?.value || 0);
        if (value < expectedAmount) continue;
        const from = tx?.in_msg?.source || '';
        const hash = tx?.transaction_id?.hash;
        await markPaymentConfirmed(comment, from, hash);
        console.log('TON payment confirmed', comment);
      }
    } catch (err) {
      console.error('TON watcher error', err.message || err);
    }
  }, interval);
}
