import { createChess } from "@games/chess";
import { createCheckers } from "@games/checkers";
import { createTicTacToe } from "@games/tictactoe";
import { createBattleship } from "@games/battleship";

export type GameType = "chess" | "checkers" | "tictactoe" | "battleship";
export type PlayerId = "p1" | "p2";

export type GameInstance = {
  state: Record<string, unknown>;
  applyMove: (player: PlayerId, move: unknown) => { valid: boolean; state?: unknown; error?: string; outcome?: { status: string; winner?: PlayerId | null } };
};

export function createGameEngine(gameType: GameType): GameInstance {
  switch (gameType) {
    case "chess":
      return createChess();
    case "checkers":
      return createCheckers();
    case "tictactoe":
      return createTicTacToe();
    case "battleship":
      return createBattleship();
    default:
      throw new Error(`Unsupported game type: ${gameType}`);
  }
}
