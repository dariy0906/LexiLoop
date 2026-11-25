create table if not exists game_unlock_grants (
  user_id uuid primary key references users(id) on delete cascade,
  wordly boolean not null default false,
  arena boolean not null default false,
  granted_at timestamptz not null default now()
);
