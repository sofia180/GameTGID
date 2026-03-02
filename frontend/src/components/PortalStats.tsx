import { motion } from 'framer-motion';

export default function PortalStats({ stats }: { stats: { online: number; winnings: number; tournaments: number; biggest: number } }) {
  const items = [
    { label: 'Players online', value: stats.online, color: 'from-cyan-400 to-blue-500' },
    { label: 'Winnings today', value: `$${stats.winnings.toLocaleString()}`, color: 'from-emerald-400 to-teal-500' },
    { label: 'Active tournaments', value: stats.tournaments, color: 'from-violet-400 to-indigo-500' },
    { label: 'Biggest win', value: `$${stats.biggest}`, color: 'from-pink-400 to-rose-500' },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {items.map((i) => (
        <motion.div
          key={i.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-${i.color.split(' ')[1]}/20`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${i.color} opacity-20 blur-3xl`} />
          <div className="text-xs uppercase tracking-wide text-slate-300">{i.label}</div>
          <div className="text-2xl font-semibold text-white mt-1 drop-shadow">{i.value}</div>
        </motion.div>
      ))}
    </div>
  );
}
