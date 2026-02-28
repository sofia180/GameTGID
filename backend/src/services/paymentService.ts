import axios from 'axios';
import { env } from '../config/env.js';

export interface PaymentCheck {
  fromAddress: string;
  amountNano: string; // TON values in nanotons as string to avoid float
  memo?: string;
}

export async function verifyTonPayment(input: PaymentCheck): Promise<boolean> {
  if (!env.tonWallet) throw new Error('TON_WALLET not configured');
  const url = `https://toncenter.com/api/v2/getTransactions`;
  const params = {
    address: env.tonWallet,
    limit: 20,
    api_key: env.tonApiKey
  };

  const { data } = await axios.get(url, { params });
  const txs = data?.result || [];
  const match = txs.find((tx: any) => {
    const src = tx?.in_msg?.source;
    const value = tx?.in_msg?.value;
    const comment = tx?.in_msg?.message;
    return src?.toLowerCase() === input.fromAddress.toLowerCase() &&
      BigInt(value || 0) >= BigInt(input.amountNano) &&
      (!input.memo || comment?.includes(input.memo));
  });
  return Boolean(match);
}
