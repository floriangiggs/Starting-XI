-- Nur fuer lokale Tests (PGlite): bildet die Teile von Supabase nach, auf die das Schema baut (Rollen, auth.users, auth.uid()).
-- Auf echtem Supabase existiert das alles bereits; diese Datei wird dort NICHT ausgefuehrt.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
-- Supabase vergibt neuen Tabellen/Funktionen im Schema public standardmaessig Rechte an diese Rollen; 0008_grants.sql nimmt sie wieder weg
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
