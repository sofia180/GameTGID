export type Player = "p1" | "p2";
export type Cell = Player | null;

export interface CheckersState {
  board: Cell[][];
  turn: Player;
  winner: Player | null;
  draw: boolean;
}

export interface CheckersMove {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const SIZE = 8;

const createBoard = () => {
  const board: Cell[][] = Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
  for (let x = 0; x < SIZE; x += 1) {
    for (let y = 0; y < 3; y += 1) {
      if ((x + y) % 2 == 1) board[x][y] = "p2";
    }
    for (let y = SIZE - 3; y < SIZE; y += 1) {
      if ((x + y) % 2 == 1) board[x][y] = "p1";
    }
  }
  return board;
};

const inside = (x: number, y: number) => x >= 0 && x < SIZE && y >= 0 && y < SIZE;

export function createCheckers() {
  const state: CheckersState = {
    board: createBoard(),
    turn: "p1",
    winner: null,
    draw: false
  };

  const directions = {
    p1: -1,
    p2: 1
  } as const;

  const hasMoves = (player: Player) => {
    for (let x = 0; x < SIZE; x += 1) {
      for (let y = 0; y < SIZE; y += 1) {
        if (state.board[x][y] != player) continue;
        const dir = directions[player];
        for (const dx of [-1, 1]) {
          const nx = x + dx;
          const ny = y + dir;
          if (inside(nx, ny) && state.board[nx][ny] == null) return true;
          const cx = x + dx;
          const cy = y + dir;
          const jumpX = x + dx * 2;
          const jumpY = y + dir * 2;
          if (
            inside(jumpX, jumpY) &&
            state.board[cx]?.[cy] &&
            state.board[cx]?.[cy] != player &&
            state.board[jumpX][jumpY] == null
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  return {
    state,
    applyMove(player: Player, move: CheckersMove) {
      if (state.winner || state.draw) return { valid: false, error: "Game over" } as const;
      if (player != state.turn) return { valid: false, error: "Not your turn" } as const;

      const { from, to } = move;
      if (!inside(from.x, from.y) || !inside(to.x, to.y)) {
        return { valid: false, error: "Out of bounds" } as const;
      }
      if (state.board[from.x][from.y] != player) {
        return { valid: false, error: "Invalid piece" } as const;
      }
      if (state.board[to.x][to.y] != null) {
        return { valid: false, error: "Destination occupied" } as const;
      }

      const dir = directions[player];
      const dx = to.x - from.x;
      const dy = to.y - from.y;

      const isSimple = Math.abs(dx) == 1 && dy == dir;
      const isCapture = Math.abs(dx) == 2 && dy == dir * 2;

      if (!isSimple && !isCapture) {
        return { valid: false, error: "Illegal move" } as const;
      }

      if (isCapture) {
        const midX = from.x + dx / 2;
        const midY = from.y + dy / 2;
        const mid = state.board[midX][midY];
        if (!mid || mid == player) {
          return { valid: false, error: "No capture" } as const;
        }
        state.board[midX][midY] = null;
      }

      state.board[from.x][from.y] = null;
      state.board[to.x][to.y] = player;

      const opponent: Player = player == "p1" ? "p2" : "p1";
      const opponentHasPieces = state.board.some((row) => row.some((cell) => cell == opponent));
      if (!opponentHasPieces || !hasMoves(opponent)) {
        state.winner = player;
      } else {
        state.turn = opponent;
      }

      return { valid: true, state } as const;
    }
  };
}
