import { Request, Response } from 'express';
import { AuthedRequest } from '../middleware/telegramAuth.js';
import { createPaymentIntent, verifyTonPayment, markPaymentConfirmed, getPaymentByMemo } from '../services/paymentService.js';
import { pool } from '../db/pool.js';

export async function paymentIntent(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { tournamentId } = req.body;
  if (!tournamentId) return res.status(400).json({ error: 'tournamentId required' });
  const { rows } = await pool.query('SELECT entry_fee FROM tournaments WHERE id=$1', [tournamentId]);
  if (!rows.length) return res.status(404).json({ error: 'Tournament not found' });
  const fee = Number(rows[0].entry_fee || 0);
  if (fee <= 0) return res.status(400).json({ error: 'Tournament has no entry fee' });
  const payment = await createPaymentIntent(req.user.id, Number(tournamentId), fee);
  res.json({ memo: payment.memo, amount: fee, wallet: process.env.TON_WALLET });
}

export async function paymentVerify(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { memo, fromAddress, amountNano } = req.body || {};
  if (!memo || !fromAddress || !amountNano) return res.status(400).json({ error: 'memo, fromAddress, amountNano required' });
  const payment = await getPaymentByMemo(memo);
  if (!payment || payment.user_id !== req.user.id) return res.status(404).json({ error: 'Payment not found' });

  const result = await verifyTonPayment({ fromAddress, amountNano: amountNano.toString(), memo });
  if (!result.ok) return res.status(402).json({ error: 'Payment not confirmed on chain' });
  const updated = await markPaymentConfirmed(memo, fromAddress, result.txHash);
  res.json({ status: 'confirmed', payment: updated });
}

export async function walletLink(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { tournamentId } = req.query;
  if (!tournamentId) return res.status(400).json({ error: 'tournamentId required' });
  const { rows } = await pool.query('SELECT entry_fee FROM tournaments WHERE id=$1', [tournamentId]);
  if (!rows.length) return res.status(404).json({ error: 'Tournament not found' });
  const fee = Number(rows[0].entry_fee || 0);
  const intent = await createPaymentIntent(req.user.id, Number(tournamentId), fee);
  const amount = fee > 0 ? fee : 0;
  const tonTransferUrl = `ton://transfer/${process.env.TON_WALLET}?amount=${Math.ceil(amount * 1e9)}&text=${intent.memo}`;
  const telegramWalletUrl = `https://t.me/wallet?startapp=transfer-${process.env.TON_WALLET}-${amount}-${intent.memo}`;
  res.json({ memo: intent.memo, amount, tonTransferUrl, telegramWalletUrl });
}
