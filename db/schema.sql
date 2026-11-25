create extension if not exists pgcrypto;
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null default '',
  daily_review_goal integer not null default 10 check (daily_review_goal between 1 and 100),
  language_preference text not null default 'en' check (language_preference in ('en','ru','kk')),
  research_enabled boolean not null default false,
  participant_code text,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions(user_id);
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id,id)
);
create unique index if not exists categories_active_name on categories(user_id,lower(name)) where deleted_at is null;
create table if not exists vocabulary_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  word text not null check (char_length(word) between 1 and 120),
  phonetic text,
  definition_en text,
  translation_ru text,
  translation_kk text,
  example_sentence text,
  notes text,
  category_id uuid,
  favorite boolean not null default false,
  mastery_level integer not null default 0 check (mastery_level between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id,id),
  foreign key(user_id,category_id) references categories(user_id,id) on delete set null(category_id)
);
create index if not exists words_user_updated on vocabulary_words(user_id,updated_at desc);
create table if not exists review_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  word_id uuid not null,
  interval_days integer not null default 0 check(interval_days>=0),
  ease_factor double precision not null default 2.5 check(ease_factor between 1.3 and 3),
  repetitions integer not null default 0 check(repetitions>=0),
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,word_id),
  foreign key(user_id,word_id) references vocabulary_words(user_id,id) on delete cascade
);
create index if not exists reviews_due on review_state(user_id,next_review_at);
create table if not exists review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  word_id uuid not null,
  rating text not null check(rating in ('Again','Hard','Good','Easy')),
  reviewed_at timestamptz not null default now(),
  previous_interval_days integer,
  new_interval_days integer not null check(new_interval_days>=0),
  created_at timestamptz not null default now(),
  foreign key(user_id,word_id) references vocabulary_words(user_id,id) on delete cascade
);
create index if not exists review_events_time on review_events(user_id,reviewed_at desc);
create table if not exists practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  word_id uuid not null,
  mode text not null check(mode in ('quiz','sentence','writing')),
  answer text not null,
  correct boolean,
  created_at timestamptz not null default now(),
  foreign key(user_id,word_id) references vocabulary_words(user_id,id) on delete cascade
);
create index if not exists practice_mistakes on practice_attempts(user_id,created_at desc) where correct=false;
create table if not exists speaking_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  word_id uuid not null,
  prompt_text text not null,
  transcript_text text not null,
  feedback_text text not null,
  created_at timestamptz not null default now(),
  foreign key(user_id,word_id) references vocabulary_words(user_id,id) on delete cascade
);
