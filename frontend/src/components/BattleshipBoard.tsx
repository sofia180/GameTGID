import { useMemo } from 'react';

const size = 5;
const files = ['A','B','C','D','E'];

function idxToCoord(idx:number){ const r=Math.floor(idx/size); const f=idx%size; return `${files[f]}${r+1}`; }

export default function BattleshipBoard({ state, isMyTurn, onShoot, me }:{ state:any; isMyTurn:boolean; onShoot:(coord:string)=>void; me:'p1'|'p2'; }) {
  const oppKey = me==='p1'?'p2':'p1';
  const shots = state?.[me]?.shots || [];
  const hits = state?.[me]?.hits || [];

  const grid = useMemo(()=>{
    const arr = Array(size*size).fill('');
    shots.forEach((i:number)=>arr[i]='•');
    hits.forEach((i:number)=>arr[i]='🔥');
    return arr;
  },[shots,hits]);

  function handle(idx:number){
    if(!isMyTurn) return;
    if(grid[idx]) return; // already shot
    onShoot(idxToCoord(idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-200"><span>Opponent grid</span><span>{isMyTurn? 'Your turn' : 'Waiting'}</span></div>
      <div className="grid grid-cols-5 w-full max-w-xs gap-[2px]">
        {grid.map((cell,idx)=>(
          <div key={idx} onClick={()=>handle(idx)} className={`aspect-square flex items-center justify-center rounded bg-slate-800 text-lg ${isMyTurn && !cell ? 'cursor-pointer hover:bg-slate-700' : ''}`}>
            <span>{cell}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
