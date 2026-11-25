-- Keep demonstration accounts on the requested test registration date only.
update users
set created_at = '2026-11-06T12:00:00Z'::timestamptz
where is_demo = true;
