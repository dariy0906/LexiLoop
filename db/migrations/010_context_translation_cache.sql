create table if not exists cartoon_translation_cache (
  cache_key text primary key,
  result jsonb not null,
  created_at timestamptz not null default now()
);
