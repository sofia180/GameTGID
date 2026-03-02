export type Player = "p1" | "p2";

export interface ShipPlacement {
  x: number;
  y: number;
  length: number;
  orientation: "h" | "v";
}

export interface BattleshipMovePlace {
  type: "place";
  ships: ShipPlacement[];
}

export interface BattleshipMoveFire {
  type: "fire";
  x: number;
  y: number;
}

export type BattleshipMove = BattleshipMovePlace | BattleshipMoveFire;

export interface Cell {
  ship: boolean;
  hit: boolean;
}

export interface BattleshipState {
  size: number;
  phase: "placement" | "battle";
  turn: Player;
  winner: Player | null;
  placed: Record<Player, boolean>;
  boards: Record<Player, Cell[][]>;
}

const SIZE = 8;
const REQUIRED_SHIPS = [3, 3, 2];

const createBoard = () =>
  Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ ship: false, hit: false }))
  );

const inside = (x: number, y: number) => x >= 0 && x < SIZE && y >= 0 && y < SIZE;

export function createBattleship() {
  const state: BattleshipState = {
    size: SIZE,
    phase: "placement",
    turn: "p1",
    winner: null,
    placed: { p1: false, p2: false },
    boards: { p1: createBoard(), p2: createBoard() }
  };

  const placeShips = (player: Player, ships: ShipPlacement[]) => {
    if (ships.length != REQUIRED_SHIPS.length) return "Invalid ship count";
    const lengths = ships.map((s) => s.length).sort();
    const required = [...REQUIRED_SHIPS].sort();
    for (let i = 0; i < lengths.length; i += 1) {
      if (lengths[i] != required[i]) return "Invalid ship sizes";
    }

    const board = createBoard();
    for (const ship of ships) {
      const { x, y, length, orientation } = ship;
      for (let i = 0; i < length; i += 1) {
        const nx = orientation == "h" ? x + i : x;
        const ny = orientation == "v" ? y + i : y;
        if (!inside(nx, ny)) return "Ship out of bounds";
        if (board[nx][ny].ship) return "Overlapping ships";
      }
      for (let i = 0; i < length; i += 1) {
        const nx = orientation == "h" ? x + i : x;
        const ny = orientation == "v" ? y + i : y;
        board[nx][ny].ship = true;
      }
    }

    state.boards[player] = board;
    state.placed[player] = true;
    if (state.placed.p1 && state.placed.p2) {
      state.phase = "battle";
    }
    return null;
  };

  const allShipsSunk = (player: Player) => {
    const board = state.boards[player];
    for (const row of board) {
      for (const cell of row) {
        if (cell.ship && !cell.hit) return false;
      }
    }
    return true;
  };

  return {
    state,
    applyMove(player: Player, move: BattleshipMove) {
      if (state.winner) return { valid: false, error: "Game over" } as const;

      if (move.type == "place") {
        if (state.phase != "placement") return { valid: false, error: "Already placed" } as const;
        if (state.placed[player]) return { valid: false, error: "Already placed" } as const;
        const error = placeShips(player, move.ships);
        if (error) return { valid: false, error } as const;
        return { valid: true, state } as const;
      }

      if (state.phase != "battle") return { valid: false, error: "Waiting for placements" } as const;
      if (player != state.turn) return { valid: false, error: "Not your turn" } as const;

      if (!inside(move.x, move.y)) return { valid: false, error: "Out of bounds" } as const;
      const opponent: Player = player == "p1" ? "p2" : "p1";
      const target = state.boards[opponent][move.x][move.y];
      if (target.hit) return { valid: false, error: "Already targeted" } as const;
      target.hit = true;

      if (allShipsSunk(opponent)) {
        state.winner = player;
      } else {
        state.turn = opponent;
      }

      return { valid: true, state } as const;
    }
  };
}
