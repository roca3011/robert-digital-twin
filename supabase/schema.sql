-- Extensión vectorial
create extension if not exists vector;

-- Chunks de conocimiento
create table if not exists knowledge_chunks (
  id          bigserial primary key,
  content     text        not null,
  source_file text        not null,
  embedding   vector(1536),
  metadata    jsonb       default '{}'
);

-- Índice HNSW: O(log n), no requiere entrenamiento previo
create index if not exists knowledge_chunks_embedding_idx
  on knowledge_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Función de búsqueda semántica
create or replace function match_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.65,
  match_count     int   default 4
)
returns table (id bigint, content text, source_file text, similarity float)
language sql stable as $$
  select id, content, source_file,
         1 - (embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Rate limiting sin Redis (reset diario por cron de Supabase)
create table if not exists rate_limits (
  key        text primary key,
  count      int  default 1,
  updated_at timestamptz default now()
);

-- Incremento atómico de rate limit (insert-or-increment en una sola operación)
create or replace function increment_rate_limit(p_key text)
returns int language plpgsql as $$
declare
  new_count int;
begin
  insert into rate_limits (key, count, updated_at)
  values (p_key, 1, now())
  on conflict (key) do update
    set count      = rate_limits.count + 1,
        updated_at = now()
  returning count into new_count;
  return new_count;
end;
$$;

-- Log de queries (tu "analytics" gratuito en Supabase Studio)
create table if not exists query_log (
  id           bigserial primary key,
  ip_hash      text,
  query        text,
  chunks_found int,
  created_at   timestamptz default now()
);
