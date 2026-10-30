-- Sicherheitshinweis des Supabase-Advisors (Function Search Path Mutable): feste Suchpfade fuer die zwei Hilfsfunktionen ohne search_path.
alter function private.me() set search_path = public, pg_temp;
alter function private.norm_name(text) set search_path = public, pg_temp;
