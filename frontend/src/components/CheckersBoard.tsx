import { useState } from 'react';

const files = ['a','b','c','d','e','f','g','h'];
const ranks = ['8','7','6','5','4','3','2','1'];
const pieceChar: Record<string,string> = { w:'⛂', b:'⛀', W:'⛃', B:'⛁' };

function coord(idx:number){ const file = files[idx%8]; const rank = ranks[Math.floor(idx/8)]; return `${file}${rank}`; }

export default function CheckersBoard({ state, onMove, isMyTurn }:{ state:any; onMove:(from:string,to:string)=>void; isMyTurn:boolean; }) {
  const [sel,setSel] = useState<string|null>(null);
  const board:string[] = state?.board || Array(64).fill(null);

  function handle(idx:number){
    if(!isMyTurn) return;
    const c = coord(idx);
    if(sel){ if(sel===c){ setSel(null); return; } onMove(sel,c); setSel(null); }
    else { setSel(c); }
  }

  return (
    <div className="grid grid-cols-8 w-full max-w-md overflow-hidden rounded-xl border border-slate-700">
      {board.map((p,idx)=>{
        const dark = ((idx + Math.floor(idx/8))%2)===1;
        const c = coord(idx);
        const selected = sel===c;
        return (
          <div key={c} onClick={()=>handle(idx)} className={`aspect-square flex items-center justify-center text-xl ${dark?'bg-slate-800':'bg-slate-700'} ${selected?'ring-2 ring-emerald-400':''}`}>
            <span>{p ? pieceChar[p] : ''}</span>
          </div>
        );
      })}
    </div>
  );
}
