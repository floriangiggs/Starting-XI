-- Spielstand-Sicherung, oeffentliche Werte, Tages-Challenge (Technik-Konzept Abschnitte 8–9)

-- Spielstand holen: {data, version, updated_at, device} oder null
create function public.get_save() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object('data', s.data, 'version', s.version, 'updated_at', s.updated_at, 'device', s.device) from public.saves s where s.user_id = private.me()
$$;

-- Spielstand schreiben mit Versionspruefung (Zusammenfuehren macht die App, Server prueft nur, dass niemand ueberschreibt, was er nicht kennt).
-- Neu anlegen: p_expected_version = 0. Stimmt die Version nicht -> 'save_conflict' (die App holt den Stand, fuehrt zusammen, schreibt erneut).
create function public.put_save(p_data jsonb, p_expected_version int, p_device text default null) returns int
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); cur int;
begin
  if not exists (select 1 from public.profiles where id = v) then raise exception 'no_profile' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_data) <> 'object' then raise exception 'bad_data' using errcode = 'P0001'; end if;
  if octet_length(p_data::text) > private.cfg('max_save_bytes') then raise exception 'too_large' using errcode = 'P0001'; end if;
  select version into cur from public.saves where user_id = v for update;
  if not found then
    if p_expected_version <> 0 then raise exception 'save_conflict' using errcode = 'P0001'; end if;
    insert into public.saves (user_id, data, version, device) values (v, p_data, 1, left(p_device, 60));
    return 1;
  end if;
  if cur <> p_expected_version then raise exception 'save_conflict' using errcode = 'P0001'; end if;
  update public.saves set data = p_data, version = cur + 1, device = left(p_device, 60), updated_at = now() where user_id = v;
  return cur + 1;
end $$;

-- oeffentliche Werte (sichtbar fuer Freunde); Wertebereiche prueft die Tabelle
create function public.put_public_stats(p_level int, p_rank text, p_campaign_stars int, p_trophies int, p_streak_current int, p_streak_best int, p_quote int, p_lineups_played int) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me();
begin
  if not exists (select 1 from public.profiles where id = v) then raise exception 'no_profile' using errcode = 'P0001'; end if;
  begin
    insert into public.public_stats (user_id, level, rank, campaign_stars, trophies, streak_current, streak_best, quote, lineups_played)
      values (v, p_level, p_rank, p_campaign_stars, p_trophies, p_streak_current, p_streak_best, p_quote, p_lineups_played)
    on conflict (user_id) do update set level = excluded.level, rank = excluded.rank, campaign_stars = excluded.campaign_stars, trophies = excluded.trophies,
      streak_current = excluded.streak_current, streak_best = excluded.streak_best, quote = excluded.quote, lineups_played = excluded.lineups_played, updated_at = now();
  exception when check_violation or not_null_violation then raise exception 'bad_stats' using errcode = 'P0001';
  end;
end $$;

-- Tages-Ergebnis: eindeutig je Tag, das ERSTE zaehlt. Plausibilitaet laut Abschnitt 9.
-- Rueckgabe {recorded: true|false}. Der Tag zaehlt nach deutscher Zeit.
create function public.submit_daily(p_day date, p_lineup text, p_correct int, p_seconds int) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); today date := (now() at time zone 'Europe/Berlin')::date; planned text; n int;
begin
  if not exists (select 1 from public.profiles where id = v) then raise exception 'no_profile' using errcode = 'P0001'; end if;
  if p_correct is null or p_correct < 0 or p_correct > 11 then raise exception 'bad_correct' using errcode = 'P0001'; end if;
  if p_seconds is null or p_seconds < private.cfg('min_daily_seconds') or p_seconds > 7200 then raise exception 'bad_seconds' using errcode = 'P0001'; end if;
  if p_day is null or p_day > today or p_day < today - private.cfg('daily_days_back') then raise exception 'bad_day' using errcode = 'P0001'; end if;
  select lineup_id into planned from public.daily_lineups where day = p_day;
  if planned is not null and planned <> p_lineup then raise exception 'wrong_lineup' using errcode = 'P0001'; end if;
  if planned is null and not exists (select 1 from public.lineup_catalog where id = p_lineup) then raise exception 'wrong_lineup' using errcode = 'P0001'; end if;
  insert into public.daily_results (user_id, day, lineup_id, correct, seconds) values (v, p_day, p_lineup, p_correct, p_seconds) on conflict do nothing;
  get diagnostics n = row_count;
  return jsonb_build_object('recorded', n = 1);
end $$;

-- "Heute unter Freunden": ich + meine Freunde, ohne Aufstellung/Loesung (kein Spoiler)
create function public.friends_daily(p_day date) returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(private.pub_profile(r.user_id) || jsonb_build_object('correct', r.correct, 'seconds', r.seconds, 'streak', coalesce(s.streak_current, 0), 'mine', r.user_id = private.me())
         order by r.correct desc, r.seconds), '[]'::jsonb)
  from public.daily_results r left join public.public_stats s on s.user_id = r.user_id
  where r.day = p_day and (r.user_id = private.me() or private.are_friends(private.me(), r.user_id))
$$;
