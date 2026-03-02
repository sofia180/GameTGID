export default function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-panel/70 p-5 shadow-glow backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-neonPurple/5 to-neonCyan/5 opacity-50" />
      <div className="absolute -inset-10 opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, rgba(58,211,255,0.18), transparent 55%)" }} />
      <div className="relative z-10">
        {title && <p className="mb-3 font-[var(--font-display)] text-lg text-white">{title}</p>}
        {children}
      </div>
    </div>
  );
}
