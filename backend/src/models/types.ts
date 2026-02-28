export type TournamentStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type MatchStatus = 'pending' | 'in_progress' | 'completed';

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
}
