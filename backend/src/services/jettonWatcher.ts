import axios from 'axios';
import { env } from '../config/env.js';
import { markPaymentConfirmed, getPaymentByMemo } from './paymentService.js';

interface JettonConfig {
  symbol: string;
  master: string;
  decimals: number;
}

function getJettons(): JettonConfig[] {
  const base: JettonConfig[] = [];
  if (env.tonJettonMaster) base.push({ symbol: 'JET', master: env.tonJettonMaster, decimals: env.tonJettonDecimals });
  const parsed = env.jettonTokens || [];
  parsed.forEach((j: any) => {
    if (j.master) base.push({ symbol: j.symbol || 'JET', master: j.master, decimals: j.decimals || 9 });
  });
  return base;
}

export function startJettonWatcher() {
  const jettons = getJettons();
  if (!env.tonapiKey || !jettons.length) {
    console.warn('Jetton watcher disabled: no jettons or TONAPI_KEY missing');
    return;
  }
  const interval = Math.max(10000, env.tonPollIntervalMs);
  setInterval(async () => {
    try {
      const url = `https://tonapi.io/v2/blockchain/accounts/${env.tonWallet}/transactions`;
      const { data } = await axios.get(url, {
        params: { limit: 50 },
        headers: { Authorization: `Bearer ${env.tonapiKey}` }
      });
      const txs = data?.transactions || [];
      for (const tx of txs) {
        const transfers = tx.jetton_transfers || [];
        for (const tr of transfers) {
          const master = tr?.jetton?.address || tr?.jetton_master?.address || tr?.jetton_master;
          const jet = jettons.find((j) => j.master === master);
          if (!jet) continue;
          const comment = tr?.comment || tr?.message;
          if (!comment) continue;
          const payment = await getPaymentByMemo(comment);
          if (!payment || payment.token_symbol.toUpperCase() !== (jet.symbol || 'JET').toUpperCase()) continue;
          const expected = BigInt(Math.ceil(Number(payment.amount) * 10 ** (jet.decimals || 9)));
          const value = BigInt(tr?.amount || tr?.value || 0);
          if (value < expected) continue;
          const from = tr?.sender?.address || tx.in_msg?.source;
          await markPaymentConfirmed(comment, from, tx.hash);
          console.log('Jetton payment confirmed', comment, jet.symbol);
        }
      }
    } catch (err: any) {
      console.error('Jetton watcher error', err.message || err);
    }
  }, interval);
}
