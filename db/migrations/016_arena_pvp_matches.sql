alter table arena_matchmaking_queue add column if not exists match_id uuid;

create table if not exists arena_pvp_matches (
  id uuid primary key default gen_random_uuid(),
  player_one_id uuid not null references users(id) on delete cascade,
  player_two_id uuid not null references users(id) on delete cascade,
  player_one_name text not null,
  player_two_name text not null,
  status text not null default 'active' check(status in ('active','completed','cancelled')),
  player_one_spectators integer not null default 0,
  player_two_spectators integer not null default 0,
  winner_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(), completed_at timestamptz,
  check(player_one_id <> player_two_id)
);
create index if not exists arena_pvp_matches_players on arena_pvp_matches(player_one_id,player_two_id,created_at desc);

create table if not exists arena_pvp_rounds (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references arena_pvp_matches(id) on delete cascade,
  round_number integer not null check(round_number between 1 and 3),
  question_type text not null,
  difficulty text not null check(difficulty in ('A1','A2','B1','B2','C1','C2')),
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  accepted_answers jsonb not null,
  player_one_answer text, player_one_correct boolean, player_one_response_ms integer,
  player_two_answer text, player_two_correct boolean, player_two_response_ms integer,
  winner text check(winner in ('player_one','player_two','draw')),
  spectators_awarded integer not null default 0,
  completed_at timestamptz,
  unique(match_id,round_number)
);
