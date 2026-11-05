-- Push (8b-3): Zeitplaner, der die Warteschlange (public.notification_queue) jede Minute an die Edge Function "send-push" uebergibt.
-- NICHT unter migrations/, weil pg_cron, pg_net und Vault nur auf echtem Supabase existieren (die Tests laufen auf PGlite).
--
-- Vorher (Dashboard):
--   1. Database -> Extensions: "pg_net" und "pg_cron" einschalten.
--   2. Edge Functions -> Secrets: APNS_KEY_ID, APNS_P8_KEY, CRON_SECRET (langer Zufallstext) setzen; APPLE_TEAM_ID gibt es schon.
--   3. Edge Function "send-push" ausrollen (Verify JWT AUS - die Function prueft den Kopf x-cron-secret selbst).
-- Dann in den SQL Editor, in dieser Reihenfolge (Werte in Anfuehrungszeichen selbst eintragen, NICHT in diese Datei schreiben):
--
--   select vault.create_secret('<derselbe Text wie CRON_SECRET>', 'push_cron_secret');
--   select vault.create_secret('https://<PROJEKT-REF>.supabase.co/functions/v1/<Slug der Function, bei uns swift-handler>', 'push_function_url');
--
--   Danach den Rest dieser Datei ausfuehren.

-- Rechte fuer die Function (steht auch in migrations/0011_push_rechte.sql)
grant select, update on public.notification_queue to service_role;
grant select, delete on public.devices to service_role;

create extension if not exists pg_net;

create or replace function private.push_tick() returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare u text; s text;
begin
  -- nur aufrufen, wenn etwas wartet (spart Function-Aufrufe)
  if not exists (select 1 from public.notification_queue where sent_at is null) then return; end if;
  select decrypted_secret into u from vault.decrypted_secrets where name = 'push_function_url';
  select decrypted_secret into s from vault.decrypted_secrets where name = 'push_cron_secret';
  if u is null or s is null then return; end if;
  perform net.http_post(url := u, headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', s), body := '{}'::jsonb);
end $$;
revoke all on function private.push_tick() from public;

-- aufraeumen: Eintraege aelter als 7 Tage (die Function setzt sent_at spaetestens nach 12 Stunden, auch ohne Geraet)
create or replace function private.push_cleanup() returns void language sql security definer set search_path = public, pg_temp as $$
  delete from public.notification_queue where created_at < now() - interval '7 days'
$$;
revoke all on function private.push_cleanup() from public;

select cron.schedule('push-send',    '* * * * *',  $$select private.push_tick()$$);
select cron.schedule('push-cleanup', '30 3 * * *', $$select private.push_cleanup()$$);

-- Pruefen: select jobname, schedule, active from cron.job where jobname like 'push-%';
-- Ausschalten: select cron.unschedule('push-send');
