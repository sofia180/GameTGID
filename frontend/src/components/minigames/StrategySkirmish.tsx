import { useEffect, useState } from 'react';

const actions = [
  { id: 'attack', label: 'Attack', desc: 'Бьёт Charge', color: 'from-[#ff4fbf] to-[#9a4dff]' },
  { id: 'defend', label: 'Defend', desc: 'Держит Attack', color: 'from-[#3ad3ff] to-[#37fff2]' },
  { id: 'charge', label: 'Charge', desc: 'Пробивает Defend', color: 'from-[#9a4dff] to-[#3ad3ff]' }
];

function result(p: string, ai: string) {
  if (p === ai) return 0;
  if ((p === 'attack' && ai === 'charge') || (p === 'charge' && ai === 'defend') || (p === 'defend' && ai === 'attack')) return 1;
  return -1;
}

export function StrategySkirmish({ onFinish }: { onFinish: (score: number) => void }) {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [last, setLast] = useState<string>('Сделай ход');

  const play = (move: string) => {
    const ai = actions[Math.floor(Math.random() * actions.length)].id;
    const r = result(move, ai);
    if (r > 0) {
      setScore((s) => s + 10);
      setLast(`Ты выбрал ${move}, AI ${ai}: Победа +10`);
    } else if (r < 0) {
      setScore((s) => Math.max(0, s - 5));
      setLast(`Ты ${move}, AI ${ai}: Поражение -5`);
    } else {
      setLast(`Ничья (${move} = ${ai})`);
    }
    setRound((r) => r + 1);
  };

  useEffect(() => {
    if (round > 10) onFinish(score);
  }, [round, score, onFinish]);

  return (
    <div className="space-y-3 text-center">
      <p className="text-lg font-semibold text-white">Quick Strategy Battle</p>
      <p className="text-sm text-slate-300">10 ходов: выбери действие против AI.</p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">Раунд {round}/10 · Счёт {score}</div>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => play(a.id)}
            className={`rounded-2xl bg-gradient-to-br ${a.color} px-3 py-3 text-sm font-semibold text-black shadow-neon`}
          >
            {a.label}
            <div className="text-xs text-black/80">{a.desc}</div>
          </button>
        ))}
      </div>
      <div className="text-sm text-slate-200">{last}</div>
    </div>
  );
}
