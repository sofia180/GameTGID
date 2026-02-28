import axios from 'axios';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { Payment } from '../models/types.js';

export interface PaymentCheck {
  fromAddress: string;
  amountNano: string; // TON values in nanotons as string to avoid float
  memo?: string;
}

export async function createPaymentIntent(userId: number, tournamentId: number, amount: number, tokenSymbol: string = 'TON'): Promise<Payment> {
  const memo = `tt-${randomUUID()}`;
  const { rows } = await pool.query(
    `INSERT INTO payments (user_id, tournament_id, amount, memo, status, token_symbol)
     VALUES ($1,$2,$3,$4,'pending',$5) RETURNING *`,
    [userId, tournamentId, amount, memo, tokenSymbol]
  );
  return rows[0];
}

export async function verifyTonPayment(input: PaymentCheck): Promise<{ ok: boolean; txHash?: string }> {
  if (!env.tonWallet) throw new Error('TON_WALLET not configured');
  const url = `https://toncenter.com/api/v2/getTransactions`;
  const params = {
    address: env.tonWallet,
    limit: 50,
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
      (!input.memo || comment === input.memo);
  });
  return match ? { ok: true, txHash: match?.transaction_id?.hash } : { ok: false };
}

export async function markPaymentConfirmed(memo: string, fromAddress: string, txHash?: string) {
  const { rows } = await pool.query(
    `UPDATE payments SET status='confirmed', from_address=$2, tx_hash=$3, confirmed_at=NOW()
     WHERE memo=$1 RETURNING *`,
    [memo, fromAddress, txHash]
  );
  return rows[0] as Payment | undefined;
}

export async function findConfirmedPayment(userId: number, tournamentId: number): Promise<Payment | null> {
  const { rows } = await pool.query(
    `SELECT * FROM payments WHERE user_id=$1 AND tournament_id=$2 AND status='confirmed' ORDER BY confirmed_at DESC LIMIT 1`,
    [userId, tournamentId]
  );
  return rows[0] || null;
}

export async function getPaymentByMemo(memo: string): Promise<Payment | null> {
  const { rows } = await pool.query('SELECT * FROM payments WHERE memo=$1', [memo]);
  return rows[0] || null;
}
