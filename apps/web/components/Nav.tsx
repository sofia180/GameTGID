"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lobby", label: "Lobby" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/wallet", label: "Wallet" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/referral", label: "Referral" }
];

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-30 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-ink/70 px-4 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-neonPurple/40 via-neon/30 to-neonCyan/30 text-center text-xl font-bold leading-[44px] text-neon shadow-neon">
            G
          </div>
          <div>
            <p className="font-[var(--font-display)] text-lg text-white">GameTG</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Global Gaming Hub</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200/80">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-3 py-1 hover:bg-white/5 hover:text-white">
              {link.label}
            </Link>
          ))}
          <Link href="/admin" className="rounded-full px-3 py-1 text-slate-200/60 hover:bg-white/5 hover:text-white">
            Admin
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <span className="rounded-full bg-white/5 px-3 py-1 text-slate-200">@{user.username ?? "player"}</span>
              <button
                onClick={logout}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 hover:border-white/40"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/" className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
              Connect
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
