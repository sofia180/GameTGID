import React from 'react';

export default function BigWinToast({ win }: { win: { amount: number; user: string } | null }) {
  if (!win) return null;
  return (
    <div className="fixed inset-0 pointer-events-none flex items-start justify-center mt-6 z-40 animate-fade-in">
      <div className="relative px-6 py-4 rounded-2xl bg-gradient-to-r from-[#ff4fbf] via-[#9a4dff] to-[#3ad3ff] shadow-2xl text-black text-center border border-white/30 animate-pop">
        <div className="absolute inset-0 -z-10 blur-3xl opacity-70 bg-gradient-to-r from-[#ff4fbf] via-[#9a4dff] to-[#3ad3ff]" />
        <div className="text-[11px] font-semibold tracking-[0.3em] text-white/90">MEGA WIN</div>
        <div className="text-3xl font-extrabold text-white">${win.amount}</div>
        <div className="text-sm text-white/90">{win.user}</div>
      </div>
    </div>
  );
}
