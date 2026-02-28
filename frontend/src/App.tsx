import { useEffect, useMemo, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import {
  fetchMe,
  fetchTournaments,
  joinTournament,
  leaderboard,
  setInitData,
  createPaymentIntent,
  verifyPayment,
  fetchSocketToken,
  adminCreateTournament,
  adminStartTournament,
  adminCompleteTournament,
  walletLink,
  adminParticipants as fetchAdminParticipants,
  adminMatches as fetchAdminMatches
} from './api';
import { TonConnectButton, useTonAddress, useTonWallet } from '@tonconnect/ui-react';

interface Tournament {
  id: number;
  title: string;
  entry_fee: number;
  prize_pool: number;
  status: string;
}

function App() {
  const [me, setMe] = useState<any>();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{ memo: string; wallet: string; amount: number } | null>(null);
  const [walletUrls, setWalletUrls] = useState<{ tonTransferUrl: string; telegramWalletUrl: string } | null>(null);
  const [fromAddress, setFromAddress] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [newTournament, setNewTournament] = useState({ title: '', entry_fee: 0, prize_pool: 0, game_type: 'arcade' });
  const [adminParticipants, setAdminParticipants] = useState<any[]>([]);
  const [adminMatches, setAdminMatches] = useState<any[]>([]);
  const initData = useMemo(() => WebApp.initData || '', []);
  const wallet = useTonWallet();
  const tonAddress = useTonAddress();

  useEffect(() => {
    if (tonAddress) setFromAddress(tonAddress);
  }, [tonAddress]);

  useEffect(() => {
    WebApp.ready();
    setInitData(initData);
    (async () => {
      try {
        const user = await fetchMe();
        setMe(user);
        await loadTournaments();
      } catch (err) {
        console.error(err);
      }
    })();
  }, [initData]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    (async () => {
      try {
        const token = await fetchSocketToken();
        ws = new WebSocket(`${import.meta.env.VITE_WS_URL}?token=${token}`);
        ws.onmessage = async (ev) => {
          const msg = JSON.parse(ev.data);
          if (msg.type?.startsWith('match') || msg.type === 'tournament_updated') {
            await loadTournaments();
            if (selected) await loadLeaderboard(selected);
          }
        };
      } catch (err) {
        console.error('ws error', err);
      }
    })();
    return () => ws?.close();
  }, [selected]);

  async function loadTournaments() {
    const list = await fetchTournaments();
    setTournaments(list);
  }

  async function loadLeaderboard(id: number) {
    const lb = await leaderboard(id);
    setBoard(lb);
    setSelected(id);
  }

  async function handleJoin(t: Tournament) {
    setLoading(true);
    try {
      if (t.entry_fee > 0) {
        const intent = await createPaymentIntent(t.id);
        setPaymentInfo(intent);
        const wl = await walletLink(t.id);
        setWalletUrls({ tonTransferUrl: wl.tonTransferUrl, telegramWalletUrl: wl.telegramWalletUrl });
        setSelected(t.id);
        if (!tonAddress) {
          alert('Подключите TON кошелёк через кнопку в шапке');
        }
        alert(`Отправьте ${intent.amount} TON на ${intent.wallet} с комментарием ${intent.memo}, затем подтвердите оплату.`);
      } else {
        await joinTournament(t.id, {});
        await loadLeaderboard(t.id);
      }
    } catch (err) {
      console.error(err);
      alert('Join failed');
    } finally {
      setLoading(false);
    }
  }

  async function confirmPaymentAndJoin() {
    if (!selected || !paymentInfo) return;
    setLoading(true);
    try {
      const amountNano = BigInt(Math.ceil(paymentInfo.amount * 1e9)).toString();
      await verifyPayment({ memo: paymentInfo.memo, fromAddress, amountNano });
      await joinTournament(selected, {});
      await loadLeaderboard(selected);
      setPaymentInfo(null);
      setFromAddress('');
    } catch (err) {
      console.error(err);
      alert('Не удалось подтвердить оплату');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminCreate() {
    try {
      const t = await adminCreateTournament(
        { ...newTournament, entry_fee: Number(newTournament.entry_fee), prize_pool: Number(newTournament.prize_pool) },
        adminKey
      );
      setNewTournament({ title: '', entry_fee: 0, prize_pool: 0 });
      await loadTournaments();
      alert(`Создан турнир ${t.title}`);
    } catch (err) {
      alert('Admin create failed');
      console.error(err);
    }
  }

  async function handleAdminAction(action: 'start' | 'complete', id: number) {
    try {
      if (action === 'start') await adminStartTournament(id, adminKey);
      if (action === 'complete') await adminCompleteTournament(id, adminKey);
      await loadTournaments();
      alert(`Tournament ${action}ed`);
    } catch (err) {
      alert(`Admin ${action} failed`);
    }
  }

  async function loadAdminData(id: number) {
    if (!adminKey) return;
    try {
      const [p, m] = await Promise.all([adminParticipants(id, adminKey), adminMatches(id, adminKey)]);
      setAdminParticipants(p);
      setAdminMatches(m);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Telegram Tournament</p>
          <h1 className="text-xl font-semibold">Quick Matches</h1>
        </div>
        {me && (
          <div className="text-right text-sm space-y-1">
            <div>@{me.username || me.telegram_id}</div>
            <div className="text-slate-400">Balance: {me.balance ?? 0}</div>
            <div className="flex justify-end"><TonConnectButton /></div>
          </div>
        )}
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-2">Tournaments</h2>
        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="rounded-lg bg-slate-800 p-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-slate-400">Game: {t.game_type} · Entry: {t.entry_fee} TON · Prize: {t.prize_pool} TON · {t.status}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 text-black px-3 py-1 rounded-md disabled:opacity-50"
                  onClick={() => loadLeaderboard(t.id)}
                >
                  View
                </button>
                <button
                  className="bg-emerald-500 text-black px-3 py-1 rounded-md disabled:opacity-50"
                  onClick={() => handleJoin(t)}
                  disabled={loading}
                >
                  {t.entry_fee > 0 ? 'Pay & Join' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {paymentInfo && (
        <section className="rounded-lg bg-slate-800 p-3 space-y-2">
          <h3 className="font-semibold">Оплата TON</h3>
          <p className="text-sm text-slate-300">Отправьте {paymentInfo.amount} TON на адрес <span className="font-mono">{paymentInfo.wallet}</span> с комментарием <span className="font-mono">{paymentInfo.memo}</span>.</p>
          {walletUrls && (
            <div className="flex gap-2">
              <a className="flex-1 text-center bg-emerald-400 text-black rounded px-3 py-2 text-sm font-semibold" href={walletUrls.tonTransferUrl}>
                ton://transfer
              </a>
              <a className="flex-1 text-center bg-sky-400 text-black rounded px-3 py-2 text-sm font-semibold" href={walletUrls.telegramWalletUrl}>
                Открыть @wallet
              </a>
            </div>
          )}
          <input
            className="w-full rounded bg-slate-900 px-3 py-2 text-sm"
            placeholder="Ваш TON адрес"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
          />
          <button
            className="w-full bg-emerald-500 text-black px-3 py-2 rounded-md disabled:opacity-50"
            disabled={loading || !fromAddress}
            onClick={confirmPaymentAndJoin}
          >
            Я оплатил(а)
          </button>
        </section>
      )}

      {selected && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Leaderboard</h2>
          <div className="space-y-1">
            {board.map((r, idx) => (
              <div key={r.id} className="flex justify-between bg-slate-800 p-2 rounded">
                <span>#{idx + 1} {r.username || r.id}</span>
                <span>{r.wins} wins</span>
              </div>
            ))}
            {!board.length && <div className="text-slate-500 text-sm">No results yet</div>}
          </div>
        </section>
      )}

      <section className="rounded-lg bg-slate-900 p-3 space-y-3">
        <h3 className="font-semibold">Admin</h3>
        <input
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm"
          placeholder="Admin key"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-2">
          <input
            className="rounded bg-slate-800 px-3 py-2 text-sm"
            placeholder="Title"
            value={newTournament.title}
            onChange={(e) => setNewTournament({ ...newTournament, title: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm"
              placeholder="Entry fee TON"
              type="number"
              value={newTournament.entry_fee}
              onChange={(e) => setNewTournament({ ...newTournament, entry_fee: Number(e.target.value) })}
            />
            <input
              className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm"
              placeholder="Prize pool TON"
              type="number"
              value={newTournament.prize_pool}
              onChange={(e) => setNewTournament({ ...newTournament, prize_pool: Number(e.target.value) })}
            />
          </div>
          <select
            className="rounded bg-slate-800 px-3 py-2 text-sm"
            value={newTournament.game_type}
            onChange={(e) => setNewTournament({ ...newTournament, game_type: e.target.value })}
          >
            <option value="arcade">Arcade</option>
            <option value="chess">Chess</option>
            <option value="checkers">Checkers</option>
          </select>
          <button className="bg-indigo-500 text-black px-3 py-2 rounded" onClick={handleAdminCreate}>
            Create tournament
          </button>
        </div>

        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={`admin-${t.id}`} className="flex justify-between bg-slate-800 px-3 py-2 rounded text-sm">
              <span>{t.title}</span>
              <div className="flex gap-2">
                <button className="bg-yellow-500 text-black px-2 rounded" onClick={() => handleAdminAction('start', t.id)}>
                  Start
                </button>
                <button className="bg-red-500 text-black px-2 rounded" onClick={() => handleAdminAction('complete', t.id)}>
                  Complete
                </button>
                <button className="bg-slate-600 text-white px-2 rounded" onClick={() => loadAdminData(t.id)}>
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>

        {!!adminParticipants.length && (
          <div className="bg-slate-800 rounded p-3 text-sm space-y-1">
            <div className="font-semibold">Participants ({adminParticipants.length})</div>
            {adminParticipants.map((p) => (
              <div key={p.id} className="flex justify-between border-b border-slate-700 py-1">
                <span>@{p.username || p.telegram_id}</span>
                <span className="text-slate-400">id:{p.user_id}</span>
              </div>
            ))}
          </div>
        )}
        {!!adminMatches.length && (
          <div className="bg-slate-800 rounded p-3 text-sm space-y-1">
            <div className="font-semibold">Matches ({adminMatches.length})</div>
            {adminMatches.map((m) => (
              <div key={m.id} className="flex justify-between border-b border-slate-700 py-1">
                <span>#{m.id} {m.game_type}</span>
                <span className="text-slate-400">p1:{m.player1} p2:{m.player2} winner:{m.winner || '-'}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
