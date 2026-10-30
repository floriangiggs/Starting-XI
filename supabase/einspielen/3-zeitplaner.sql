-- Erst im Dashboard unter Database -> Extensions "pg_cron" aktivieren, dann dies ausführen:
select cron.schedule('duel-deadlines', '*/15 * * * *', $$select public.process_deadlines()$$);
select cron.schedule('duel-warnings',  '*/30 * * * *', $$select public.enqueue_deadline_warnings()$$);
