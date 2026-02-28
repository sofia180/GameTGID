import { Request, Response } from 'express';
import { AuthedRequest } from '../middleware/telegramAuth.js';
import { createPaymentIntent, verifyTonPayment, markPaymentConfirmed, getPaymentByMemo } from '../services/paymentService.js';
import { pool } from '../db/pool.js';

export async function paymentIntent(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { tournamentId, token } = req.body;
  const tokenSymbol = (token || 'TON').toUpperCase();
  if (!tournamentId) return res.status(400).json({ error: 'tournamentId required' });
  const { rows } = await pool.query('SELECT entry_fee FROM tournaments WHERE id=$1', [tournamentId]);
  if (!rows.length) return res.status(404).json({ error: 'Tournament not found' });
  const fee = Number(rows[0].entry_fee || 0);
  if (fee <= 0) return res.status(400).json({ error: 'Tournament has no entry fee' });
  const payment = await createPaymentIntent(req.user.id, Number(tournamentId), fee, tokenSymbol);
  res.json({ memo: payment.memo, amount: fee, wallet: process.env.TON_WALLET, token: tokenSymbol });
}

export async function paymentVerify(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { memo, fromAddress, amountNano, token } = req.body || {};
  const tokenSymbol = (token || 'TON').toUpperCase();
  if (!memo) return res.status(400).json({ error: 'memo required' });
  const payment = await getPaymentByMemo(memo);
  if (!payment || payment.user_id !== req.user.id) return res.status(404).json({ error: 'Payment not found' });

  // For jettons we rely on watcher; allow polling status
  if (tokenSymbol !== 'TON') {
    if (payment.status === 'confirmed') return res.json({ status: 'confirmed', payment });
    return res.status(202).json({ status: payment.status });
  }

  if (!fromAddress || !amountNano) return res.status(400).json({ error: 'fromAddress and amountNano required for TON' });
  const result = await verifyTonPayment({ fromAddress, amountNano: amountNano.toString(), memo });
  if (!result.ok) return res.status(402).json({ error: 'Payment not confirmed on chain' });
  const updated = await markPaymentConfirmed(memo, fromAddress, result.txHash);
  res.json({ status: 'confirmed', payment: updated });
}

export async function walletLink(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { tournamentId, token } = req.query;
  if (!tournamentId) return res.status(400).json({ error: 'tournamentId required' });
  const tokenSymbol = (token as string || 'TON').toUpperCase();
  const { rows } = await pool.query('SELECT entry_fee FROM tournaments WHERE id=$1', [tournamentId]);
  if (!rows.length) return res.status(404).json({ error: 'Tournament not found' });
  const fee = Number(rows[0].entry_fee || 0);
  const intent = await createPaymentIntent(req.user.id, Number(tournamentId), fee, tokenSymbol);
  const amountNano = Math.ceil(fee * 1e9);
  const tonTransferUrl = `ton://transfer/${process.env.TON_WALLET}?amount=${amountNano}&text=${intent.memo}`;
  const telegramWalletUrl = `https://t.me/wallet?startapp=transfer-${process.env.TON_WALLET}-${fee}-${intent.memo}`;
  res.json({ memo: intent.memo, amount: fee, tonTransferUrl, telegramWalletUrl, token: tokenSymbol });
}

export async function paymentStatus(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { memo } = req.query;
  if (!memo) return res.status(400).json({ error: 'memo required' });
  const payment = await getPaymentByMemo(String(memo));
  if (!payment || payment.user_id !== req.user.id) return res.status(404).json({ error: 'Payment not found' });
  res.json({ status: payment.status, payment });
}
