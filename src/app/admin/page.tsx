'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type DailyRow = { date: string; count: number };
type TopRow = { query: string; count: number };
type RecentRow = { query: string; chunks_found: number; created_at: string };

type Stats = {
  total: number;
  today: number;
  noContext: number;
  daily: DailyRow[];
  top: TopRow[];
  recent: RecentRow[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.status === 401) { router.push('/admin/login'); return null; }
        return r.json();
      })
      .then((d) => d && setStats(d))
      .catch(() => setError('Error cargando datos'));
  }, [router]);

  if (error) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-red-400 text-sm">{error}</div>;
  if (!stats) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/30 text-sm font-mono">Cargando…</div>;

  const maxDaily = Math.max(...stats.daily.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8 max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-mono font-bold text-base">Admin · Digital Twin</h1>
        <span className="text-xs text-white/30 font-mono">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total consultas', value: stats.total },
          { label: 'Hoy', value: stats.today },
          { label: 'Sin contexto', value: stats.noContext },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 border border-white/8 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs text-white/40">{label}</p>
            <p className="text-2xl font-mono font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico diario */}
      <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-3">
        <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Últimos 14 días</p>
        <div className="flex items-end gap-1 h-24">
          {stats.daily.map(({ date, count }) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full bg-blue-600/70 hover:bg-blue-500 rounded-sm transition-colors"
                style={{ height: `${(count / maxDaily) * 100}%`, minHeight: count > 0 ? '3px' : '0' }}
                title={`${date}: ${count}`}
              />
              <span className="text-[9px] text-white/20 group-hover:text-white/50 transition-colors rotate-45 origin-left hidden sm:block">
                {date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top preguntas */}
      <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-3">
        <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Top preguntas — últimos 30 días</p>
        {stats.top.length === 0 ? (
          <p className="text-sm text-white/30">Sin datos aún</p>
        ) : (
          <div className="space-y-2">
            {stats.top.map(({ query, count }, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-white/20 font-mono text-xs w-4 flex-shrink-0 pt-0.5">{i + 1}</span>
                <span className="flex-1 text-white/80 leading-snug">{query}</span>
                <span className="flex-shrink-0 text-blue-400 font-mono text-xs">{count}×</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consultas recientes */}
      <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-3">
        <p className="text-xs text-white/40 font-mono uppercase tracking-wider">Últimas 30 consultas</p>
        <div className="space-y-2">
          {stats.recent.map((r, i) => (
            <div key={i} className="flex items-start gap-3 text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <p className="text-white/80 leading-snug truncate">{r.query}</p>
                <p className="text-xs text-white/25 mt-0.5">
                  {new Date(r.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {r.chunks_found === 0
                    ? <span className="text-yellow-500/70">sin contexto</span>
                    : <span>{r.chunks_found} chunks</span>
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
