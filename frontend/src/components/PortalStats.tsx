import { motion } from 'framer-motion';

export default function PortalStats({ stats }: { stats: { online: number; winnings: number; tournaments: number; biggest: number } }) {
  const items = [
    { label: 'Players online', value: stats.online, gradient: 'from-[#3ad3ff] to-[#37fff2]' },
    { label: 'Winnings today', value: `$${stats.winnings.toLocaleString()}`, gradient: 'from-[#3ad3ff] to-[#9a4dff]' },
    { label: 'Active tournaments', value: stats.tournaments, gradient: 'from-[#9a4dff] to-[#ff4fbf]' },
    { label: 'Biggest win', value: `$${stats.biggest}`, gradient: 'from-[#ff4fbf] to-[#3ad3ff]' },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {items.map((i) => (
        <motion.div
          key={i.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-neon`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${i.gradient} opacity-25 blur-3xl`} />
          <div className="text-xs uppercase tracking-wide text-slate-300">{i.label}</div>
          <div className="text-2xl font-semibold text-white mt-1 drop-shadow">{i.value}</div>
        </motion.div>
      ))}
    </div>
  );
}
