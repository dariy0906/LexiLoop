create index if not exists sessions_expires on sessions(expires_at);
alter table daily_wordly_assignments add column if not exists last_request_id text;
