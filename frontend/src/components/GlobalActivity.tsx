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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-900/30">
      <h3 className="font-semibold mb-2 text-white">Global joins</h3>
      <div className="space-y-2 text-sm">
        {events.map((e, idx) => (
          <div key={e.ts + idx} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2 animate-fade-in">
            <span className="text-slate-100">🌍 {e.country}</span>
            <span className="text-emerald-200">joined {e.game}</span>
          </div>
        ))}
        {!events.length && <div className="text-slate-500 text-sm">Waiting for players...</div>}
      </div>
    </div>
  );
}
