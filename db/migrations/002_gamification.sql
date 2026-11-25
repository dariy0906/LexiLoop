alter table users add column if not exists timezone text not null default 'UTC';

create table if not exists user_gamification (
  user_id uuid primary key references users(id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_lesson_date date,
  updated_at timestamptz not null default now()
);
create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  event_type text not null, source_id text not null, amount integer not null check (amount >= 0),
  created_at timestamptz not null default now(), unique(user_id,event_type,source_id)
);
create index if not exists xp_events_user_time on xp_events(user_id,created_at desc);
create table if not exists lesson_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  local_date date not null, timezone text not null, status text not null default 'active' check(status in ('active','completed','cancelled')),
  question_count integer not null check(question_count between 5 and 10), correct_count integer not null default 0,
  xp_awarded integer not null default 0, started_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists lesson_questions (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references lesson_sessions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade, position integer not null, word_id uuid not null,
  question_type text not null check(question_type in ('translation','definition','sentence_completion','reverse_translation','recall','context')),
  difficulty text not null check(difficulty in ('A1','A2','B1','B2','C1','C2')), prompt text not null,
  options jsonb not null default '[]'::jsonb, accepted_answers jsonb not null, submitted_answer text,
  correct boolean, response_ms integer, answered_at timestamptz, unique(session_id,position),
  foreign key(user_id,word_id) references vocabulary_words(user_id,id) on delete cascade
);
create table if not exists daily_wordly_assignments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  local_date date not null, timezone text not null, word_id uuid not null, attempts integer not null default 0 check(attempts between 0 and 6),
  completed boolean not null default false, failed boolean not null default false, xp_awarded integer not null default 0,
  prepared_at timestamptz not null default now(), completed_at timestamptz, created_at timestamptz not null default now(),
  unique(user_id,local_date), foreign key(user_id,word_id) references vocabulary_words(user_id,id) on delete cascade
);
create index if not exists wordly_recent_words on daily_wordly_assignments(user_id,prepared_at desc);
create table if not exists meaningful_answers (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  source_type text not null check(source_type in ('lesson','arena','quiz')), source_id text not null,
  question_type text not null, difficulty text not null check(difficulty in ('A1','A2','B1','B2','C1','C2')),
  correct boolean not null, response_ms integer not null check(response_ms >= 0), created_at timestamptz not null default now(),
  unique(user_id,source_type,source_id)
);
create index if not exists meaningful_answers_recent on meaningful_answers(user_id,created_at desc);
create table if not exists player_skill_profile (
  user_id uuid primary key references users(id) on delete cascade, skill_rating integer not null default 500 check(skill_rating between 0 and 1000),
  avg_response_ms integer not null default 4500, sample_size integer not null default 0, updated_at timestamptz not null default now()
);
create table if not exists player_skill_dimensions (
  user_id uuid not null references users(id) on delete cascade, dimension text not null,
  rating integer not null default 500 check(rating between 0 and 1000), sample_size integer not null default 0,
  updated_at timestamptz not null default now(), primary key(user_id,dimension)
);
create table if not exists skill_history (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  rating integer not null check(rating between 0 and 1000), recorded_at timestamptz not null default now()
);
create table if not exists arena_matches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  opponent_type text not null default 'bot' check(opponent_type in ('bot','human')), opponent_name text not null,
  player_skill_snapshot jsonb not null, opponent_skill_snapshot jsonb not null,
  player_spectators integer not null default 0, opponent_spectators integer not null default 0,
  winner text check(winner in ('player','opponent','draw')), status text not null default 'active' check(status in ('active','completed','cancelled')),
  xp_awarded integer not null default 0, created_at timestamptz not null default now(), completed_at timestamptz
);
create index if not exists arena_matches_user_time on arena_matches(user_id,created_at desc);
create table if not exists arena_rounds (
  id uuid primary key default gen_random_uuid(), match_id uuid not null references arena_matches(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade, round_number integer not null check(round_number between 1 and 3),
  word_id uuid not null, question_type text not null, difficulty text not null check(difficulty in ('A1','A2','B1','B2','C1','C2')),
  prompt text not null, options jsonb not null default '[]'::jsonb, accepted_answers jsonb not null,
  player_answer text, bot_answer text, player_correct boolean, bot_correct boolean not null,
  player_response_ms integer, bot_response_ms integer not null check(bot_response_ms between 1500 and 8000),
  spectators_awarded integer not null default 0, winner text check(winner in ('player','opponent','draw')),
  answered_at timestamptz, unique(match_id,round_number),
  foreign key(user_id,word_id) references vocabulary_words(user_id,id) on delete cascade
);
create table if not exists wordly_scheduler_runs (
  id uuid primary key default gen_random_uuid(), users_checked integer not null default 0,
  assignments_created integer not null default 0, skipped integer not null default 0, errors integer not null default 0,
  duration_ms integer not null default 0, created_at timestamptz not null default now()
);
create or replace function award_xp(p_user_id uuid,p_event_type text,p_source_id text,p_amount integer)
returns integer language plpgsql as $$
declare awarded integer := 0;
begin
  if p_amount < 0 then raise exception 'XP cannot be negative'; end if;
  insert into user_gamification(user_id) values(p_user_id) on conflict do nothing;
  insert into xp_events(user_id,event_type,source_id,amount) values(p_user_id,p_event_type,p_source_id,p_amount)
  on conflict(user_id,event_type,source_id) do nothing;
  if found then
    update user_gamification set total_xp=total_xp+p_amount,updated_at=now() where user_id=p_user_id;
    awarded := p_amount;
  end if;
  return awarded;
end $$;
