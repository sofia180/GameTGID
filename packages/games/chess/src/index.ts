import { Chess } from "chess.js";

export type Player = "p1" | "p2";

export interface ChessMove {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
}

export function createChess() {
  const chess = new Chess();
  const state = {
    fen: chess.fen(),
    turn: "p1" as Player
  };

  return {
    state,
    applyMove(player: Player, move: ChessMove | string) {
      const isWhite = chess.turn() === "w";
      const expectedPlayer: Player = isWhite ? "p1" : "p2";
      if (player != expectedPlayer) {
        return { valid: false, error: "Not your turn" } as const;
      }

      const result = typeof move == "string" ? chess.move(move) : chess.move(move);
      if (!result) {
        return { valid: false, error: "Illegal move" } as const;
      }

      state.fen = chess.fen();
      state.turn = chess.turn() === "w" ? "p1" : "p2";

      const outcome = chess.isGameOver()
        ? {
            status: chess.isDraw() ? "draw" : "win",
            winner: chess.isDraw() ? null : (player as Player)
          }
        : { status: "ongoing" };

      return {
        valid: true,
        state: { ...state },
        outcome
      } as const;
    },
    getAvailableMoves() {
      return chess.moves({ verbose: true });
    }
  };
}
