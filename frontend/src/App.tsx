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
  getRoom,
  myMatches,
  matchState,
  move
} from './api';
import { TonConnectButton, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { ChessBoard } from './chessBoard';
import { CasualPlay } from './components/CasualPlay';
import CheckersBoard from './components/CheckersBoard';
import BattleshipBoard from './components/BattleshipBoard';
import LiveTicker from './components/LiveTicker';
import HeroBlock from './components/HeroBlock';
import GlobalActivity from './components/GlobalActivity';
import InvitePanel from './components/InvitePanel';
import BigWinToast from './components/BigWinToast';
import PortalStats from './components/PortalStats';
import GameSection from './components/GameSection';

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
  const [games, setGames] = useState<any[]>([]);
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
  const [myActiveMatches, setMyActiveMatches] = useState<any[]>([]);
  const [currentMatch, setCurrentMatch] = useState<any | null>(null);
  const [currentFen, setCurrentFen] = useState<string>('');
  const [tab, setTab] = useState<'tournaments' | 'hub' | 'play' | 'admin'>('tournaments');
  const [bigWin, setBigWin] = useState<{ amount: number; user: string } | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [hubFilter, setHubFilter] = useState<'all' | 'strategy' | 'reaction' | 'skill' | 'arcade' | 'duel'>('all');
  const defaultGames = useMemo(
    () => [
      { id: 1, name: 'Blitz Chess', type: 'strategy', tags: ['featured', 'trending'], players_online: 342, prize_pool: 250, difficulty: 'Medium' },
      { id: 2, name: 'Reaction Duel', type: 'reaction', tags: ['featured'], players_online: 290, prize_pool: 120, difficulty: 'Easy' },
      { id: 3, name: 'Quick Strategy Battle', type: 'strategy', tags: ['trending'], players_online: 180, prize_pool: 180, difficulty: 'Hard' },
      { id: 4, name: 'Arcade Score Challenge', type: 'arcade', tags: ['new'], players_online: 210, prize_pool: 90, difficulty: 'Medium' },
      { id: 5, name: 'Duel Rush', type: 'duel', tags: ['trending'], players_online: 150, prize_pool: 110, difficulty: 'Medium' }
    ],
    []
  );
  const initData = useMemo(() => {
    const raw = WebApp.initData || '';
    if (raw) return raw;
    if (import.meta.env.VITE_ALLOW_INSECURE_DEV === 'true') return 'insecure-dev';
    return '';
  }, []);
  const wallet = useTonWallet();
  const tonAddress = useTonAddress();

  useEffect(() => {
    if (tonAddress) setFromAddress(tonAddress);
  }, [tonAddress]);

  // Random mega win effect every ~22s
  useEffect(() => {
    const id = setInterval(() => {
      const users = ['Alex', 'Maria', 'Kaito', 'Lena', 'Ravi', 'Zoe'];
      const user = users[Math.floor(Math.random() * users.length)];
      const amount = Math.floor(Math.random() * 180) + 20;
      setBigWin({ amount, user });
      setTimeout(() => setBigWin(null), 3600);
    }, 22000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    WebApp.ready();
    setInitData(initData);
    (async () => {
      try {
        const user = await fetchMe();
        setMe(user);
        await loadTournaments();
        await loadMyMatches();
      } catch (err) {
        console.warn('auth/me failed (possibly dev mode). Continuing with UI.', err);
      }
      try {
        const res = await fetch('/api/games');
        const data = await res.json();
        const fetched = data.games || [];
        setGames(fetched.length ? fetched : defaultGames);
      } catch (err) {
        console.warn('games fetch failed', err);
        setGames(defaultGames);
      }
    })();
  }, [initData, defaultGames]);

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
            await loadMyMatches();
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
    setTournaments(Array.isArray(list) ? list : []);
  }

  async function loadMyMatches() {
    try {
      const matches = await myMatches();
      setMyActiveMatches(matches || []);
      if (matches?.length && !currentMatch) {
        await openMatch(matches[0].id);
      }
    } catch (err) {
      console.warn('loadMyMatches failed, showing empty list', err);
      setMyActiveMatches([]);
    }
  }

  async function openMatch(id: number) {
    try {
      const data = await matchState(id);
      setCurrentMatch(data.match);
      setCurrentFen(data.fen);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMove(from: string, to: string) {
    if (!currentMatch) return;
    try {
      const res = await move(currentMatch.id, { from, to });
      setCurrentFen(res.fen);
      await loadLeaderboard(currentMatch.tournament_id);
      await loadMyMatches();
    } catch (err) {
      alert('Illegal move');
      console.error(err);
    }
  }

  async function handleCheckersMove(from: string, to: string) {
    if (!currentMatch) return;
    try {
      const res = await move(currentMatch.id, { from, to });
      await loadMyMatches();
      setCurrentMatch((m:any)=>m); // trigger rerender
    } catch (err) {
      alert('Illegal move');
      console.error(err);
    }
  }

  async function handleBattleShot(coord: string) {
    if (!currentMatch) return;
    try {
      await move(currentMatch.id, { target: coord });
      await loadMyMatches();
      setCurrentMatch((m:any)=>m);
    } catch (err) {
      alert('Illegal shot');
      console.error(err);
    }
  }

  async function quickPlay(game: string) {
    const gameType = game.toLowerCase().includes('chess') ? 'chess' : game.toLowerCase().includes('checkers') ? 'checkers' : game.toLowerCase().includes('battle') ? 'battleship' : 'chess';
    setQuickLoading(true);
    setGameError(null);
    try {
      // если уже есть активный матч этого типа — открываем его (поведение как у Gamee)
      const existing = myActiveMatches.find((m) => m.game_type === gameType && m.status !== 'completed');
      if (existing) {
        setTab('play');
        await openMatch(existing.id);
        return;
      }
      const { match } = await createCasual(gameType);
      await loadMyMatches();
      await openMatch(match.id);
      setTab('play');
    } catch (err) {
      const msg =
        // @ts-ignore
        (err?.response?.status === 401
          ? 'Auth error: Telegram initData not accepted. Open via the bot, or temporarily set ALLOW_INSECURE_DEV=true on backend & VITE_ALLOW_INSECURE_DEV=true on frontend.'
          // @ts-ignore
          : err?.response?.data?.error || 'Cannot start quick match. Please reconnect Telegram WebApp or reload.');
      setGameError(msg);
      console.error('quickPlay failed', err);
    } finally {
      setQuickLoading(false);
    }
  }

  function safeState(match: any) {
    if (!match?.state) return null;
    try {
      if (typeof match.state === 'string') return JSON.parse(match.state);
      return match.state;
    } catch {
      return null;
    }
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

  const safeTournaments = Array.isArray(tournaments) ? tournaments : [];
  const safeGames = Array.isArray(games) ? games : [];
  const profileSummary = {
    rank: me ? 'Diamond' : 'Rookie',
    earnings: me ? '$1,240' : '$0',
    matches: myActiveMatches.length || 0,
    winRate: myActiveMatches.length ? '68%' : '—',
    referrals: 0
  };

  return (
    <div className="min-h-screen p-4 space-y-4">
      <LiveTicker />
      <BigWinToast win={bigWin} />

      <header className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur px-4 py-3 flex items-center justify-between shadow-neon panel">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">GameTGID</p>
          <h1 className="text-xl font-semibold text-white">Telegram Tournaments Hub</h1>
          <p className="text-sm text-slate-400">Chess · Checkers · Arcade · Dota2 · CS</p>
        </div>
        {me && (
          <div className="text-right text-sm space-y-1">
            <div className="text-cyan-200 font-medium">@{me.username || me.telegram_id}</div>
            <div className="text-slate-400">Balance: {me.balance ?? 0}</div>
            <div className="flex justify-end"><TonConnectButton /></div>
          </div>
        )}
      </header>

        <div className="flex gap-2">
        {['tournaments', 'hub', 'play', 'admin'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-3 py-2 rounded-lg border text-sm transition ${
              tab === t
                ? 'bg-gradient-to-r from-[#9a4dff] via-[#3ad3ff] to-[#37fff2] text-black border-white/20 shadow-neon'
                : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:border-white/20'
            }`}
          >
            {t === 'play' ? 'Play' : t === 'tournaments' ? 'Tournaments' : t === 'hub' ? 'Game Hub' : 'Admin'}
          </button>
        ))}
      </div>

      {tab === 'tournaments' && (
      <section className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-neon panel">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Players online</p>
              <p className="text-3xl font-[var(--font-display)] text-white">12,480</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Winnings today</p>
              <p className="text-3xl font-[var(--font-display)] text-white">$58,200</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Active tournaments</p>
              <p className="text-3xl font-[var(--font-display)] text-white">{safeTournaments.length || 18}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Biggest win</p>
              <p className="text-3xl font-[var(--font-display)] text-white">$840</p>
            </div>
          </div>

          <HeroBlock />
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Tournaments</h2>
            <div className="flex gap-2 text-xs">
              {['TON', 'USDT', 'USDC'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setToken(sym)}
                  className={`px-3 py-1 rounded-full border transition ${
                    token === sym ? 'bg-[#3ad3ff] text-black border-white/20 shadow-neon' : 'border-white/10 text-slate-300 hover:border-white/30'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {safeTournaments.map((t) => (
              <div key={t.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 flex flex-col gap-2 shadow-purple">
                <div className="absolute inset-0 bg-gradient-to-br from-[#9a4dff]/14 via-[#3ad3ff]/12 to-[#37fff2]/14" />
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.title}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200">{t.game_type}</span>
                </div>
                <div className="text-xs text-slate-400">Entry: {t.entry_fee} {token} · Prize: {t.prize_pool} {token}</div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-white/5 text-slate-100 px-3 py-2 rounded-lg border border-white/10 hover:border-white/30"
                    onClick={() => loadLeaderboard(t.id)}
                  >
                    View
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-[#9a4dff] via-[#3ad3ff] to-[#37fff2] text-black px-3 py-2 rounded-lg font-semibold disabled:opacity-50 shadow-neon"
                    onClick={() => handleJoin(t)}
                    disabled={loading}
                  >
                    {t.entry_fee > 0 ? `Pay & Join (${token})` : 'Join'}
                  </button>
                </div>
              </div>
            ))}
            {!safeTournaments.length && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Туры недоступны в превью (нет API). В dev показывается заглушка.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-neon panel space-y-3">
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
      )}

      {tab === 'tournaments' && (
        <section className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <InvitePanel />
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-neon panel space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Profile</p>
            <p className="text-xl font-[var(--font-display)] text-white">{me?.username || 'Player'}</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
              <div className="rounded-lg bg-white/5 px-3 py-2">Rank: <span className="text-white">{profileSummary.rank}</span></div>
              <div className="rounded-lg bg-white/5 px-3 py-2">Earnings: <span className="text-white">{profileSummary.earnings}</span></div>
              <div className="rounded-lg bg-white/5 px-3 py-2">Matches: <span className="text-white">{profileSummary.matches}</span></div>
              <div className="rounded-lg bg-white/5 px-3 py-2">Win rate: <span className="text-white">{profileSummary.winRate}</span></div>
            </div>
            <div className="rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200">
              Referrals: <span className="text-white">{profileSummary.referrals}</span>
            </div>
          </div>
        </section>
      )}

      {tab === 'tournaments' && paymentInfo && (
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

      {tab === 'hub' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Game Hub</p>
              <h2 className="text-2xl font-[var(--font-display)] text-white">Instant games, tournaments, duels</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {['all', 'strategy', 'reaction', 'skill', 'arcade', 'duel'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setHubFilter(cat as any)}
                  className={`rounded-full border px-3 py-1 ${
                    hubFilter === cat ? 'border-[#3ad3ff] text-[#3ad3ff] bg-white/5' : 'border-white/10 text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(hubFilter === 'all'
              ? safeGames
              : safeGames.filter((g) => (g.type || '').includes(hubFilter))).map((g) => (
              <div key={g.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-neon">
                <div className="absolute inset-0 bg-gradient-to-br from-[#9a4dff]/12 via-[#3ad3ff]/10 to-[#ff4fbf]/10" />
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-[var(--font-display)] text-white">{g.name}</p>
                    <span className="text-[11px] rounded-full bg-white/10 px-2 py-1 text-cyan-200">{g.type || 'arcade'}</span>
                  </div>
                  <div className="text-xs text-slate-300 flex gap-3 flex-wrap">
                    {g.players_online !== undefined && <span>👥 {g.players_online} online</span>}
                    {g.difficulty && <span>⚡ {g.difficulty}</span>}
                    {g.prize_pool && <span>🏆 ${g.prize_pool}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 bg-gradient-to-r from-[#9a4dff] via-[#3ad3ff] to-[#37fff2] text-black px-3 py-2 rounded-lg font-semibold shadow-neon"
                      onClick={() => quickPlay(g.name)}
                    >
                      Play now
                    </button>
                    <button
                      className="flex-1 bg-white/5 text-slate-100 px-3 py-2 rounded-lg border border-white/10 hover:border-white/30"
                      onClick={() => setTab('tournaments')}
                    >
                      Tournaments
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'tournaments' && selected && (
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

      {tab === 'play' && (
      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-lg shadow-indigo-500/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Play hub</h3>
            <p className="text-xs text-slate-400">Выбирай игру → создавай матч → играй прямо здесь</p>
          </div>
          <button className="text-xs text-emerald-300" onClick={loadMyMatches}>Refresh</button>
        </div>

        {gameError && (
          <div className="rounded-lg border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {gameError}
          </div>
        )}

        <PortalStats stats={{ online: 12450, winnings: 58200, tournaments: safeTournaments.length || 18, biggest: 840 }} />

        <GameSection
          title="Featured"
          games={safeGames.filter((g) => g.tags?.includes('featured'))}
          loading={quickLoading}
          onPlay={(g) => quickPlay(g.name)}
        />

        <GameSection
          title="Trending"
          games={safeGames.filter((g) => g.tags?.includes('trending'))}
          loading={quickLoading}
          onPlay={(g) => quickPlay(g.name)}
        />

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200 space-y-1">
          <div className="font-semibold text-white">Как играть</div>
          <p>1) Тапни игру “Play now” — создастся матч.</p>
          <p>2) Выбери матч в “Мои матчи” ниже и делай ходы на доске.</p>
          <p>3) Белыми ходит создатель комнаты.</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {myActiveMatches.map((m) => (
            <button
              key={m.id}
              onClick={() => openMatch(m.id)}
              className={`px-3 py-2 rounded-lg border text-sm ${currentMatch?.id === m.id ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-700 bg-slate-900'}`}
            >
              #{m.id} {m.game_type} ({m.status})
            </button>
          ))}
          {!myActiveMatches.length && (
            <div className="flex flex-col gap-2 text-sm text-slate-300 bg-slate-800/70 border border-slate-700 rounded-xl p-3 max-w-md">
              <div className="text-white font-semibold">Нет матчей</div>
              <p>Нажми “Play now” над карточкой игры, чтобы создать быстрый матч.</p>
            </div>
          )}
        </div>

        {currentMatch && currentMatch.game_type === 'chess' && (
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <ChessBoard
              fen={currentFen || currentMatch.state || ''}
              myColor={currentMatch.player1 === me?.id ? 'w' : 'b'}
              turn={(currentFen || currentMatch.state || '').includes(' w ') ? 'w' : 'b'}
              onMove={handleMove}
            />
            <div className="text-sm text-slate-300 space-y-2">
              <div>Match #{currentMatch.id} · {currentMatch.status}</div>
              <div>White: {currentMatch.player1 === me?.id ? 'You' : currentMatch.player1}</div>
              <div>Black: {currentMatch.player2 === me?.id ? 'You' : currentMatch.player2}</div>
              <div>Turn: {currentFen.includes(' w ') ? 'White' : 'Black'}</div>
              <button className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700" onClick={loadMyMatches}>Sync</button>
            </div>
          </div>
        )}

        {currentMatch && currentMatch.game_type === 'checkers' && safeState(currentMatch) && (
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <CheckersBoard state={safeState(currentMatch)} onMove={handleCheckersMove} isMyTurn={(currentMatch.player1 === me?.id && safeState(currentMatch).turn === 'p1') || (currentMatch.player2 === me?.id && safeState(currentMatch).turn === 'p2')} />
            <div className="text-sm text-slate-300 space-y-2">
              <div>Match #{currentMatch.id} · {currentMatch.status}</div>
              <div>Turn: {safeState(currentMatch).turn === 'p1' ? 'White' : 'Black'}</div>
            </div>
          </div>
        )}

        {currentMatch && currentMatch.game_type === 'battleship' && safeState(currentMatch) && (
          <BattleshipBoard
            state={safeState(currentMatch)}
            me={currentMatch.player1 === me?.id ? 'p1' : 'p2'}
            isMyTurn={(currentMatch.player1 === me?.id && safeState(currentMatch).turn === 'p1') || (currentMatch.player2 === me?.id && safeState(currentMatch).turn === 'p2')}
            onShoot={handleBattleShot}
          />
        )}

        <CasualPlay onMatchOpen={(id) => openMatch(id)} />
      </section>
      )}

      {tab === 'admin' && (
      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-lg shadow-indigo-500/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Admin desk</h3>
            <p className="text-xs text-slate-500">Управление турнирами, матчами и комнатами</p>
          </div>
          <input
            className="w-48 rounded-lg bg-slate-900 px-3 py-2 text-sm border border-slate-700"
            placeholder="Admin key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm border border-slate-800"
            placeholder="Title"
            value={newTournament.title}
            onChange={(e) => setNewTournament({ ...newTournament, title: e.target.value })}
          />
          <input
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm border border-slate-800"
            placeholder="Entry fee"
            type="number"
            value={newTournament.entry_fee}
            onChange={(e) => setNewTournament({ ...newTournament, entry_fee: Number(e.target.value) })}
          />
          <input
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm border border-slate-800"
            placeholder="Prize pool"
            type="number"
            value={newTournament.prize_pool}
            onChange={(e) => setNewTournament({ ...newTournament, prize_pool: Number(e.target.value) })}
          />
          <select
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm border border-slate-800 md:col-span-2"
            value={newTournament.game_type}
            onChange={(e) => setNewTournament({ ...newTournament, game_type: e.target.value })}
          >
            <option value="arcade">Arcade</option>
            <option value="chess">Chess</option>
            <option value="checkers">Checkers</option>
            <option value="dota2">Dota2</option>
            <option value="csgo">CS:GO</option>
          </select>
          <button className="bg-indigo-400 text-black px-3 py-2 rounded-lg font-semibold" onClick={handleAdminCreate}>
            Create tournament
          </button>
        </div>

        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={`admin-${t.id}`} className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded-lg text-sm border border-slate-800">
              <span className="font-medium">{t.title}</span>
              <div className="flex gap-2">
                <button className="bg-yellow-400 text-black px-2 rounded" onClick={() => handleAdminAction('start', t.id)}>
                  Start
                </button>
                <button className="bg-red-500 text-black px-2 rounded" onClick={() => handleAdminAction('complete', t.id)}>
                  Complete
                </button>
                <button className="bg-slate-700 text-white px-2 rounded" onClick={() => loadAdminData(t.id)}>
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>

        {!!adminParticipants.length && (
          <div className="bg-slate-900 rounded-xl p-3 text-sm space-y-1 border border-slate-800">
            <div className="font-semibold">Participants ({adminParticipants.length})</div>
            {adminParticipants.map((p) => (
              <div key={p.id} className="flex justify-between border-b border-slate-800 py-1">
                <span>@{p.username || p.telegram_id}</span>
                <span className="text-slate-400">id:{p.user_id}</span>
              </div>
            ))}
          </div>
        )}
        {!!adminMatches.length && (
          <div className="bg-slate-900 rounded-xl p-3 text-sm space-y-2 border border-slate-800">
            <div className="font-semibold">Matches ({adminMatches.length})</div>
            {adminMatches.map((m) => (
              <div key={m.id} className="flex justify-between border border-slate-800 rounded-lg px-3 py-2">
                <div className="space-y-1">
                  <span className="font-medium">#{m.id} {m.game_type}</span>
                  <div className="text-slate-400">p1:{m.player1} p2:{m.player2} winner:{m.winner || '-'}</div>
                  {rooms[m.id] && (
                    <div className="text-xs text-emerald-300">Room: {rooms[m.id].code} · pass: {rooms[m.id].password}</div>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <button className="bg-slate-700 text-white px-2 rounded" onClick={() => loadAdminData(selected || m.tournament_id)}>
                    Refresh
                  </button>
                  <button className="bg-indigo-400 text-black px-2 rounded" onClick={() => handleCreateRoom(m.id)}>
                    Create room
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      {tab === 'tournaments' && (
        <div className="grid gap-3 md:grid-cols-2">
          <InvitePanel />
          <GlobalActivity />
        </div>
      )}
    </div>
  );
}

export default App;
