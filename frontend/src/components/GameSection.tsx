import { motion } from 'framer-motion';

interface Game {
  id: number;
  name: string;
  status: string;
  players_online?: number;
  prize_pool?: number;
  difficulty?: string;
  tags?: string[];
}

export default function GameSection({ title, games, onPlay, loading }: { title: string; games: Game[]; onPlay: (g: Game) => void; loading?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {games.map((g, idx) => (
          <motion.button
            key={g.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.02 } }}
            onClick={() => g.status === 'live' && onPlay(g)}
            disabled={loading || g.status !== 'live'}
            className={`relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-3 text-left text-white shadow-lg shadow-slate-900/30 transition disabled:opacity-50`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-70" />
            <div className="absolute -inset-px rounded-xl border border-white/10" />
            <div className="flex items-center justify-between gap-2">
              <div className="text-lg font-semibold drop-shadow">{g.name}</div>
              {g.status === 'live' ? (
                <span className="text-[11px] bg-emerald-400 text-black px-2 py-0.5 rounded-full">Live</span>
              ) : (
                <span className="text-[11px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">Coming</span>
              )}
            </div>
            <div className="text-xs text-slate-200/80 mt-1 flex gap-2 flex-wrap">
              {g.players_online !== undefined && <span>👥 {g.players_online} online</span>}
              {g.prize_pool !== undefined && <span>🏆 ${g.prize_pool}</span>}
              {g.difficulty && <span>⚡ {g.difficulty}</span>}
            </div>
            <div className="mt-2 inline-flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-white/85 text-black font-semibold shadow">
                {loading && g.status === 'live' ? 'Starting…' : g.status === 'live' ? 'Play now' : 'Soon'}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
