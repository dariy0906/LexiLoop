-- Demo accounts are deliberately isolated from real-user jobs and analytics.
alter table users add column if not exists is_demo boolean not null default false;
create index if not exists users_demo_created_idx on users(is_demo, created_at desc);
