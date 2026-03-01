import { Request, Response } from 'express';
import { Chess } from 'chess.js';
import { pool } from '../db/pool.js';
import { AuthedRequest } from '../middleware/telegramAuth.js';
import { emitEvent } from '../utils/events.js';

function ensurePlayerAccess(row: any, userId: number) {
  if (row.player1 !== userId && row.player2 !== userId) {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}

export async function myMatches(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { rows } = await pool.query(
    'SELECT * FROM matches WHERE player1=$1 OR player2=$1 ORDER BY id DESC',
    [req.user.id]
  );
  res.json({ matches: rows });
}

export async function matchState(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const matchId = Number(req.params.id);
  const { rows } = await pool.query('SELECT * FROM matches WHERE id=$1', [matchId]);
  if (!rows.length) return res.status(404).json({ error: 'Match not found' });
  const match = rows[0];
  ensurePlayerAccess(match, req.user.id);
  if (match.game_type === 'chess') {
    let fen = match.state || new Chess().fen();
    if (!match.state) {
      await pool.query('UPDATE matches SET state=$2, status=$3 WHERE id=$1', [matchId, fen, 'in_progress']);
    }
    return res.json({ fen, match });
  }

  if (match.game_type === 'checkers') {
    let state = match.state ? JSON.parse(match.state) : initCheckers();
    if (!match.state) {
      await pool.query('UPDATE matches SET state=$2, status=$3 WHERE id=$1', [matchId, JSON.stringify(state), 'in_progress']);
    }
    return res.json({ state, match });
  }

  if (match.game_type === 'battleship') {
    let state = match.state ? JSON.parse(match.state) : initBattle();
    if (!match.state) {
      await pool.query('UPDATE matches SET state=$2, status=$3 WHERE id=$1', [matchId, JSON.stringify(state), 'in_progress']);
    }
    return res.json({ state, match });
  }

  return res.status(400).json({ error: 'Unsupported game' });
}

export async function move(req: AuthedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const matchId = Number(req.params.id);
  const { rows } = await pool.query('SELECT * FROM matches WHERE id=$1', [matchId]);
  if (!rows.length) return res.status(404).json({ error: 'Match not found' });
  const match = rows[0];
  ensurePlayerAccess(match, req.user.id);

  if (match.game_type === 'chess') {
    const { from, to, promotion } = req.body || {};
    if (!from || !to) return res.status(400).json({ error: 'from and to required' });
    const chess = new Chess(match.state || undefined);
    const isWhite = match.player1 === req.user.id;
    if ((isWhite && chess.turn() !== 'w') || (!isWhite && chess.turn() !== 'b')) return res.status(400).json({ error: 'Not your turn' });
    const result = chess.move({ from, to, promotion });
    if (!result) return res.status(400).json({ error: 'Illegal move' });
    let winner = null;
    let status = 'in_progress';
    if (chess.isCheckmate()) { winner = isWhite ? match.player1 : match.player2; status = 'completed'; }
    else if (chess.isDraw() || chess.isStalemate()) { status = 'completed'; }
    const fen = chess.fen();
    await pool.query('UPDATE matches SET state=$2, winner=$3, status=$4 WHERE id=$1', [matchId, fen, winner, status]);
    emitEvent('match:updated', { tournamentId: match.tournament_id, matchId, winnerId: winner || undefined });
    return res.json({ fen, status, winner });
  }

  if (match.game_type === 'checkers') {
    const { from, to } = req.body || {};
    if (!from || !to) return res.status(400).json({ error: 'from and to required' });
    let state = match.state ? JSON.parse(match.state) : initCheckers();
    const isP1 = match.player1 === req.user.id;
    if ((isP1 && state.turn !== 'p1') || (!isP1 && state.turn !== 'p2')) return res.status(400).json({ error: 'Not your turn' });
    const mv = applyCheckersMove(state, from, to, isP1 ? 'w' : 'b');
    if (!mv.ok) return res.status(400).json({ error: mv.error });
    let winner = null; let status = 'in_progress';
    if (mv.winner) { winner = mv.winner === 'p1' ? match.player1 : match.player2; status = 'completed'; }
    await pool.query('UPDATE matches SET state=$2, winner=$3, status=$4 WHERE id=$1',
      [matchId, JSON.stringify(state), winner, status]);
    emitEvent('match:updated', { tournamentId: match.tournament_id, matchId, winnerId: winner || undefined });
    return res.json({ state, status, winner });
  }

  if (match.game_type === 'battleship') {
    const { target } = req.body || {};
    if (!target) return res.status(400).json({ error: 'target required' });
    let state = match.state ? JSON.parse(match.state) : initBattle();
    const isP1 = match.player1 === req.user.id;
    const mv = applyBattleMove(state, target, isP1 ? 'p1' : 'p2');
    if (!mv.ok) return res.status(400).json({ error: mv.error });
    let winner = null; let status = 'in_progress';
    if (mv.winner) { winner = mv.winner === 'p1' ? match.player1 : match.player2; status = 'completed'; }
    await pool.query('UPDATE matches SET state=$2, winner=$3, status=$4 WHERE id=$1',
      [matchId, JSON.stringify(state), winner, status]);
    emitEvent('match:updated', { tournamentId: match.tournament_id, matchId, winnerId: winner || undefined });
    return res.json({ state, status, winner });
  }

  return res.status(400).json({ error: 'Unsupported game' });
}

// --- Checkers helpers ---
function initCheckers() {
  // 8x8 board index 0..63, null empty, w/b, uppercase king
  const board = Array(64).fill(null);
  const fill = (idxs: number[], v: string) => idxs.forEach((i) => board[i] = v);
  fill([1,3,5,7,8,10,12,14,17,19,21,23], 'b');
  fill([40,42,44,46,49,51,53,55,56,58,60,62], 'w');
  return { board, turn: 'p1' as 'p1'|'p2' };
}
function idxFromCoord(coord: string) {
  const file = coord[0].toLowerCase().charCodeAt(0) - 97;
  const rank = 8 - parseInt(coord[1],10);
  return rank * 8 + file;
}
function applyCheckersMove(state: any, from: string, to: string, color: 'w'|'b') {
  const fi = idxFromCoord(from); const ti = idxFromCoord(to);
  const piece = state.board[fi];
  if (!piece || piece.toLowerCase() !== color) return { ok: false, error: 'Not your piece' };
  const dir = color === 'w' ? -1 : 1;
  const allowed = state.turn === (color === 'w' ? 'p1' : 'p2');
  if (!allowed) return { ok:false, error:'Not your turn' };
  const rowF = Math.floor(fi/8), colF = fi%8;
  const rowT = Math.floor(ti/8), colT = ti%8;
  const dr = rowT - rowF, dc = colT - colF;
  // simple move
  if (Math.abs(dr) === 1 && Math.abs(dc) === 1 && state.board[ti] === null) {
    if (piece === 'w' && dr !== -1 && piece !== 'W') return { ok:false, error:'Illegal dir' };
    if (piece === 'b' && dr !== 1 && piece !== 'B') return { ok:false, error:'Illegal dir' };
    state.board[ti] = piece;
    state.board[fi] = null;
  } else if (Math.abs(dr) === 2 && Math.abs(dc) === 2) {
    const midR = (rowF + rowT)/2, midC = (colF + colT)/2;
    const mid = midR*8 + midC;
    const jumped = state.board[mid];
    if (!jumped || jumped.toLowerCase() === color) return { ok:false, error:'No enemy to capture' };
    if (piece === 'w' && dr !== -2 && piece !== 'W') return { ok:false, error:'Illegal dir' };
    if (piece === 'b' && dr !== 2 && piece !== 'B') return { ok:false, error:'Illegal dir' };
    state.board[mid] = null;
    state.board[ti] = piece;
    state.board[fi] = null;
  } else {
    return { ok:false, error:'Illegal move' };
  }
  // kinging
  if (piece === 'w' && rowT === 0) state.board[ti] = 'W';
  if (piece === 'b' && rowT === 7) state.board[ti] = 'B';
  state.turn = state.turn === 'p1' ? 'p2' : 'p1';
  const remainW = state.board.filter((p:any)=>p && p.toLowerCase()==='w').length;
  const remainB = state.board.filter((p:any)=>p && p.toLowerCase()==='b').length;
  let winner: 'p1'|'p2'|null = null;
  if (remainW === 0) winner = 'p2';
  if (remainB === 0) winner = 'p1';
  return { ok:true, winner };
}

// --- Battleship helpers ---
const gridSize = 5;
function coordToIdxBatt(c:string){ const f=c[0].toUpperCase().charCodeAt(0)-65; const r=parseInt(c.slice(1),10)-1; if(f<0||f>=gridSize||r<0||r>=gridSize) return -1; return r*gridSize+f; }
function randomShips(count=3){ const set=new Set<number>(); while(set.size<count){ const v=Math.floor(Math.random()*gridSize*gridSize); set.add(v);} return Array.from(set); }
function initBattle(){ return { turn:'p1', p1:{ships:randomShips(), shots:[], hits:[]}, p2:{ships:randomShips(), shots:[], hits:[]} }; }
function applyBattleMove(state:any, target:string, who:'p1'|'p2'){ if(state.turn!==who) return {ok:false,error:'Not your turn'}; const idx=coordToIdxBatt(target); if(idx<0) return {ok:false,error:'Bad coord'}; const me=state[who]; if(me.shots.includes(idx)) return {ok:false,error:'Already shot'}; me.shots.push(idx); const opp=state[who==='p1'?'p2':'p1']; if(opp.ships.includes(idx)) me.hits.push(idx); state.turn = state.turn==='p1'?'p2':'p1'; let winner=null; if(me.hits.length>=opp.ships.length) winner=who; return {ok:true,winner}; }
