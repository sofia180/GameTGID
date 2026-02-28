import { Request, Response } from 'express';
import { reportResult, getLeaderboard } from '../services/matchService.js';

export async function reportMatch(req: Request, res: Response) {
  const matchId = Number(req.params.id);
  const { winnerId } = req.body || {};
  if (!matchId || !winnerId) return res.status(400).json({ error: 'matchId and winnerId required' });
  const match = await reportResult(matchId, Number(winnerId));
  res.json({ match });
}

export async function leaderboard(req: Request, res: Response) {
  const tournamentId = Number(req.params.id);
  const rows = await getLeaderboard(tournamentId);
  res.json({ leaderboard: rows });
}
