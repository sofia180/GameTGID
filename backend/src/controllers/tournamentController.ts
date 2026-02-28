import { Request, Response } from 'express';
import { z } from 'zod';
import { createTournament, joinTournament, listTournaments } from '../services/tournamentService.js';
import { AuthedRequest } from '../middleware/telegramAuth.js';
import { pairPlayers } from '../services/matchmakingService.js';
import { verifyTonPayment } from '../services/paymentService.js';

const createSchema = z.object({
  title: z.string().min(3),
  entry_fee: z.number().nonnegative(),
  prize_pool: z.number().nonnegative()
});

export async function getTournaments(_req: Request, res: Response) {
  const tournaments = await listTournaments();
  res.json({ tournaments });
}

export async function createTournamentHandler(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const tournament = await createTournament(parsed.data);
  res.status(201).json({ tournament });
}

export async function joinTournamentHandler(req: AuthedRequest, res: Response) {
  const tournamentId = Number(req.params.id);
  const { walletAddress, paymentHash, amountNano, memo } = req.body || {};
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  // Basic TON payment verification (off-chain)
  if (amountNano && walletAddress) {
    const ok = await verifyTonPayment({ fromAddress: walletAddress, amountNano: amountNano.toString(), memo });
    if (!ok) return res.status(402).json({ error: 'Payment not found or insufficient' });
  }

  await joinTournament(tournamentId, req.user.id);
  const newMatches = await pairPlayers(tournamentId);
  res.json({ status: 'joined', matchesCreated: newMatches.length });
}
