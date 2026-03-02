export default function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neon/10 via-neonPurple/5 to-neonPink/5 opacity-70" />
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white drop-shadow">{value}</p>
    </div>
  );
}
