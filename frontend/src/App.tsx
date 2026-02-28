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
  adminMatches as fetchAdminMatches,
  createRoom,
  getRoom
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
  const [paymentInfo, setPaymentInfo] = useState<{ memo: string; wallet: string; amount: number; token?: string } | null>(null);
  const [walletUrls, setWalletUrls] = useState<{ tonTransferUrl: string; telegramWalletUrl: string } | null>(null);
  const [fromAddress, setFromAddress] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [newTournament, setNewTournament] = useState({ title: '', entry_fee: 0, prize_pool: 0, game_type: 'arcade' });
  const [adminParticipants, setAdminParticipants] = useState<any[]>([]);
  const [adminMatches, setAdminMatches] = useState<any[]>([]);
  const [token, setToken] = useState('TON');
  const [rooms, setRooms] = useState<Record<number, any>>({});
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
        const intent = await createPaymentIntent(t.id, token);
        setPaymentInfo(intent);
        const wl = await walletLink(t.id, token);
        setWalletUrls({ tonTransferUrl: wl.tonTransferUrl, telegramWalletUrl: wl.telegramWalletUrl });
        setSelected(t.id);
        if (!tonAddress) {
          alert('Подключите TON кошелёк через кнопку в шапке');
        }
        alert(`Отправьте ${intent.amount} ${token} на ${intent.wallet} с комментарием ${intent.memo}, затем подтвердите оплату.`);
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
      if ((paymentInfo.token || token) === 'TON') {
        const amountNano = BigInt(Math.ceil(paymentInfo.amount * 1e9)).toString();
        await verifyPayment({ memo: paymentInfo.memo, fromAddress, amountNano, token: 'TON' });
      } else {
        const status = await verifyPayment({ memo: paymentInfo.memo, token });
        if (status.status !== 'confirmed') {
          alert('Оплата еще не подтвердилась, попробуйте через пару секунд');
          return;
        }
      }
      await joinTournament(selected, {});
      await loadLeaderboard(selected);
      setPaymentInfo(null);
      setWalletUrls(null);
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
      const [p, m] = await Promise.all([fetchAdminParticipants(id, adminKey), fetchAdminMatches(id, adminKey)]);
      setAdminParticipants(p);
      setAdminMatches(m);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateRoom(matchId: number) {
    if (!adminKey) {
      alert('Admin key required');
      return;
    }
    try {
      const room = await createRoom(matchId, adminKey);
      setRooms((prev) => ({ ...prev, [matchId]: room }));
    } catch (err) {
      alert('Не удалось создать комнату');
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen p-4 space-y-4">
      <header className="rounded-xl border border-slate-800/60 bg-slate-900/70 backdrop-blur px-4 py-3 flex items-center justify-between shadow-lg shadow-emerald-500/5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">GameTGID</p>
          <h1 className="text-xl font-semibold">Telegram Tournaments Hub</h1>
          <p className="text-sm text-slate-400">Chess · Checkers · Arcade · Dota2 · CS</p>
        </div>
        {me && (
          <div className="text-right text-sm space-y-1">
            <div className="text-emerald-300 font-medium">@{me.username || me.telegram_id}</div>
            <div className="text-slate-400">Balance: {me.balance ?? 0}</div>
            <div className="flex justify-end"><TonConnectButton /></div>
          </div>
        )}
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Tournaments</h2>
            <div className="flex gap-2 text-xs">
              {['TON', 'USDT', 'USDC'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setToken(sym)}
                  className={`px-3 py-1 rounded-full border ${token === sym ? 'bg-emerald-400 text-black border-emerald-300' : 'border-slate-700 text-slate-300'}`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {tournaments.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.title}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200">{t.game_type}</span>
                </div>
                <div className="text-xs text-slate-400">Entry: {t.entry_fee} {token} · Prize: {t.prize_pool} {token}</div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-slate-800 text-slate-100 px-3 py-2 rounded-lg border border-slate-700"
                    onClick={() => loadLeaderboard(t.id)}
                  >
                    View
                  </button>
                  <button
                    className="flex-1 bg-emerald-400 text-black px-3 py-2 rounded-lg font-semibold disabled:opacity-50"
                    onClick={() => handleJoin(t)}
                    disabled={loading}
                  >
                    {t.entry_fee > 0 ? `Pay & Join (${token})` : 'Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-lg shadow-emerald-500/5 space-y-3">
          <h3 className="font-semibold">Quick Steps</h3>
          <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
            <li>Выбери токен (TON/USDT/USDC)</li>
            <li>Нажми Pay & Join и оплати по ссылке</li>
            <li>Подтверди оплату → попадёшь в сетку</li>
          </ol>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            WebSocket live обновления включены. События матчей и турниров прилетают автоматически.
          </div>
        </div>
      </section>

      {paymentInfo && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 shadow-lg shadow-emerald-500/10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Оплата {token}</h3>
            <span className="text-xs text-emerald-200">memo: {paymentInfo.memo}</span>
          </div>
          <p className="text-sm text-slate-200">Отправьте {paymentInfo.amount} {token} на адрес <span className="font-mono">{paymentInfo.wallet}</span> c комментарием <span className="font-mono">{paymentInfo.memo}</span>.</p>
          {walletUrls && (
            <div className="flex gap-2 text-sm">
              <a className="flex-1 text-center bg-emerald-400 text-black rounded px-3 py-2 font-semibold" href={walletUrls.tonTransferUrl}>
                ton://transfer
              </a>
              <a className="flex-1 text-center bg-sky-400 text-black rounded px-3 py-2 font-semibold" href={walletUrls.telegramWalletUrl}>
                Открыть в @wallet
              </a>
            </div>
          )}
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Ваш TON адрес"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
          />
          <button
            className="w-full bg-emerald-400 text-black px-3 py-2 rounded-lg font-semibold disabled:opacity-50"
            disabled={loading || !fromAddress}
            onClick={confirmPaymentAndJoin}
          >
            Я оплатил(а)
          </button>
        </section>
      )}

      {selected && (
        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            <span className="text-xs text-slate-400">Tournament #{selected}</span>
          </div>
          <div className="space-y-2">
            {board.map((r, idx) => (
              <div key={r.id} className="flex justify-between items-center rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-emerald-200">#{idx + 1}</span>
                  <span>{r.username || r.id}</span>
                </div>
                <span className="text-slate-300">{r.wins} wins</span>
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
                <div className="space-y-1">
                  <span>#{m.id} {m.game_type}</span>
                  <div className="text-slate-400">p1:{m.player1} p2:{m.player2} winner:{m.winner || '-'}</div>
                  {rooms[m.id] && (
                    <div className="text-xs text-emerald-300">Room code: {rooms[m.id].code} · pass: {rooms[m.id].password}</div>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <button className="bg-slate-600 text-white px-2 rounded" onClick={() => loadAdminData(selected || m.tournament_id)}>
                    Refresh
                  </button>
                  <button className="bg-indigo-500 text-black px-2 rounded" onClick={() => handleCreateRoom(m.id)}>
                    Create room
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
