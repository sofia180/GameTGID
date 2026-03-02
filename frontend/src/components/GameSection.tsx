import { motion } from 'framer-motion';

interface Game {
  id: number;
  name: string;
  status?: string;
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
        {games.map((g, idx) => {
          const isLive = !g.status || g.status === 'live' || g.status === 'active';
          return (
          <motion.button
            key={g.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.02 } }}
            onClick={() => isLive && onPlay(g)}
            disabled={loading || !isLive}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-left text-white shadow-neon transition disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#9a4dff]/15 via-[#3ad3ff]/12 to-[#ff4fbf]/15 opacity-80" />
            <div className="absolute -inset-px rounded-2xl border border-white/10" />
            <div className="flex items-center justify-between gap-2">
              <div className="text-lg font-semibold drop-shadow">{g.name}</div>
              {isLive ? (
                <span className="text-[11px] bg-[#3ad3ff] text-black px-2 py-0.5 rounded-full animate-pulse-slow">Live</span>
              ) : (
                <span className="text-[11px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">Coming</span>
              )}
            </div>
            <div className="text-xs text-slate-200/80 mt-1 flex gap-2 flex-wrap">
              {g.players_online !== undefined && <span>👥 {g.players_online} online</span>}
              {g.prize_pool !== undefined && <span>🏆 ${g.prize_pool}</span>}
              {g.difficulty && <span>⚡ {g.difficulty}</span>}
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="px-3 py-1 rounded-lg bg-white/90 text-black font-semibold shadow">
                {loading && isLive ? 'Starting…' : isLive ? 'Play now' : 'Soon'}
              </span>
              <span className="text-[11px] text-cyan-200 uppercase tracking-[0.18em]">{g.tags?.join(' · ')}</span>
            </div>
          </motion.button>
        )})}
      </div>
    </div>
  );
}
