import React from 'react';

export default function BigWinToast({ win }: { win: { amount: number; user: string } | null }) {
  if (!win) return null;
  return (
    <div className="fixed inset-0 pointer-events-none flex items-start justify-center mt-6 z-40 animate-fade-in">
      <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 shadow-amber-500/50 shadow-2xl text-black text-center border border-amber-200 animate-pop">
        <div className="text-xs font-semibold tracking-[0.3em]">MEGA WIN</div>
        <div className="text-3xl font-extrabold">${win.amount}</div>
        <div className="text-sm">{win.user}</div>
      </div>
    </div>
  );
}
