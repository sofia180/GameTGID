import { useEffect, useState } from 'react';

export function LocalGameShell({
  title,
  durationSec,
  onClose,
  onFinish,
  children
}: {
  title: string;
  durationSec: number;
  onClose: () => void;
  onFinish: (score: number) => void;
  children: React.ReactNode;
}) {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((t) => {
        if (t <= 1) {
          clearInterval(id);
          onFinish(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [durationSec, onFinish]);

  const pct = Math.max(0, Math.min(100, (remaining / durationSec) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-2xl px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[#9a4dff]/20 via-[#3ad3ff]/18 to-[#ff4fbf]/18 animate-gradient-slow" />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-neon">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Local Match</p>
            <h2 className="text-2xl font-[var(--font-display)] text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 hover:border-white/40"
          >
            Exit
          </button>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#9a4dff] via-[#3ad3ff] to-[#37fff2]"
            style={{ width: `${pct}%`, transition: 'width 0.9s linear' }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-300">Time left: {remaining}s</div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-100">{children}</div>
      </div>
    </div>
  );
}
