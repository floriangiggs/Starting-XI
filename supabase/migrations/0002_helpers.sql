-- Hilfsfunktionen (Schema "private": nicht ueber die API erreichbar, nur von Funktionen/Regeln genutzt)

create function private.me() returns uuid language plpgsql stable as $$
declare v uuid := auth.uid();
begin
  if v is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  return v;
end $$;

create function private.cfg(p_key text) returns int language sql stable security definer set search_path = public, pg_temp as $$
  select value from public.app_config where key = p_key
$$;

-- Namen normalisieren: klein, Umlaute, Ziffern als Buchstaben (4->a, 3->e, 0->o, 1->i, 5->s, 7->t), ohne . und _
create function private.norm_name(p text) returns text language sql immutable as $$
  select regexp_replace(
    translate(replace(replace(replace(replace(lower(coalesce(p, '')), 'ä', 'a'), 'ö', 'o'), 'ü', 'u'), 'ß', 'ss'), '430157@$', 'aeoistas'),
    '[._]', '', 'g')
$$;

-- null = in Ordnung, sonst Fehlercode: format | blocked | reserved | person
create function private.username_error(p_name text) returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
declare n text := private.norm_name(p_name);
begin
  if p_name is null or length(p_name) < 3 or length(p_name) > 15 then return 'length'; end if;
  if p_name !~ '^[a-z0-9][a-z0-9._]{1,13}[a-z0-9]$' then return 'format'; end if;
  if exists (select 1 from public.name_rules r where r.kind = 'reserved' and r.word = n) then return 'reserved'; end if;
  if exists (select 1 from public.name_rules r where r.kind = 'blocked' and position(r.word in n) > 0) then return 'blocked'; end if;
  if exists (select 1 from public.name_rules r where r.kind = 'person' and r.word = n) then return 'person'; end if;
  return null;
end $$;

create function private.are_friends(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.friendships f where f.user_a = least(a, b) and f.user_b = greatest(a, b) and f.status = 'accepted')
$$;

create function private.blocked_between(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.blocks k where (k.blocker = a and k.blocked = b) or (k.blocker = b and k.blocked = a))
$$;

-- Begrenzung: wirft 'rate_limited', wenn in der Zeitspanne schon p_max Ereignisse dieser Art waren; sonst wird eines notiert
create function private.rate_check(p_user uuid, p_kind text, p_max int, p_window interval) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (select count(*) from public.rate_events e where e.user_id = p_user and e.kind = p_kind and e.at > now() - p_window) >= p_max then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.rate_events (user_id, kind) values (p_user, p_kind);
  delete from public.rate_events where user_id = p_user and at < now() - interval '2 days';
end $$;

create function private.enqueue(p_to uuid, p_kind text, p_payload jsonb) returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.notification_queue (to_user, kind, payload) values (p_to, p_kind, coalesce(p_payload, '{}'::jsonb))
$$;

-- oeffentliche Sicht auf eine Person: nur ID, @Name, Wappenfarbe, Rang
create function private.pub_profile(p_id uuid) returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object('id', p.id, 'username', p.username, 'crest_color', p.crest_color, 'rank', coalesce(s.rank, 'Kreisliga'))
  from public.profiles p left join public.public_stats s on s.user_id = p.id where p.id = p_id
$$;

-- hat dieser Nutzer die Runde schon abgegeben? (Versiegelung)
create function private.has_played(p_duel uuid, p_round int, p_user uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.duel_results r where r.duel_id = p_duel and r.round = p_round and r.user_id = p_user)
$$;

create function private.is_duel_member(p_duel uuid, p_user uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.duels d where d.id = p_duel and p_user in (d.created_by, d.opponent))
$$;

create function private.duel_finished(p_duel uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.duels d where d.id = p_duel and d.status = 'finished')
$$;

-- Vorschlaege fuer einen vergebenen Namen (drei freie, gueltige)
create function private.suggest_names(p_base text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare base text := regexp_replace(left(p_base, 11), '[._]+$', ''); cands text[]; c text; out_ text[] := '{}'; i int := 0;
begin
  cands := array[base || '_' || (10 + floor(random() * 90))::int, base || (100 + floor(random() * 900))::int, base || '_xi', base || '.' || (10 + floor(random() * 90))::int,
                 base || (10 + floor(random() * 90))::int, base || '_' || (100 + floor(random() * 900))::int];
  foreach c in array cands loop
    exit when array_length(out_, 1) >= 3;
    if private.username_error(c) is null
       and not exists (select 1 from public.profiles p where p.username = c)
       and not exists (select 1 from public.username_history h where h.old_name = c and h.released_at > now() - make_interval(days => private.cfg('username_change_days')))
       and not (c = any (out_)) then out_ := out_ || c; end if;
  end loop;
  return to_jsonb(out_);
end $$;
