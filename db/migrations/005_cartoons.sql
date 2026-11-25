create table if not exists cartoon_lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  level text not null check(level in ('A1','A2','B1','B2','C1','C2')),
  duration_seconds integer not null check(duration_seconds > 0),
  description text not null,
  cover_emoji text not null default '🎬',
  cover_color text not null default '#e8f5ef',
  youtube_video_id text,
  youtube_title text,
  scenes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists cartoon_lesson_words (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references cartoon_lessons(id) on delete cascade,
  word text not null check(char_length(word) between 1 and 120),
  phonetic text,
  translation_ru text not null,
  translation_kk text not null,
  definition_en text not null,
  example_sentence text not null,
  difficulty text not null check(difficulty in ('A1','A2','B1','B2','C1','C2')),
  position integer not null check(position > 0),
  created_at timestamptz not null default now(),
  unique(lesson_id,word)
);
create index if not exists cartoon_words_lesson on cartoon_lesson_words(lesson_id,position);
