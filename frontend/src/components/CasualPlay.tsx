import { useState } from 'react';
import { createCasual, joinCasual } from '../api';

export function CasualPlay({ onMatchOpen }: { onMatchOpen: (matchId: number) => void }) {
  const [code, setCode] = useState('');
  const [lastCode, setLastCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const { code, match } = await createCasual();
      setLastCode(code);
      onMatchOpen(match.id);
    } catch (err) {
      alert('Не удалось создать комнату');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    setLoading(true);
    try {
      const { match } = await joinCasual(code.trim().toUpperCase());
      onMatchOpen(match.id);
    } catch (err) {
      alert('Не удалось присоединиться');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Быстрая игра 1v1 (chess)</h3>
        {lastCode && <span className="text-xs text-emerald-300">Ваш код: {lastCode}</span>}
      </div>
      <div className="flex gap-2 flex-col md:flex-row">
        <button className="bg-emerald-400 text-black px-3 py-2 rounded-lg font-semibold" onClick={handleCreate} disabled={loading}>
          Создать комнату
        </button>
        <div className="flex gap-2 flex-1">
          <input
            className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm border border-slate-800"
            placeholder="Код комнаты"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="bg-slate-700 text-white px-3 py-2 rounded-lg" onClick={handleJoin} disabled={loading || !code.trim()}>
            Войти по коду
          </button>
        </div>
      </div>
    </div>
  );
}
