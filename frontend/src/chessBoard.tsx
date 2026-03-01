import { useMemo, useState } from 'react';

const files = ['a','b','c','d','e','f','g','h'];
const ranks = ['8','7','6','5','4','3','2','1'];
const pieceMap: Record<string, string> = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

function parseFen(fen: string) {
  const board: (string | null)[] = [];
  const rows = fen.split(' ')[0].split('/');
  for (const row of rows) {
    for (const ch of row) {
      if (Number.isInteger(Number(ch))) {
        const n = Number(ch);
        for (let i = 0; i < n; i++) board.push(null);
      } else {
        board.push(ch);
      }
    }
  }
  return board; // length 64
}

export function ChessBoard({ fen, onMove, myColor, turn }: { fen: string; onMove: (from: string, to: string) => void; myColor: 'w'|'b'; turn: 'w'|'b'; }) {
  const [selected, setSelected] = useState<string | null>(null);
  const board = useMemo(() => parseFen(fen), [fen]);

  function coord(idx: number) {
    const file = files[idx % 8];
    const rank = ranks[Math.floor(idx / 8)];
    return `${file}${rank}`;
  }

  function handleClick(idx: number) {
    const square = coord(idx);
    const piece = board[idx];
    const isMyPiece = piece && ((myColor === 'w' && piece === piece.toUpperCase()) || (myColor === 'b' && piece === piece.toLowerCase()));
    if (selected) {
      if (selected === square) {
        setSelected(null);
        return;
      }
      onMove(selected, square);
      setSelected(null);
    } else if (isMyPiece && myColor === turn) {
      setSelected(square);
    }
  }

  return (
    <div className="grid grid-cols-8 w-full max-w-md overflow-hidden rounded-xl border border-slate-700">
      {board.map((piece, idx) => {
        const isDark = ((idx + Math.floor(idx / 8)) % 2) === 1;
        const square = coord(idx);
        const isSel = selected === square;
        return (
          <div
            key={square}
            onClick={() => handleClick(idx)}
            className={`aspect-square flex items-center justify-center text-2xl select-none cursor-pointer ${isDark ? 'bg-slate-800' : 'bg-slate-700'} ${isSel ? 'ring-2 ring-emerald-400' : ''}`}
          >
            <span>{piece ? pieceMap[piece] : ''}</span>
          </div>
        );
      })}
    </div>
  );
}
