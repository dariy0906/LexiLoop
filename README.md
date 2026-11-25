# LexiLoop Site

A browser vocabulary notebook built with Next.js, TypeScript, Tailwind CSS, Zod, and **its own PostgreSQL database**. This site has separate accounts and data from the LexiLoop mobile app. It does not connect to Supabase or change the mobile project.

## Run locally

The PostgreSQL container `lexiloop-site-postgres` is already configured on this computer at `127.0.0.1:5435`, with a persistent Docker volume. After a reboot, start it if necessary:

```bash
docker start lexiloop-site-postgres
```

The local database URL is in the ignored `.env.local` file. Then:

```bash
cd '/home/dariy/projects/LexiLoop_Site'
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create a **new site account**. Your mobile app password and vocabulary do not carry over because this site uses a separate database.

## Database

The base schema is in [`db/schema.sql`](db/schema.sql) and migrations are in [`db/migrations`](db/migrations). Together they contain users, sessions, categories, vocabulary, review state and events, practice attempts, speaking attempt storage, local time zones, game tables, and the cartoon lesson catalogue. API routes scope every query by the signed-in site user. The `sessions` table stores only hashes of random session tokens; the cookie is HTTP-only.

For a fresh local installation, create a PostgreSQL 16 database, set `DATABASE_URL` as shown in `.env.example`, then apply the schema and migrations in order:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/apply.sql
```

`db/apply.sql` uses psql's `\ir` to apply `schema.sql`, every migration, and the local cartoon lesson seed.

The database password must stay in `.env.local`; do not commit it.

## Gamification

The Play area contains Quick Lessons, Daily Wordly, and a three-round Battle Arena. XP, levels, lesson streaks, Wordly assignments, player skill, bot results, spectators, and match rewards are calculated by the server and stored in PostgreSQL. Duplicate requests use unique source IDs, so they cannot award XP twice.

- Quick Lessons contain 5–10 questions selected from due words, recent mistakes, and new words. Only a completed lesson can advance the streak, once per local calendar day.
- Daily Wordly assigns one saved vocabulary word per user and local date, with six attempts and progressive clues. The same assignment is returned throughout that day.
- Battle Arena freezes an adaptive bot snapshot when a match starts. Every match has exactly three rounds, and correctness, response time, spectators, XP, and the final result are decided on the server.
- Battle Skill uses up to 50 recent meaningful answers with recency weighting. Profiles with fewer than 20 answers are marked as calibrating.

The site database remains separate from the mobile app database. It uses server-owned PostgreSQL access rather than Supabase RLS; authenticated API queries enforce the site user ID.

## Cartoons

The Cartoons area has six captioned YouTube animations, one for each CEFR level from A1 to C2. Timed English tracks are stored in `public/captions/<video-id>.en.vtt`; the YouTube IFrame API keeps the clickable subtitle line below the player synchronized during playback and seeking. A1/A2 use auto-generated captions, so occasional transcription errors are possible. The mini glossary shows general meanings; tapping a subtitle word calls the server-side DeepSeek context translator with the current, previous and next line, the clicked span, and the learner’s translation language. Phrasal verbs can expand into one highlighted expression. Context translations are cached by line, span, neighboring lines and language; saving one stores the subtitle as the example and keeps normal spaced-repetition review. If a video is changed, update its VTT track and catalog metadata together. Lesson metadata and vocabulary live in `cartoon_lessons` and `cartoon_lesson_words`, seeded from `db/seed/cartoons.sql` and updated by `db/migrations/008_captioned_cartoons.sql` and `db/migrations/009_more_cartoon_words.sql`. Multiword phrases in the captions can be tapped and saved as one vocabulary item.

Adding a cartoon word creates a normal `vocabulary_words` row and its `review_state`, so it appears in Vocabulary, Review, and Practice. Active duplicates are rejected, and lesson progress is calculated only for the signed-in user.

## Wordly scheduler

Run the preparation job hourly. It creates tomorrow's assignment only for users whose next local day begins within six hours; opening Wordly also creates today's assignment as a safe fallback.

```bash
npm run wordly:prepare
```

For a hosted scheduler, set a long random `CRON_SECRET` and send an hourly `POST` request to `/api/gamification/scheduler` with `Authorization: Bearer <CRON_SECRET>`. The `wordly_scheduler_runs` table records checked users, created assignments, skips, errors, and duration.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm test
npm run test:live
npm run test:game-live
npm run test:cartoons-live
npm run build
```

AI word suggestions are optional and stay disabled unless `DEEPSEEK_API_KEY` is set. Speaking evaluation and microphone recording are not connected in this PostgreSQL-only build; manual vocabulary, scheduled review, and practice work without them.

## Deploy

Use a hosted PostgreSQL 16 database with a connection pooler, apply `db/apply.sql` once, and set `DATABASE_URL` as a server-side environment variable in the Next.js hosting platform. Never expose it with a `NEXT_PUBLIC_` prefix. Deploy the Next.js app normally (for example, with Vercel); HTTPS is required for the production session cookie. The local `127.0.0.1:5435` URL only works on this computer.

Auth and AI rate limits are kept in process memory. A single server instance is protected, but multi-instance deployments should use a shared limiter such as Redis.

The site is not currently published. Browser microphone recording and speaking evaluation are not connected in this PostgreSQL-only build.

Context translations require `DEEPSEEK_API_KEY` and `db/migrations/010_context_translation_cache.sql` (included in `db/apply.sql`). Run `npm run test:context-live` against the local server to verify cache lookup, contextual saving and review-state creation.
