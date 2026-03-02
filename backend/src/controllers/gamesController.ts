import { Request, Response } from 'express';

// Lightweight in-memory registry (can be moved to DB later)
const games = [
  {
    id: 1,
    slug: 'chess',
    name: 'Chess',
    mode: 'pvp_turn',
    status: 'live',
    difficulty: 'medium',
    players_online: 233,
    prize_pool: 5200,
    tags: ['featured', 'tournament', 'trending'],
  },
  {
    id: 2,
    slug: 'checkers',
    name: 'Checkers',
    mode: 'pvp_turn',
    status: 'live',
    difficulty: 'easy',
    players_online: 118,
    prize_pool: 900,
    tags: ['trending'],
  },
  {
    id: 3,
    slug: 'battleship',
    name: 'Battleship',
    mode: 'pvp_turn',
    status: 'live',
    difficulty: 'medium',
    players_online: 142,
    prize_pool: 1100,
    tags: ['featured'],
  },
  {
    id: 4,
    slug: 'blitz-duel',
    name: 'Blitz Duel',
    mode: 'reaction',
    status: 'coming',
    difficulty: 'hard',
    players_online: 64,
    prize_pool: 1500,
    tags: ['featured', 'new'],
  },
  {
    id: 5,
    slug: 'arcade-blitz',
    name: 'Arcade Blitz',
    mode: 'skill',
    status: 'coming',
    difficulty: 'easy',
    players_online: 80,
    prize_pool: 600,
    tags: ['new'],
  },
];

export function getGames(req: Request, res: Response) {
  res.json({ games });
}
