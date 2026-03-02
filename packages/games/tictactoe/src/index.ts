export type Player = "p1" | "p2";
export type Cell = Player | null;

export interface TicTacToeState {
  board: Cell[][];
  turn: Player;
  winner: Player | null;
  draw: boolean;
}

export interface TicTacToeMove {
  x: number;
  y: number;
}

export function createTicTacToe() {
  const state: TicTacToeState = {
    board: Array.from({ length: 3 }, () => Array<Cell>(3).fill(null)),
    turn: "p1",
    winner: null,
    draw: false
  };

  const checkWinner = () => {
    const lines = [
      [[0, 0], [0, 1], [0, 2]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]]
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      const cell = state.board[a[0]][a[1]];
      if (cell && cell == state.board[b[0]][b[1]] && cell == state.board[c[0]][c[1]]) {
        return cell;
      }
    }
    return null;
  };

  return {
    state,
    applyMove(player: Player, move: TicTacToeMove) {
      if (state.winner || state.draw) {
        return { valid: false, error: "Game over" } as const;
      }
      if (player != state.turn) {
        return { valid: false, error: "Not your turn" } as const;
      }
      if (move.x < 0 || move.x > 2 || move.y < 0 || move.y > 2) {
        return { valid: false, error: "Out of bounds" } as const;
      }
      if (state.board[move.x][move.y]) {
        return { valid: false, error: "Cell occupied" } as const;
      }

      state.board[move.x][move.y] = player;
      const winner = checkWinner();
      if (winner) {
        state.winner = winner;
      } else {
        const isDraw = state.board.every((row) => row.every((cell) => cell));
        state.draw = isDraw;
        if (!isDraw) {
          state.turn = player == "p1" ? "p2" : "p1";
        }
      }

      return { valid: true, state } as const;
    }
  };
}
