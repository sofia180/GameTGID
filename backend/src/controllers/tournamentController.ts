import { Request, Response } from 'express';
import { z } from 'zod';
import { createTournament, joinTournament, listTournaments, startTournament, completeTournament, tournamentById, listParticipants, listMatches } from '../services/tournamentService.js';
import { AuthedRequest } from '../middleware/telegramAuth.js';
import { pairPlayers } from '../services/matchmakingService.js';
import { findConfirmedPayment } from '../services/paymentService.js';

const createSchema = z.object({
  title: z.string().min(3),
  entry_fee: z.number().nonnegative(),
  prize_pool: z.number().nonnegative(),
  game_type: z.enum(['chess', 'checkers', 'arcade', 'dota2', 'csgo']).default('arcade')
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
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const tournament = await tournamentById(tournamentId);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  if (Number(tournament.entry_fee) > 0) {
    const confirmed = await findConfirmedPayment(req.user.id, tournamentId);
    if (!confirmed) return res.status(402).json({ error: 'Payment required' });
  }

  await joinTournament(tournamentId, req.user.id);
  const newMatches = await pairPlayers(tournamentId);
  res.json({ status: 'joined', matchesCreated: newMatches.length });
}

export async function startTournamentHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  await startTournament(id);
  res.json({ status: 'started' });
}

export async function completeTournamentHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  await completeTournament(id);
  res.json({ status: 'completed' });
}

export async function participantsHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  const participants = await listParticipants(id);
  res.json({ participants });
}

export async function matchesHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  const matches = await listMatches(id);
  res.json({ matches });
}
