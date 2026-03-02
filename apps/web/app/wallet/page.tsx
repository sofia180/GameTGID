"use client";

import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useAuth } from "../../lib/auth";
import { formatToken } from "../../lib/format";

const networks = ["USDT", "ETH", "POLYGON"] as const;

export default function WalletPage() {
  const { authFetch } = useAuth();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState<typeof networks[number]>("USDT");
  const [address, setAddress] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");

  const refresh = () =>
    authFetch<{ balance: number }>("/wallet")
      .then((data) => setBalance(Number(data.balance)))
      .catch(() => undefined);

  useEffect(() => {
    refresh();
  }, [authFetch]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card title="Balance">
        <p className="text-3xl font-semibold text-neon">{formatToken(balance)} USDT</p>
        <p className="mt-2 text-sm text-slate-400">Locked balances are removed instantly when matches start.</p>
      </Card>
      <Card title="Deposit">
        <div className="space-y-3">
          <label className="text-xs text-slate-400">Network</label>
          <select
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={network}
            onChange={(e) => setNetwork(e.target.value as typeof networks[number])}
          >
            {networks.map((net) => (
              <option key={net} value={net}>
                {net}
              </option>
            ))}
          </select>
          <Button
            onClick={async () => {
              const res = await authFetch<{ address: string }>("/wallet/deposit-address", {
                method: "POST",
                body: JSON.stringify({ network })
              });
              setAddress(res.address);
            }}
          >
            Generate Deposit Address
          </Button>
          {address && <p className="break-all text-xs text-slate-300">{address}</p>}
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              onClick={async () => {
                if (!amount) return;
                await authFetch("/wallet/deposit", {
                  method: "POST",
                  body: JSON.stringify({ amount: Number(amount), network })
                });
                setAmount("");
                refresh();
              }}
            >
              Simulate Deposit
            </Button>
          </div>
        </div>
      </Card>
      <Card title="Withdraw">
        <div className="space-y-3">
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            placeholder="Withdraw address"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              variant="ghost"
              onClick={async () => {
                if (!amount || !withdrawAddress) return;
                await authFetch("/wallet/withdraw", {
                  method: "POST",
                  body: JSON.stringify({ amount: Number(amount), network, address: withdrawAddress })
                });
                setAmount("");
                refresh();
              }}
            >
              Request
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
