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
    <div className="mb-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 border border-emerald-500/30 p-4 shadow-emerald-500/30 shadow-lg">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <p className="text-xs uppercase text-emerald-200 tracking-widest">Main Tournament</p>
          <div className="text-3xl font-bold text-white flex items-baseline gap-2">
            <span className="animate-number">${prize.toLocaleString()} </span>
            <span className="text-sm text-emerald-200">Prize Pool</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-300">Countdown</p>
          <div className="text-2xl font-semibold text-emerald-200 font-mono">{hh}:{mm}:{ss}</div>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-300">Players joined</p>
          <div className="text-xl font-semibold text-white animate-number">{players}</div>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-300">Spots left</p>
          <div className="text-xl font-semibold text-amber-300 animate-number">{spots}</div>
        </div>
        <button className="btn-neo px-6 py-3 bg-emerald-400 text-black font-semibold rounded-xl animate-pulse-slow shadow-lg shadow-emerald-500/40">
          Join Now
        </button>
      </div>
    </div>
  );
}
