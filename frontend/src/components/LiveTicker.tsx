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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 shadow-lg shadow-emerald-500/10">
      <div className="flex gap-6 animate-marquee whitespace-nowrap text-sm text-slate-100">
        {items.concat(items).map((item, idx) => (
          <span key={idx} className="px-2 text-emerald-200/90">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
