export type TournamentStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type MatchStatus = 'pending' | 'in_progress' | 'completed';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed';
export type GameType = 'chess' | 'checkers' | 'arcade';

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  balance: number;
  created_at: string;
}

export interface Tournament {
  id: number;
  title: string;
  entry_fee: number;
  prize_pool: number;
  status: TournamentStatus;
  game_type: GameType;
  created_at: string;
}

export interface Participant {
  id: number;
  user_id: number;
  tournament_id: number;
}

export interface Match {
  id: number;
  tournament_id: number;
  player1: number;
  player2: number;
  winner?: number | null;
  status: MatchStatus;
  game_type?: GameType;
}

export interface Payment {
  id: number;
  user_id: number;
  tournament_id: number;
  amount: number;
  memo: string;
  from_address?: string;
  tx_hash?: string;
  status: PaymentStatus;
}
