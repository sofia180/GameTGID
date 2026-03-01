import { useEffect, useState } from 'react';

const milestones = [3, 10, 50];
const rewards = ['Free entry', 'Bonus rewards', 'VIP access'];

export default function InvitePanel() {
  const [invites, setInvites] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setInvites((n) => Math.min(60, n + Math.floor(Math.random() * 2)));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const progress = Math.min(100, (invites / milestones[milestones.length - 1]) * 100);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-violet-500/10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white">Invite & Earn</h3>
        <span className="text-emerald-200 text-sm">{invites} invites</span>
      </div>
      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500 transition-all duration-700" style={{ width: progress + '%' }} />
      </div>
      <div className="space-y-2 text-sm">
        {milestones.map((m, i) => (
          <div key={m} className={`flex items-center justify-between rounded-lg px-3 py-2 ${invites >= m ? 'bg-emerald-500/10 border border-emerald-400/40 text-emerald-100' : 'bg-slate-800/60 border border-slate-700 text-slate-200'}`}>
            <span>Invite {m}</span>
            <span>{rewards[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
