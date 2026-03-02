"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useAuth } from "../../lib/auth";

type Entry = { userId: string; username?: string; wins: number; amount: number; matches: number };

const tabs = [
  { id: "winners", label: "Top Winners" },
  { id: "volume", label: "Biggest Earnings" },
  { id: "matches", label: "Most Matches" },
  { id: "rising", label: "Rising Stars" }
] as const;

export default function LeaderboardPage() {
  const { authFetch } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("winners");

  useEffect(() => {
    authFetch<{ leaderboard: Entry[] }>("/leaderboard")
      .then((data) => setEntries(data.leaderboard))
      .catch(() => undefined);
  }, [authFetch]);

  const sorted = useMemo(() => {
    if (active === "volume") return [...entries].sort((a, b) => b.amount - a.amount);
    if (active === "matches") return [...entries].sort((a, b) => b.matches - a.matches);
    return entries;
  }, [entries, active]);

  const gradientByRank = (idx: number) => {
    if (idx === 0) return "from-neon to-neonPurple";
    if (idx === 1) return "from-neonPurple to-neonCyan";
    if (idx === 2) return "from-neonCyan to-neonPink";
    return "from-white/10 to-white/5";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-neon">Global Leaderboard</p>
          <h1 className="text-3xl font-[var(--font-display)] text-white">Who&apos;s dominating right now</h1>
        </div>
        <Button variant="ghost">Refresh</Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-300">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-full border px-3 py-1 transition ${
              active === tab.id ? "border-neon text-neon bg-white/5" : "border-white/10 hover:border-white/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="space-y-2">
          {sorted.map((entry, idx) => (
            <div
              key={entry.userId}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div
                className={`absolute inset-0 opacity-60 blur-2xl bg-gradient-to-r ${gradientByRank(idx)}`}
              />
              <div className="relative z-10 flex items-center justify-between text-sm text-white">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-semibold ${
                      idx < 3 ? "text-neon" : "text-slate-200"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold">@{entry.username ?? "player"}</p>
                    <p className="text-xs text-slate-300">{entry.matches} matches</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-neon">{entry.wins} wins</p>
                  <p className="text-xs text-slate-300">${entry.amount ?? 0} earned</p>
                </div>
              </div>
            </div>
          ))}
          {sorted.length === 0 && <p className="text-center text-sm text-slate-400">No entries yet.</p>}
        </div>
      </Card>
    </div>
  );
}
