import axios from 'axios';
import { env } from '../config/env.js';
import { markPaymentConfirmed } from './paymentService.js';

export function startJettonWatcher() {
  if (!env.tonJettonMaster || !env.tonapiKey) {
    console.warn('Jetton watcher disabled: TON_JETTON_MASTER or TONAPI_KEY missing');
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
        const transfers = tx.in_msg?.decoded?.jetton_transfer ? [tx.in_msg.decoded.jetton_transfer] : tx.jetton_transfers || [];
        for (const tr of transfers) {
          const master = tr?.jetton?.address || tr?.jetton_master?.address || tr?.jetton_master;
          if (!master || master !== env.tonJettonMaster) continue;
          const comment = tr?.comment || tr?.message;
          const amountRaw = tr?.amount || tr?.value || '0';
          if (!comment) continue;
          await markPaymentConfirmed(comment, tr?.sender?.address || tx.in_msg?.source, tx.hash);
        }
      }
    } catch (err) {
      console.error('Jetton watcher error', err.message || err);
    }
  }, interval);
}
