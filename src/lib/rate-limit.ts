import { createClient } from '@supabase/supabase-js';

export async function checkRateLimit(ip: string): Promise<boolean> {
  // Cliente creado dentro de la función — evita errores en build time con env vars vacías
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `${ip}:${today}`;
  const max = parseInt(process.env.MAX_QUERIES_PER_IP_DAY ?? '20', 10);

  const { data, error } = await supabase.rpc('increment_rate_limit', { p_key: key });

  if (error) {
    // Fail open — no bloquear por error de infraestructura
    console.error('Rate limit error:', error.message);
    return true;
  }

  return (data as number) <= max;
}
