"use client";

import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { API_URL } from "../../lib/api";

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    if (!key) return;
    const res = await fetch(`${API_URL}/admin/overview`, { headers: { "x-admin-key": key } });
    const overviewData = await res.json();
    setOverview(overviewData);
    const usersRes = await fetch(`${API_URL}/admin/users`, { headers: { "x-admin-key": key } });
    const usersData = await usersRes.json();
    setUsers(usersData.users ?? []);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("admin_key");
    if (stored) setKey(stored);
  }, []);

  return (
    <div className="grid gap-6">
      <Card title="Admin Access">
        <div className="flex flex-wrap gap-2">
          <input
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            placeholder="Admin API key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <Button
            onClick={() => {
              window.localStorage.setItem("admin_key", key);
              load();
            }}
          >
            Load
          </Button>
        </div>
      </Card>
      {overview && (
        <Card title="Overview">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>Total users: {overview.totalUsers}</div>
            <div>Total games: {overview.totalGames}</div>
            <div>Total volume: {overview.totalVolume}</div>
            <div>Total fees: {overview.totalFees}</div>
          </div>
        </Card>
      )}
      <Card title="Users">
        <div className="space-y-2 text-xs text-slate-300">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <span>{user.username ?? user.telegramId}</span>
              <span>{user.isBanned ? "banned" : "active"}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
