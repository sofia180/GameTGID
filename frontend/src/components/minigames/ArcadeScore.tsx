import { useEffect, useState } from 'react';

export function ArcadeScore({ onFinish }: { onFinish: (score: number) => void }) {
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setTarget((t) => t + 1);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const hit = () => {
    setScore((s) => s + 10 * multiplier);
    setMultiplier((m) => Math.min(5, m + 0.2));
    setTarget((t) => Math.max(0, t - 1));
  };

  const miss = () => {
    setMultiplier(1);
    setScore((s) => Math.max(0, s - 5));
  };

  useEffect(() => {
    const end = setTimeout(() => onFinish(score), 45000);
    return () => clearTimeout(end);
  }, [score, onFinish]);

  return (
    <div className="space-y-3 text-center">
      <p className="text-lg font-semibold text-white">Arcade Score Challenge</p>
      <p className="text-sm text-slate-300">Ударяй цели, держи серию, набери максимум за 45с.</p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 grid grid-cols-3 gap-3 text-sm text-white">
        <div className="rounded-xl bg-white/5 p-3">Счёт: <span className="text-[#3ad3ff]">{score}</span></div>
        <div className="rounded-xl bg-white/5 p-3">Целей: {target}</div>
        <div className="rounded-xl bg-white/5 p-3">Комбо: x{multiplier.toFixed(1)}</div>
      </div>
      <div className="flex justify-center gap-3">
        <button className="rounded-xl bg-gradient-to-r from-[#9a4dff] via-[#3ad3ff] to-[#37fff2] px-4 py-2 text-black font-semibold shadow-neon" onClick={hit}>
          Hit
        </button>
        <button className="rounded-xl border border-white/20 px-4 py-2 text-white" onClick={miss}>
          Miss
        </button>
      </div>
    </div>
  );
}
