import { useEffect, useState } from 'react';

export function ReactionDuel({ onFinish }: { onFinish: (score: number, best: number) => void }) {
  const [state, setState] = useState<'idle' | 'waiting' | 'go'>('idle');
  const [message, setMessage] = useState('Нажми старт');
  const [best, setBest] = useState<number | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  const startRound = () => {
    if (timerId) clearTimeout(timerId);
    setState('waiting');
    setMessage('Жди зелёного...');
    const delay = Math.random() * 1500 + 700;
    const id = setTimeout(() => {
      setState('go');
      setMessage('ЖМИ!');
      const start = performance.now();
      const listener = () => {
        const delta = performance.now() - start;
        setLast(delta);
        setBest((b) => (b === null ? delta : Math.min(b, delta)));
        setState('idle');
        setMessage('Хорошо! Стартуй ещё раз');
        window.removeEventListener('pointerdown', listener);
      };
      window.addEventListener('pointerdown', listener, { once: true });
    }, delay);
    setTimerId(id);
  };

  useEffect(() => () => timerId && clearTimeout(timerId), [timerId]);

  useEffect(() => {
    let rounds = 0;
    const interval = setInterval(() => {
      if (rounds >= 5) {
        clearInterval(interval);
        onFinish(best ?? 0, best ?? 0);
      } else {
        rounds += 1;
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [best, onFinish]);

  return (
    <div className="space-y-3 text-center">
      <p className="text-lg font-semibold text-white">Reaction Duel</p>
      <p className="text-sm text-slate-300">Тапни как только увидишь зелёный сигнал.</p>
      <div className={`rounded-2xl border p-6 text-2xl font-bold ${state === 'go' ? 'border-[#3ad3ff] text-[#3ad3ff]' : 'border-white/20 text-white'}`}>
        {message}
      </div>
      <button
        className="mx-auto rounded-xl bg-gradient-to-r from-[#9a4dff] via-[#3ad3ff] to-[#37fff2] px-4 py-2 text-black font-semibold shadow-neon"
        onClick={startRound}
      >
        Старт
      </button>
      <div className="text-sm text-slate-200 flex justify-center gap-4">
        <span>Последняя: {last ? `${last.toFixed(0)} ms` : '—'}</span>
        <span>Лучшая: {best ? `${best.toFixed(0)} ms` : '—'}</span>
      </div>
    </div>
  );
}
