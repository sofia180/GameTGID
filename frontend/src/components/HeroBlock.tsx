import { useEffect, useState } from 'react';

export default function HeroBlock() {
  const [prize, setPrize] = useState(5200);
  const [players, setPlayers] = useState(128);
  const [spots, setSpots] = useState(200);
  const [countdown, setCountdown] = useState(3600);

  useEffect(() => {
    const id = setInterval(() => {
      setPrize((p) => p + Math.floor(Math.random() * 12));
      setPlayers((p) => p + Math.floor(Math.random() * 3));
      setSpots((s) => Math.max(0, s - Math.floor(Math.random() * 2)));
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(Math.floor(countdown / 3600)).padStart(2, '0');
  const mm = String(Math.floor((countdown % 3600) / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  return (
    <div className="relative mb-4 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-neon panel">
      <div className="relative z-10 grid gap-4 md:grid-cols-5 items-center">
        <div className="md:col-span-2 space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Главный турнир</p>
          <div className="text-4xl font-bold text-white flex items-baseline gap-2 drop-shadow">
            <span className="animate-number">${prize.toLocaleString()}</span>
            <span className="text-sm text-cyan-200/90">Prize Pool</span>
          </div>
          <p className="text-sm text-slate-300">Бустится в реальном времени. Присоединяйся и забери свою долю.</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Countdown</p>
          <div className="text-2xl font-semibold text-neon font-mono">{hh}:{mm}:{ss}</div>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Players</p>
          <div className="text-xl font-semibold text-white animate-number">{players}</div>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Spots left</p>
          <div className="text-xl font-semibold text-amber-200 animate-number">{spots}</div>
        </div>
        <button className="md:col-span-5 btn-neo px-6 py-3 bg-gradient-to-r from-[#9a4dff] via-[#3ad3ff] to-[#37fff2] text-black font-semibold rounded-xl animate-pulse-slow shadow-purple">
          Влететь в турнир
        </button>
      </div>
    </div>
  );
}
