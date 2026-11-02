-- Duell ueber den Server, Teil 2 (K6a): Auswahl-Regeln wie in der App, Rundenstart mit Sperre, haengende Runden schliessen,
-- Duell ausblenden, Hinweise "Du bist dran" / "zurueckgezogen", Grenze offener Duelle je Freundespaar.
-- Wiederholbar ausfuehrbar (create or replace / if not exists). Abwaertskompatibel: bestehende Funktionen behalten ihre Rechte.

insert into public.app_config (key, value) values ('max_open_duels_pair', 3), ('round_grace_seconds', 120) on conflict (key) do nothing;

-- Katalog: Merkmale fuer die Auswahl (werden von tools/gen-supabase-seed.mjs aus den App-Funktionen gefuellt)
alter table public.lineup_catalog add column if not exists pool text;
alter table public.lineup_catalog add column if not exists special text;
alter table public.lineup_catalog add column if not exists cats text[] not null default '{}';
alter table public.lineup_catalog add column if not exists team_keys text[] not null default '{}';

alter table public.duels add column if not exists hidden_by uuid[] not null default '{}';

-- Rundenstart: wer eine Runde beginnt, ist festgelegt (Aufstellung wird erst jetzt sichtbar, abgebrochene Runden zaehlen 0)
create table if not exists public.duel_starts (
  duel_id uuid not null references public.duels (id) on delete cascade,
  round int not null, user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  primary key (duel_id, round, user_id)
);
alter table public.duel_starts enable row level security;
revoke all on public.duel_starts from public, anon, authenticated;

-- Ist die Aufstellung dieser Runde fuer diesen Nutzer sichtbar? Erst nach eigenem Start/Abgabe oder wenn das Duell zu Ende ist.
create or replace function private.round_visible(p_duel uuid, p_round int, p_user uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.duel_starts s where s.duel_id = p_duel and s.round = p_round and s.user_id = p_user)
      or exists (select 1 from public.duel_results r where r.duel_id = p_duel and r.round = p_round and r.user_id = p_user)
      or exists (select 1 from public.duels d where d.id = p_duel and d.status <> 'open')
$$;
revoke all on function private.round_visible(uuid, int, uuid) from public, anon, authenticated;
grant execute on function private.round_visible(uuid, int, uuid) to authenticated;

drop policy if exists duel_rounds_members on public.duel_rounds;
create policy duel_rounds_members on public.duel_rounds for select to authenticated using (private.is_duel_member(duel_id, auth.uid()) and private.round_visible(duel_id, round, auth.uid()));

-- Auswahl wie pickDuelRounds der App: Runde fuer Runde; Regeln von hinten nach vorn gelockert (Gegner 30 Tage, frisch, Team, Runde 1, knifflig, Kategorie)
create or replace function private.pick_lineups(a uuid, b uuid, p_rounds int, p_diff int) returns text[] language plpgsql security definer set search_path = public, pg_temp as $$
declare
  chosen text[] := '{}'; used_cats text[] := '{}'; prev_teams text[]; recent text[]; opp text[];
  mix boolean := (p_diff = 0); r int; L int; cand text[]; pick text; free_cats text[]; pickcat text; hard_recent boolean;
  f_opp boolean; f_fresh boolean; f_team boolean; f_first boolean; f_hard boolean; f_cat boolean;
begin
  select coalesce(array_agg(x.lineup_id), '{}') into opp from (
    select dr.lineup_id from public.duel_rounds dr join public.duels d on d.id = dr.duel_id
    where ((d.created_by = a and d.opponent = b) or (d.created_by = b and d.opponent = a)) and d.created_at > now() - interval '30 days') x;
  select coalesce(array_agg(x.lineup_id), '{}') into recent from (
    select dr.lineup_id from public.duel_rounds dr join public.duels d on d.id = dr.duel_id
    where d.created_by in (a, b) or d.opponent in (a, b) order by d.created_at desc, dr.round limit 40) x;
  for r in 1..p_rounds loop
    prev_teams := coalesce((select m.team_keys from public.lineup_catalog m where m.id = chosen[cardinality(chosen)]), '{}');
    hard_recent := exists (select 1 from public.lineup_catalog m where m.id = any (chosen[greatest(1, cardinality(chosen) - 1):cardinality(chosen)]) and m.difficulty >= 4);
    cand := null;
    for L in 0..5 loop
      f_opp := L <= 2; f_fresh := L <= 1; f_team := L <= 3; f_first := L <= 4; f_hard := L <= 4; f_cat := L = 0;
      select array_agg(m.id) into cand from public.lineup_catalog m
      where (p_diff = 0 or m.difficulty = p_diff) and not (m.id = any (chosen))
        and (not f_opp or not (m.id = any (opp)))
        and (not f_fresh or not (m.id = any (recent)))
        and (not f_team or not (m.team_keys && prev_teams))
        and (not f_first or not (mix and r = 1 and m.difficulty >= 4))
        and (not f_hard or not (mix and m.difficulty >= 4 and hard_recent))
        and (not f_cat or exists (select 1 from unnest(case when cardinality(m.cats) = 0 then array['_'] else m.cats end) c where not (c = any (used_cats))));
      if cand is not null then
        if f_cat then
          select coalesce(array_agg(distinct c), '{}') into free_cats from public.lineup_catalog m, unnest(case when cardinality(m.cats) = 0 then array['_'] else m.cats end) c
            where m.id = any (cand) and not (c = any (used_cats));
          pickcat := free_cats[1 + floor(random() * cardinality(free_cats))::int];
          used_cats := used_cats || pickcat;
          select array_agg(m.id) into cand from public.lineup_catalog m
            where m.id = any (cand) and pickcat = any (case when cardinality(m.cats) = 0 then array['_'] else m.cats end);
          pick := cand[1 + floor(random() * cardinality(cand))::int];
        else
          pick := cand[1 + floor(random() * cardinality(cand))::int];
          used_cats := used_cats || (select case when cardinality(m.cats) = 0 then array['_'] else m.cats end from public.lineup_catalog m where m.id = pick);
        end if;
        exit;
      end if;
    end loop;
    if cand is null then exit; end if;
    chosen := chosen || pick;
  end loop;
  if cardinality(chosen) < p_rounds then raise exception 'not_enough_lineups' using errcode = 'P0001'; end if;
  return chosen;
end $$;
revoke all on function private.pick_lineups(uuid, uuid, int, int) from public, anon, authenticated;

create or replace function public.create_duel(p_opponent uuid, p_rounds int, p_seconds int, p_difficulty int default 0) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); id_ uuid; lineups text[]; i int;
begin
  if not exists (select 1 from public.profiles where id = v) then raise exception 'no_profile' using errcode = 'P0001'; end if;
  if p_rounds not in (1, 3, 5) or p_seconds not in (60, 120, 180, 300) or p_difficulty not between 0 and 5 then raise exception 'bad_settings' using errcode = 'P0001'; end if;
  if v = p_opponent or not private.are_friends(v, p_opponent) or private.blocked_between(v, p_opponent) then raise exception 'not_friends' using errcode = 'P0001'; end if;
  perform private.rate_check(v, 'create_duel', private.cfg('create_duel_per_minute'), interval '1 minute');
  if (select count(*) from public.duels x where x.status = 'open' and v in (x.created_by, x.opponent)) >= private.cfg('max_open_duels') then raise exception 'too_many_duels' using errcode = 'P0001'; end if;
  if (select count(*) from public.duels x where x.status = 'open' and ((x.created_by = v and x.opponent = p_opponent) or (x.created_by = p_opponent and x.opponent = v))) >= private.cfg('max_open_duels_pair') then raise exception 'too_many_with_friend' using errcode = 'P0001'; end if;
  lineups := private.pick_lineups(v, p_opponent, p_rounds, p_difficulty);
  insert into public.duels (rounds, seconds, difficulty, created_by, opponent, deadline)
    values (p_rounds, p_seconds, p_difficulty, v, p_opponent, now() + make_interval(hours => private.cfg('duel_deadline_hours'))) returning id into id_;
  for i in 1..p_rounds loop insert into public.duel_rounds (duel_id, round, lineup_id) values (id_, i, lineups[i]); end loop;
  perform private.enqueue(p_opponent, 'duel_challenge', jsonb_build_object('duel', id_, 'from', private.pub_profile(v), 'rounds', p_rounds, 'seconds', p_seconds));
  return id_;
end $$;

-- Runde beginnen (idempotent). Liefert die Aufstellung dieser Runde; Reihenfolge ist Pflicht (erst Runde 1, dann 2 ...).
create or replace function public.start_round(p_duel uuid, p_round int) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); d public.duels; lid text; st timestamptz;
begin
  select * into d from public.duels where id = p_duel for update;
  if not found or v not in (d.created_by, d.opponent) then raise exception 'no_duel' using errcode = 'P0001'; end if;
  if d.status <> 'open' then raise exception 'duel_closed' using errcode = 'P0001'; end if;
  if now() > d.deadline then raise exception 'deadline_passed' using errcode = 'P0001'; end if;
  if p_round is null or p_round < 1 or p_round > d.rounds then raise exception 'bad_round' using errcode = 'P0001'; end if;
  select lineup_id into lid from public.duel_rounds where duel_id = p_duel and round = p_round;
  if exists (select 1 from public.duel_results where duel_id = p_duel and round = p_round and user_id = v) then
    return jsonb_build_object('lineup_id', lid, 'done', true);
  end if;
  if (select count(*) from public.duel_results where duel_id = p_duel and user_id = v and round < p_round) < p_round - 1 then raise exception 'round_order' using errcode = 'P0001'; end if;
  insert into public.duel_starts (duel_id, round, user_id) values (p_duel, p_round, v) on conflict do nothing;
  select started_at into st from public.duel_starts where duel_id = p_duel and round = p_round and user_id = v;
  return jsonb_build_object('lineup_id', lid, 'done', false, 'seconds', d.seconds, 'elapsed', floor(extract(epoch from now() - st))::int);
end $$;

-- Runde abgeben. Doppeltes Senden aendert nichts ({recorded:false}). Zeit muss zum Start passen; 0 Richtige zaehlen mit voller Zeit;
-- zu spaet abgegeben (Limit + Gnadenfrist) = Runde mit 0 Richtigen.
create or replace function public.submit_round(p_duel uuid, p_round int, p_correct int, p_seconds int, p_solved jsonb default null, p_mask int default null, p_left int default 0) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); d public.duels; n int; fin boolean; el jsonb; st timestamptz; elapsed numeric; corr int := p_correct; sec int := p_seconds; lft int := p_left; sol jsonb := p_solved; msk int := p_mask; forfeited boolean := false; other uuid;
begin
  select * into d from public.duels where id = p_duel for update;  -- je Duell nacheinander: sonst koennte bei gleichzeitigem Senden keiner das Ende bemerken
  if not found or v not in (d.created_by, d.opponent) then raise exception 'no_duel' using errcode = 'P0001'; end if;
  if d.status <> 'open' then raise exception 'duel_closed' using errcode = 'P0001'; end if;
  if now() > d.deadline then raise exception 'deadline_passed' using errcode = 'P0001'; end if;
  if p_round is null or p_round < 1 or p_round > d.rounds then raise exception 'bad_round' using errcode = 'P0001'; end if;
  if p_correct is null or p_correct < 0 or p_correct > 11 then raise exception 'bad_correct' using errcode = 'P0001'; end if;
  if p_seconds is null or p_seconds < 1 or p_seconds > d.seconds + 2 then raise exception 'bad_seconds' using errcode = 'P0001'; end if;
  if p_correct > 0 and p_seconds < p_correct * private.cfg('min_seconds_per_correct') then raise exception 'too_fast' using errcode = 'P0001'; end if;
  if p_mask is not null and p_mask not between 0 and 2047 then raise exception 'bad_mask' using errcode = 'P0001'; end if;
  if p_left is null or p_left < 0 or p_left > 100 then raise exception 'bad_left' using errcode = 'P0001'; end if;
  if p_solved is not null then
    if jsonb_typeof(p_solved) <> 'array' or jsonb_array_length(p_solved) > 11 then raise exception 'bad_solved' using errcode = 'P0001'; end if;
    for el in select value from jsonb_array_elements(p_solved) loop
      if jsonb_typeof(el) not in ('number', 'null') or (jsonb_typeof(el) = 'number' and ((el #>> '{}')::numeric < 0 or (el #>> '{}')::numeric > 302)) then raise exception 'bad_solved' using errcode = 'P0001'; end if;
    end loop;
  end if;
  if exists (select 1 from public.duel_results where duel_id = p_duel and round = p_round and user_id = v) then
    return jsonb_build_object('recorded', false, 'finished', false);
  end if;
  select started_at into st from public.duel_starts where duel_id = p_duel and round = p_round and user_id = v;
  if st is null then raise exception 'not_started' using errcode = 'P0001'; end if;
  elapsed := extract(epoch from now() - st);
  if elapsed > d.seconds + private.cfg('round_grace_seconds') then
    forfeited := true; corr := 0; sec := d.seconds; lft := 1; sol := null; msk := null;
  elsif corr = 0 then sec := d.seconds;
  elsif sec > elapsed + 2 then raise exception 'bad_seconds' using errcode = 'P0001';
  end if;
  insert into public.duel_results (duel_id, round, user_id, correct, seconds, mask, solved, left_app)
    values (p_duel, p_round, v, corr, sec, msk, sol, lft) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('recorded', false, 'finished', d.status = 'finished'); end if;
  update public.duels set updated_at = now() where id = p_duel;
  fin := private.try_finish(p_duel);
  if not fin and (select count(*) from public.duel_results where duel_id = p_duel and user_id = v) = d.rounds then
    other := case when v = d.created_by then d.opponent else d.created_by end;
    perform private.enqueue(other, 'duel_your_turn', jsonb_build_object('duel', p_duel, 'from', private.pub_profile(v)));
  end if;
  return jsonb_build_object('recorded', true, 'finished', fin, 'forfeited', forfeited);
end $$;

create or replace function public.cancel_duel(p_duel uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); d public.duels;
begin
  select * into d from public.duels where id = p_duel;
  if not found or d.created_by <> v or d.status <> 'open' then raise exception 'not_allowed' using errcode = 'P0001'; end if;
  if exists (select 1 from public.duel_results where duel_id = p_duel and user_id = d.opponent) then raise exception 'already_played' using errcode = 'P0001'; end if;
  update public.duels set status = 'cancelled', updated_at = now(), finished_at = now() where id = p_duel;
  perform private.enqueue(d.opponent, 'duel_cancelled', jsonb_build_object('duel', p_duel, 'from', private.pub_profile(v)));
end $$;

-- Beendetes/abgelehntes/abgelaufenes Duell aus der eigenen Liste nehmen (fuer den anderen bleibt es)
create or replace function public.hide_duel(p_duel uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); d public.duels;
begin
  select * into d from public.duels where id = p_duel;
  if not found or v not in (d.created_by, d.opponent) then raise exception 'no_duel' using errcode = 'P0001'; end if;
  if d.status = 'open' then raise exception 'not_allowed' using errcode = 'P0001'; end if;
  if not (v = any (d.hidden_by)) then update public.duels set hidden_by = array_append(hidden_by, v) where id = p_duel; end if;
end $$;
revoke all on function public.start_round(uuid, int), public.hide_duel(uuid) from public, anon, authenticated;
grant execute on function public.start_round(uuid, int), public.hide_duel(uuid) to authenticated;

-- Ein Duell mit allem, was ich sehen darf. Aufstellungen erst nach eigenem Start; Gegner-Ergebnisse einer Runde erst nach meiner Abgabe oder nach Ende.
create or replace function public.get_duel(p_duel uuid) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); d public.duels; other uuid; out_ jsonb; act jsonb;
begin
  select * into d from public.duels where id = p_duel;
  if not found or v not in (d.created_by, d.opponent) then raise exception 'no_duel' using errcode = 'P0001'; end if;
  other := case when v = d.created_by then d.opponent else d.created_by end;
  select jsonb_agg(jsonb_build_object('round', r.round,
      'lineup_id', case when private.round_visible(r.duel_id, r.round, v) then r.lineup_id end,
      'mine', (select to_jsonb(m) - 'duel_id' - 'user_id' - 'round' from public.duel_results m where m.duel_id = r.duel_id and m.round = r.round and m.user_id = v),
      'theirs', (select to_jsonb(t) - 'duel_id' - 'user_id' - 'round' from public.duel_results t
                 where t.duel_id = r.duel_id and t.round = r.round and t.user_id = other
                   and (d.status = 'finished' or exists (select 1 from public.duel_results m2 where m2.duel_id = r.duel_id and m2.round = r.round and m2.user_id = v))))
      order by r.round) into out_
  from public.duel_rounds r where r.duel_id = p_duel;
  select jsonb_build_object('round', s.round, 'elapsed', floor(extract(epoch from now() - s.started_at))::int) into act
    from public.duel_starts s where s.duel_id = p_duel and s.user_id = v
      and not exists (select 1 from public.duel_results r where r.duel_id = s.duel_id and r.round = s.round and r.user_id = v) order by s.round limit 1;
  return jsonb_build_object('id', d.id, 'mode', d.mode, 'rounds', d.rounds, 'seconds', d.seconds, 'difficulty', d.difficulty, 'status', d.status, 'deadline', d.deadline,
    'created_at', d.created_at, 'finished_at', d.finished_at, 'result', d.result, 'i_am', case when v = d.created_by then 'creator' else 'opponent' end,
    'creator', private.pub_profile(d.created_by), 'opponent', private.pub_profile(d.opponent), 'rounds_list', coalesce(out_, '[]'::jsonb), 'my_active', act,
    'their_active', exists (select 1 from public.duel_starts s where s.duel_id = p_duel and s.user_id = other
      and not exists (select 1 from public.duel_results r where r.duel_id = s.duel_id and r.round = s.round and r.user_id = other)));
end $$;

create or replace function public.list_duels() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'status', d.status, 'rounds', d.rounds, 'seconds', d.seconds, 'difficulty', d.difficulty, 'deadline', d.deadline,
      'created_at', d.created_at, 'updated_at', d.updated_at, 'finished_at', d.finished_at, 'i_am', case when private.me() = d.created_by then 'creator' else 'opponent' end,
      'other', private.pub_profile(case when private.me() = d.created_by then d.opponent else d.created_by end),
      'my_done', (select count(*) from public.duel_results r where r.duel_id = d.id and r.user_id = private.me()),
      'their_done', (select count(*) from public.duel_results r where r.duel_id = d.id and r.user_id <> private.me()),
      'my_active', (select min(s.round) from public.duel_starts s where s.duel_id = d.id and s.user_id = private.me()
         and not exists (select 1 from public.duel_results r where r.duel_id = s.duel_id and r.round = s.round and r.user_id = s.user_id)),
      'their_active', exists (select 1 from public.duel_starts s where s.duel_id = d.id and s.user_id <> private.me()
         and not exists (select 1 from public.duel_results r where r.duel_id = s.duel_id and r.round = s.round and r.user_id = s.user_id)),
      'result', d.result) order by d.updated_at desc), '[]'::jsonb)
  from (select * from public.duels x where private.me() in (x.created_by, x.opponent) and not (private.me() = any (x.hidden_by)) order by x.updated_at desc limit 100) d
$$;

-- Haengende Runden (begonnen, nach Limit + Gnadenfrist nicht abgegeben) zaehlen 0 Richtige; ein Duell kann dadurch enden
create or replace function private.close_stale_rounds() returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare s record; n int := 0;
begin
  for s in
    select st.duel_id, st.round, st.user_id, d.seconds from public.duel_starts st join public.duels d on d.id = st.duel_id
    where d.status = 'open' and st.started_at < now() - make_interval(secs => d.seconds + private.cfg('round_grace_seconds'))
      and not exists (select 1 from public.duel_results r where r.duel_id = st.duel_id and r.round = st.round and r.user_id = st.user_id)
  loop
    insert into public.duel_results (duel_id, round, user_id, correct, seconds, left_app) values (s.duel_id, s.round, s.user_id, 0, s.seconds, 1) on conflict do nothing;
    perform private.try_finish(s.duel_id);
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function private.close_stale_rounds() from public, anon, authenticated;

create or replace function public.process_deadlines() returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare d public.duels; ca int; cb int; winner uuid; res jsonb; n int := 0;
begin
  perform private.close_stale_rounds();
  for d in select * from public.duels where status = 'open' and deadline < now() for update loop
    select count(*) into ca from public.duel_results where duel_id = d.id and user_id = d.created_by;
    select count(*) into cb from public.duel_results where duel_id = d.id and user_id = d.opponent;
    if ca = 0 and cb = 0 then
      update public.duels set status = 'expired', updated_at = now(), finished_at = now() where id = d.id;
      perform private.enqueue(d.created_by, 'duel_expired', jsonb_build_object('duel', d.id));
    else
      if ca = cb then res := private.compute_duel_result(d.id);   -- gleich weit: gemeinsam gespielte Runden entscheiden
      else
        winner := case when ca > cb then d.created_by else d.opponent end;
        res := jsonb_build_object('winner', winner, 'by', 'forfeit', 'creator_rounds_played', ca, 'opponent_rounds_played', cb);
      end if;
      update public.duels set status = 'finished', result = res, updated_at = now(), finished_at = now() where id = d.id;
      perform private.enqueue(d.created_by, 'duel_finished', jsonb_build_object('duel', d.id, 'by', 'deadline'));
      perform private.enqueue(d.opponent, 'duel_finished', jsonb_build_object('duel', d.id, 'by', 'deadline'));
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;
