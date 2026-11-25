create table if not exists arena_matchmaking_queue (
  user_id uuid primary key references users(id) on delete cascade,
  status text not null default 'waiting' check(status in ('waiting','matched')),
  opponent_user_id uuid references users(id) on delete set null,
  joined_at timestamptz not null default now(),
  matched_at timestamptz
);
create index if not exists arena_matchmaking_waiting on arena_matchmaking_queue(status,joined_at) where status='waiting';
