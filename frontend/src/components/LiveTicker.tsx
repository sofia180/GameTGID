import { useEffect, useState } from 'react';

const samples = [
  '🔥 Alex won $38',
  '💰 Maria earned $12',
  '⚡ Only 120 spots left',
  '🏆 BIG WIN $210',
  '🌍 Player joined from Germany',
  '🔥 Zoe cashed $55',
  '💥 Rapid match starting now',
];

export default function LiveTicker() {
  const [items, setItems] = useState<string[]>(samples);

  useEffect(() => {
    const id = setInterval(() => {
      const news = samples[Math.floor(Math.random() * samples.length)];
      setItems((prev) => [...prev.slice(1), news]);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const loop = items.concat(items);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 shadow-neon ticker-mask">
      <div className="absolute inset-0 bg-gradient-to-r from-[#9a4dff]/15 via-[#3ad3ff]/12 to-[#37fff2]/15" />
      <div className="relative flex gap-6 animate-marquee whitespace-nowrap text-sm text-slate-100">
        {loop.map((item, idx) => (
          <span key={idx} className="px-2 text-cyan-100 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3ad3ff] shadow-neon" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
