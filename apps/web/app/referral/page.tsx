"use client";

import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useAuth } from "../../lib/auth";

export default function ReferralPage() {
  const { authFetch } = useAuth();
  const [code, setCode] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [invited, setInvited] = useState<number>(0);
  const milestones = [
    { count: 3, reward: "Free tournament entry" },
    { count: 10, reward: "Bonus rewards" },
    { count: 25, reward: "Premium tournaments" },
    { count: 50, reward: "Special badge" },
    { count: 100, reward: "Revenue share level" }
  ];

  useEffect(() => {
    authFetch<{ referralCode: string; totalInvited: number; totalRewards: number }>("/referrals")
      .then((data) => {
        setCode(data.referralCode);
        setTotal(data.totalRewards);
        setInvited(data.totalInvited);
      })
      .catch(() => undefined);
  }, [authFetch]);

  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT || "";
  const link = bot ? `https://t.me/${bot}?start=${code}` : code;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-neon">Invite & Earn</p>
        <h1 className="text-3xl font-[var(--font-display)] text-white">Turn your squad into rewards</h1>
      </div>
      <Card>
        <div className="space-y-4 text-sm text-slate-300">
          <div className="flex flex-wrap items-center gap-3 text-base text-white">
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-neon">Your code</span>
            <span className="text-2xl font-semibold text-neon">{code}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-white/5 px-3 py-1">Invited: {invited}</span>
            <span className="rounded-full bg-white/5 px-3 py-1">Total rewards: ${total}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs" value={link} readOnly />
            <Button onClick={() => navigator.clipboard.writeText(link)}>Copy Invite Link</Button>
          </div>
        </div>
      </Card>

      <Card title="Milestones">
        <div className="grid gap-3 md:grid-cols-2">
          {milestones.map((step) => {
            const progress = Math.min(1, invited / step.count);
            return (
              <div key={step.count} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-sm text-white">
                  <span>Invite {step.count}</span>
                  <span className="text-neon">{step.reward}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neonPurple via-neon to-neonCyan"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">{Math.round(progress * 100)}% complete</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="How it works">
        <ol className="space-y-2 text-sm text-slate-300">
          <li>1) Share your deep link in chats and channels.</li>
          <li>2) Friends join tournaments and PvP; you earn fee share.</li>
          <li>3) Unlock higher tiers to access premium cups and revenue share.</li>
        </ol>
      </Card>
    </div>
  );
}
