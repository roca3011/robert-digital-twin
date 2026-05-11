import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function supabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

type LogRow = { query: string; chunks_found: number; created_at: string };

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = supabase();
  const since14 = new Date(Date.now() - 14 * 86400_000).toISOString();
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [countRes, windowRes, recentRes] = await Promise.all([
    db.from('query_log').select('id', { count: 'exact', head: true }),
    db.from('query_log').select('query, chunks_found, created_at').gte('created_at', since30).order('created_at', { ascending: false }).limit(1000),
    db.from('query_log').select('query, chunks_found, created_at').order('created_at', { ascending: false }).limit(30),
  ]);

  const rows = (windowRes.data ?? []) as LogRow[];

  // Volumen por día (últimos 14 días)
  const dailyMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    dailyMap[d] = 0;
  }
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    if (day in dailyMap) dailyMap[day]++;
  }
  const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

  // Top preguntas (30 días)
  const freq: Record<string, number> = {};
  for (const r of rows) {
    const q = r.query?.trim() ?? '';
    if (q) freq[q] = (freq[q] ?? 0) + 1;
  }
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([query, count]) => ({ query, count }));

  // Hoy
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = daily.find((d) => d.date === today)?.count ?? 0;

  // Sin respuesta (chunks_found = 0)
  const noContext = rows.filter((r) => r.chunks_found === 0).length;

  return NextResponse.json({
    total: countRes.count ?? 0,
    today: todayCount,
    noContext,
    daily,
    top,
    recent: (recentRes.data ?? []) as LogRow[],
  });
}
