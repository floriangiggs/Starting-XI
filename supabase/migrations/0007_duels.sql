-- Duell ueber den Server (Technik-Konzept Abschnitt 10): anlegen, spielen, versiegelt, beenden, Fristen.
-- Wertung wie in der App (Prompt 26): Runde = mehr Richtige, sonst weniger Zeit, sonst Remis; Duell = mehr gewonnene Runden,
-- sonst mehr Richtige insgesamt, sonst weniger Gesamtzeit, sonst Remis.

create function private.pick_lineups(a uuid, b uuid, p_rounds int, p_diff int) returns text[] language plpgsql security definer set search_path = public, pg_temp as $$
declare picked text[]; recent text[];
begin
  -- nicht die zuletzt gegeneinander gespielten Aufstellungen, solange genug andere da sind
  select coalesce(array_agg(x.lineup_id), '{}') into recent from (
    select dr.lineup_id from public.duel_rounds dr join public.duels d on d.id = dr.duel_id
    where (d.created_by = a and d.opponent = b) or (d.created_by = b and d.opponent = a) order by d.created_at desc, dr.round limit 15) x;
  select array_agg(s.id) into picked from (select id from public.lineup_catalog where (p_diff = 0 or difficulty = p_diff) and not (id = any (recent)) order by random() limit p_rounds) s;
  if coalesce(array_length(picked, 1), 0) < p_rounds then
    select array_agg(s.id) into picked from (select id from public.lineup_catalog where (p_diff = 0 or difficulty = p_diff) order by random() limit p_rounds) s;
  end if;
  if coalesce(array_length(picked, 1), 0) < p_rounds then raise exception 'not_enough_lineups' using errcode = 'P0001'; end if;
  return picked;
end $$;

-- Ergebnis aus den gemeinsam gespielten Runden berechnen
create function private.compute_duel_result(p_duel uuid) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare d public.duels; r record; wa int := 0; wb int := 0; ca int := 0; cb int := 0; sa int := 0; sb int := 0; rounds jsonb := '[]'::jsonb; w text; rby text; winner uuid; res_by text;
begin
  select * into d from public.duels where id = p_duel;
  for r in
    select a.round, a.correct ac, a.seconds as_, b.correct bc, b.seconds bs
    from public.duel_results a join public.duel_results b on b.duel_id = a.duel_id and b.round = a.round and b.user_id = d.opponent
    where a.duel_id = p_duel and a.user_id = d.created_by order by a.round
  loop
    if r.ac <> r.bc then w := case when r.ac > r.bc then 'creator' else 'opponent' end; rby := 'correct';
    elsif r.as_ <> r.bs then w := case when r.as_ < r.bs then 'creator' else 'opponent' end; rby := 'time';
    else w := 'draw'; rby := 'draw'; end if;
    if w = 'creator' then wa := wa + 1; elsif w = 'opponent' then wb := wb + 1; end if;
    ca := ca + r.ac; cb := cb + r.bc; sa := sa + r.as_; sb := sb + r.bs;
    rounds := rounds || jsonb_build_object('round', r.round, 'w', w, 'by', rby);
  end loop;
  if wa <> wb then winner := case when wa > wb then d.created_by else d.opponent end; res_by := 'rounds';
  elsif ca <> cb then winner := case when ca > cb then d.created_by else d.opponent end; res_by := 'correct';
  elsif sa <> sb then winner := case when sa < sb then d.created_by else d.opponent end; res_by := 'time';
  else winner := null; res_by := 'draw'; end if;
  return jsonb_build_object('winner', winner, 'by', res_by, 'creator_rounds', wa, 'opponent_rounds', wb, 'rounds', rounds,
    'totals', jsonb_build_object('creator_correct', ca, 'opponent_correct', cb, 'creator_seconds', sa, 'opponent_seconds', sb));
end $$;

-- beenden, sobald beide alle Runden abgegeben haben
create function private.try_finish(p_duel uuid) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare d public.duels; na int; nb int;
begin
  select * into d from public.duels where id = p_duel for update;
  if d.status <> 'open' then return false; end if;
  select count(*) into na from public.duel_results where duel_id = p_duel and user_id = d.created_by;
  select count(*) into nb from public.duel_results where duel_id = p_duel and user_id = d.opponent;
  if na < d.rounds or nb < d.rounds then return false; end if;
  update public.duels set status = 'finished', result = private.compute_duel_result(p_duel), finished_at = now(), updated_at = now() where id = p_duel;
  perform private.enqueue(d.created_by, 'duel_finished', jsonb_build_object('duel', p_duel, 'by', 'rounds'));
  perform private.enqueue(d.opponent, 'duel_finished', jsonb_build_object('duel', p_duel, 'by', 'rounds'));
  return true;
end $$;

create function public.create_duel(p_opponent uuid, p_rounds int, p_seconds int, p_difficulty int default 0) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); id_ uuid; lineups text[]; i int;
begin
  if not exists (select 1 from public.profiles where id = v) then raise exception 'no_profile' using errcode = 'P0001'; end if;
  if p_rounds not in (1, 3, 5) or p_seconds not in (60, 120, 180, 300) or p_difficulty not between 0 and 5 then raise exception 'bad_settings' using errcode = 'P0001'; end if;
  if v = p_opponent or not private.are_friends(v, p_opponent) or private.blocked_between(v, p_opponent) then raise exception 'not_friends' using errcode = 'P0001'; end if;
  perform private.rate_check(v, 'create_duel', private.cfg('create_duel_per_minute'), interval '1 minute');
  if (select count(*) from public.duels x where x.status = 'open' and v in (x.created_by, x.opponent)) >= private.cfg('max_open_duels') then raise exception 'too_many_duels' using errcode = 'P0001'; end if;
  lineups := private.pick_lineups(v, p_opponent, p_rounds, p_difficulty);
  insert into public.duels (rounds, seconds, difficulty, created_by, opponent, deadline)
    values (p_rounds, p_seconds, p_difficulty, v, p_opponent, now() + make_interval(hours => private.cfg('duel_deadline_hours'))) returning id into id_;
  for i in 1..p_rounds loop insert into public.duel_rounds (duel_id, round, lineup_id) values (id_, i, lineups[i]); end loop;
  perform private.enqueue(p_opponent, 'duel_challenge', jsonb_build_object('duel', id_, 'from', private.pub_profile(v), 'rounds', p_rounds, 'seconds', p_seconds));
  return id_;
end $$;

-- Runde abgeben. Doppeltes Senden aendert nichts ({recorded:false}); Wertebereiche und Fristen prueft der Server.
create function public.submit_round(p_duel uuid, p_round int, p_correct int, p_seconds int, p_solved jsonb default null, p_mask int default null, p_left int default 0) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); d public.duels; n int; fin boolean; el jsonb;
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
  insert into public.duel_results (duel_id, round, user_id, correct, seconds, mask, solved, left_app)
    values (p_duel, p_round, v, p_correct, p_seconds, p_mask, p_solved, p_left) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('recorded', false, 'finished', d.status = 'finished'); end if;
  update public.duels set updated_at = now() where id = p_duel;
  fin := private.try_finish(p_duel);
  return jsonb_build_object('recorded', true, 'finished', fin);
end $$;

create function public.decline_duel(p_duel uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); d public.duels;
begin
  select * into d from public.duels where id = p_duel;
  if not found or d.opponent <> v or d.status <> 'open' then raise exception 'not_allowed' using errcode = 'P0001'; end if;
  if exists (select 1 from public.duel_results where duel_id = p_duel and user_id = v) then raise exception 'already_played' using errcode = 'P0001'; end if;
  update public.duels set status = 'declined', updated_at = now(), finished_at = now() where id = p_duel;
  perform private.enqueue(d.created_by, 'duel_declined', jsonb_build_object('duel', p_duel, 'by', private.pub_profile(v)));
end $$;

create function public.cancel_duel(p_duel uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); d public.duels;
begin
  select * into d from public.duels where id = p_duel;
  if not found or d.created_by <> v or d.status <> 'open' then raise exception 'not_allowed' using errcode = 'P0001'; end if;
  if exists (select 1 from public.duel_results where duel_id = p_duel and user_id = d.opponent) then raise exception 'already_played' using errcode = 'P0001'; end if;
  update public.duels set status = 'cancelled', updated_at = now(), finished_at = now() where id = p_duel;
end $$;

-- Ein Duell mit allem, was ich sehen darf. Die Ergebnisse des Gegners einer Runde erscheinen erst, wenn ich sie selbst gespielt habe oder das Duell beendet ist.
create function public.get_duel(p_duel uuid) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); d public.duels; other uuid; out_ jsonb;
begin
  select * into d from public.duels where id = p_duel;
  if not found or v not in (d.created_by, d.opponent) then raise exception 'no_duel' using errcode = 'P0001'; end if;
  other := case when v = d.created_by then d.opponent else d.created_by end;
  select jsonb_agg(jsonb_build_object('round', r.round, 'lineup_id', r.lineup_id,
      'mine', (select to_jsonb(m) - 'duel_id' - 'user_id' - 'round' from public.duel_results m where m.duel_id = r.duel_id and m.round = r.round and m.user_id = v),
      'theirs', (select to_jsonb(t) - 'duel_id' - 'user_id' - 'round' from public.duel_results t
                 where t.duel_id = r.duel_id and t.round = r.round and t.user_id = other
                   and (d.status = 'finished' or exists (select 1 from public.duel_results m2 where m2.duel_id = r.duel_id and m2.round = r.round and m2.user_id = v))))
      order by r.round) into out_
  from public.duel_rounds r where r.duel_id = p_duel;
  return jsonb_build_object('id', d.id, 'mode', d.mode, 'rounds', d.rounds, 'seconds', d.seconds, 'difficulty', d.difficulty, 'status', d.status, 'deadline', d.deadline,
    'created_at', d.created_at, 'finished_at', d.finished_at, 'result', d.result, 'i_am', case when v = d.created_by then 'creator' else 'opponent' end,
    'creator', private.pub_profile(d.created_by), 'opponent', private.pub_profile(d.opponent), 'rounds_list', coalesce(out_, '[]'::jsonb));
end $$;

create function public.list_duels() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'status', d.status, 'rounds', d.rounds, 'seconds', d.seconds, 'difficulty', d.difficulty, 'deadline', d.deadline,
      'created_at', d.created_at, 'updated_at', d.updated_at, 'finished_at', d.finished_at, 'i_am', case when private.me() = d.created_by then 'creator' else 'opponent' end,
      'other', private.pub_profile(case when private.me() = d.created_by then d.opponent else d.created_by end),
      'my_done', (select count(*) from public.duel_results r where r.duel_id = d.id and r.user_id = private.me()),
      'their_done', (select count(*) from public.duel_results r where r.duel_id = d.id and r.user_id <> private.me()),
      'result', d.result) order by d.updated_at desc), '[]'::jsonb)
  from (select * from public.duels x where private.me() in (x.created_by, x.opponent) order by x.updated_at desc limit 100) d
$$;

-- Zeitplaner (stuendlich, nur service_role): Fristen und Erinnerungen
create function public.process_deadlines() returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare d public.duels; ca int; cb int; winner uuid; res jsonb; n int := 0;
begin
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

-- Erinnerung vor Ablauf an alle, die noch Runden offen haben (einmal je Duell)
create function public.enqueue_deadline_warnings() returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare d public.duels; n int := 0; u uuid;
begin
  for d in select * from public.duels where status = 'open' and not warned and deadline > now() and deadline <= now() + make_interval(hours => private.cfg('duel_warn_hours')) for update loop
    foreach u in array array[d.created_by, d.opponent] loop
      if (select count(*) from public.duel_results where duel_id = d.id and user_id = u) < d.rounds then
        perform private.enqueue(u, 'duel_deadline_warning', jsonb_build_object('duel', d.id, 'deadline', d.deadline)); n := n + 1;
      end if;
    end loop;
    update public.duels set warned = true where id = d.id;
  end loop;
  return n;
end $$;
