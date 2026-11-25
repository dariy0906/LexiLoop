alter table cartoon_lessons add column if not exists youtube_video_id text;
alter table cartoon_lessons add column if not exists youtube_title text;

update cartoon_lessons
set youtube_video_id = case slug
  when 'the-lost-key' then 'dDP-jzPV5fo'
  when 'a-rainy-picnic' then 'aP-qKaig84M'
  when 'the-school-bus-mystery' then 'w0ffwDYo00Q'
  when 'the-ocean-cleanup' then 'AZS5cgybKcI'
  when 'the-midnight-interview' then 'kNw8V_Fkw28'
  when 'the-algorithms-garden' then 'WjqiU5FgsYc'
  else youtube_video_id
end,
youtube_title = case slug
  when 'the-lost-key' then 'Pocoyo — English episodes'
  when 'a-rainy-picnic' then 'Bluey — full episodes'
  when 'the-school-bus-mystery' then 'Simon’s Cat — Cat Man Do'
  when 'the-ocean-cleanup' then 'Kitbull — Pixar SparkShorts'
  when 'the-midnight-interview' then 'Hair Love — animated short film'
  when 'the-algorithms-garden' then 'The Present — animated short film'
  else youtube_title
end
where slug in ('the-lost-key','a-rainy-picnic','the-school-bus-mystery','the-ocean-cleanup','the-midnight-interview','the-algorithms-garden');
