import { useEffect, useState } from 'react';

const countries = ['Germany', 'USA', 'Japan', 'Brazil', 'India', 'UK', 'Canada', 'France', 'UAE', 'Turkey'];
const games = ['Chess', 'Checkers', 'Arcade', 'Dota2', 'CS'];

export default function GlobalActivity() {
  const [events, setEvents] = useState<{ country: string; game: string; ts: number }[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      const ev = {
        country: countries[Math.floor(Math.random() * countries.length)],
        game: games[Math.floor(Math.random() * games.length)],
        ts: Date.now(),
      };
      setEvents((prev) => [ev, ...prev].slice(0, 8));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-purple panel">
      <h3 className="font-semibold mb-2 text-white">Глобальные входы</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {events.map((e, idx) => (
          <div
            key={e.ts + idx}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 animate-fade-in border border-white/5"
          >
            <span className="text-slate-100">🌍 {e.country}</span>
            <span className="text-cyan-200">+ {e.game}</span>
          </div>
        ))}
        {!events.length && <div className="text-slate-500 text-sm col-span-2">Waiting for players...</div>}
      </div>
    </div>
  );
}
