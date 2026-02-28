import { useEffect, useMemo, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { fetchMe, fetchTournaments, joinTournament, leaderboard, setInitData } from './api';

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
  const initData = useMemo(() => WebApp.initData || '', []);

  useEffect(() => {
    WebApp.ready();
    setInitData(initData);
    (async () => {
      try {
        const user = await fetchMe();
        setMe(user);
        const list = await fetchTournaments();
        setTournaments(list);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [initData]);

  async function handleJoin(id: number) {
    setLoading(true);
    try {
      // In production you should request wallet connect and payment; here we just call join
      await joinTournament(id, {});
      const lb = await leaderboard(id);
      setBoard(lb);
      setSelected(id);
    } catch (err) {
      console.error(err);
      alert('Join failed');
    } finally {
      setLoading(false);
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
          <div className="text-right text-sm">
            <div>@{me.username || me.telegram_id}</div>
            <div className="text-slate-400">Balance: {me.balance ?? 0}</div>
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
                <div className="text-xs text-slate-400">Entry: {t.entry_fee} TON · Prize: {t.prize_pool} TON · {t.status}</div>
              </div>
              <button
                className="bg-emerald-500 text-black px-3 py-1 rounded-md disabled:opacity-50"
                onClick={() => handleJoin(t.id)}
                disabled={loading}
              >
                Join
              </button>
            </div>
          ))}
        </div>
      </section>

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
    </div>
  );
}

export default App;
