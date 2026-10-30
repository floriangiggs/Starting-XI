select
  (select count(*) from pg_tables where schemaname = 'public') as tabellen,
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity) as ohne_rls,
  (select count(*) from public.lineup_catalog) as aufstellungen,
  (select count(*) from public.daily_lineups) as tages_plan,
  (select count(*) from public.name_rules) as namensregeln,
  (select count(*) from cron.job) as zeitplaner_jobs;
