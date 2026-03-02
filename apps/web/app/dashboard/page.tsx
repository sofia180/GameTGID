"use client";

import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Stat from "../../components/Stat";
import Button from "../../components/Button";
import { useAuth } from "../../lib/auth";
import { formatToken } from "../../lib/format";

export default function DashboardPage() {
  const { authFetch, user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    authFetch<{ balance: number }>("/wallet")
      .then((data) => setBalance(Number(data.balance)))
      .catch(() => undefined);
    authFetch<{ rooms: any[] }>("/rooms")
      .then((data) => setRooms(data.rooms))
      .catch(() => undefined);
  }, [authFetch]);

  return (
    <div className="grid gap-6">
      <Card title={`Welcome ${user?.username ?? "Player"}`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Balance" value={`${formatToken(balance)} USDT`} />
          <Stat label="Active Rooms" value={rooms.length} />
          <Stat label="Win Streak" value="0" />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card title="Quick Actions">
          <div className="flex flex-wrap gap-3">
            <Button>Start Match</Button>
            <Button variant="ghost">Invite Friends</Button>
            <Button variant="ghost">Join Tournament</Button>
          </div>
        </Card>
        <Card title="Active Rooms">
          <ul className="space-y-2 text-sm text-slate-300">
            {rooms.slice(0, 5).map((room) => (
              <li key={room.id} className="flex items-center justify-between">
                <span className="font-semibold capitalize text-white">{room.gameType}</span>
                <span className="text-neon">{formatToken(Number(room.stake))} USDT</span>
              </li>
            ))}
            {rooms.length === 0 && <li className="text-slate-500">No active rooms yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
