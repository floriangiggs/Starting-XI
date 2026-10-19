-- Freundschaften, Suche, Blockieren, Melden (Technik-Konzept Abschnitt 6)

create function public.search_users(p_prefix text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); q text := lower(btrim(coalesce(p_prefix, '')));
begin
  if not exists (select 1 from public.profiles where id = v) then raise exception 'no_profile' using errcode = 'P0001'; end if;
  if length(q) < 3 then raise exception 'too_short' using errcode = 'P0001'; end if;
  perform private.rate_check(v, 'search', private.cfg('search_per_minute'), interval '1 minute');
  q := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
  return coalesce((select jsonb_agg(private.pub_profile(x.id)) from (
    select p.id from public.profiles p
    where p.username like q || '%' and p.discoverable = 'all' and p.id <> v and not private.blocked_between(v, p.id)
    order by p.username limit 10) x), '[]'::jsonb);
end $$;

create function public.find_by_code(p_code text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); c text := upper(btrim(coalesce(p_code, ''))); r uuid;
begin
  if not exists (select 1 from public.profiles where id = v) then raise exception 'no_profile' using errcode = 'P0001'; end if;
  perform private.rate_check(v, 'search', private.cfg('search_per_minute'), interval '1 minute');
  select p.id into r from public.profiles p where p.friend_code = c and p.discoverable <> 'none' and p.id <> v and not private.blocked_between(v, p.id);
  return case when r is null then null else private.pub_profile(r) end;
end $$;

-- 'sent' | 'accepted' | 'already_friends' | 'already_sent'. Wer blockiert wurde, merkt nichts ('sent', aber nichts passiert).
create function public.send_request(p_user uuid) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); a uuid := least(v, p_user); b uuid := greatest(v, p_user); f public.friendships;
begin
  if v = p_user then raise exception 'self' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = v) then raise exception 'no_profile' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then return 'sent'; end if;      -- unbekannt = wie "gesendet" (kein Abtasten von IDs)
  if exists (select 1 from public.blocks where blocker = v and blocked = p_user) then raise exception 'you_blocked_user' using errcode = 'P0001'; end if;
  if exists (select 1 from public.blocks where blocker = p_user and blocked = v) then return 'sent'; end if;
  select * into f from public.friendships where user_a = a and user_b = b;
  if found then
    if f.status = 'accepted' then return 'already_friends'; end if;
    if f.requested_by = v then return 'already_sent'; end if;
    update public.friendships set status = 'accepted', accepted_at = now() where user_a = a and user_b = b;  -- gegenseitig angefragt: sofort befreundet
    perform private.enqueue(p_user, 'friend_accepted', jsonb_build_object('user', private.pub_profile(v)));
    return 'accepted';
  end if;
  perform private.rate_check(v, 'friend_request', private.cfg('max_requests_per_day'), interval '1 day');
  if (select count(*) from public.friendships x where (x.user_a = v or x.user_b = v) and x.status = 'accepted') >= private.cfg('max_friends') then raise exception 'friend_limit' using errcode = 'P0001'; end if;
  if (select count(*) from public.friendships x where x.requested_by = v and x.status = 'pending') >= private.cfg('max_outgoing_requests') then raise exception 'too_many_requests' using errcode = 'P0001'; end if;
  insert into public.friendships (user_a, user_b, status, requested_by) values (a, b, 'pending', v);
  perform private.enqueue(p_user, 'friend_request', jsonb_build_object('user', private.pub_profile(v)));
  return 'sent';
end $$;

create function public.answer_request(p_user uuid, p_yes boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me(); a uuid := least(v, p_user); b uuid := greatest(v, p_user);
begin
  if not exists (select 1 from public.friendships where user_a = a and user_b = b and status = 'pending' and requested_by = p_user) then raise exception 'no_request' using errcode = 'P0001'; end if;
  if p_yes then
    if (select count(*) from public.friendships x where (x.user_a = v or x.user_b = v) and x.status = 'accepted') >= private.cfg('max_friends') then raise exception 'friend_limit' using errcode = 'P0001'; end if;
    update public.friendships set status = 'accepted', accepted_at = now() where user_a = a and user_b = b;
    perform private.enqueue(p_user, 'friend_accepted', jsonb_build_object('user', private.pub_profile(v)));
  else
    delete from public.friendships where user_a = a and user_b = b;  -- ablehnen: keine Nachricht
  end if;
end $$;

-- offene Duelle zwischen zwei Leuten sauber beenden (kein Haengenbleiben, Technik-Konzept F7)
create function private.cancel_duels_between(a uuid, b uuid) returns void language sql security definer set search_path = public, pg_temp as $$
  update public.duels set status = 'cancelled', updated_at = now(), finished_at = now()
  where status = 'open' and ((created_by = a and opponent = b) or (created_by = b and opponent = a))
$$;

create function public.remove_friend(p_user uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me();
begin
  delete from public.friendships where user_a = least(v, p_user) and user_b = greatest(v, p_user);
  perform private.cancel_duels_between(v, p_user);
end $$;

create function public.block_user(p_user uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me();
begin
  if v = p_user then raise exception 'self' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then return; end if;
  insert into public.blocks (blocker, blocked) values (v, p_user) on conflict do nothing;
  delete from public.friendships where user_a = least(v, p_user) and user_b = greatest(v, p_user);
  perform private.cancel_duels_between(v, p_user);
end $$;

create function public.unblock_user(p_user uuid) returns void language sql security definer set search_path = public, pg_temp as $$
  delete from public.blocks where blocker = private.me() and blocked = p_user
$$;

create function public.report_user(p_target uuid, p_reason text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me();
begin
  if v = p_target or not exists (select 1 from public.profiles where id = p_target) then raise exception 'bad_target' using errcode = 'P0001'; end if;
  perform private.rate_check(v, 'report', private.cfg('report_per_day'), interval '1 day');
  insert into public.reports (reporter, target, reason) values (v, p_target, left(btrim(coalesce(p_reason, '')), 300)) on conflict do nothing;
end $$;

create function public.friends_list() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(private.pub_profile(case when f.user_a = private.me() then f.user_b else f.user_a end) || jsonb_build_object('since', f.accepted_at) order by f.accepted_at), '[]'::jsonb)
  from public.friendships f where f.status = 'accepted' and private.me() in (f.user_a, f.user_b)
$$;

create function public.incoming_requests() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(private.pub_profile(f.requested_by) || jsonb_build_object('at', f.created_at) order by f.created_at), '[]'::jsonb)
  from public.friendships f where f.status = 'pending' and f.requested_by <> private.me() and private.me() in (f.user_a, f.user_b)
$$;

create function public.outgoing_requests() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(private.pub_profile(case when f.user_a = private.me() then f.user_b else f.user_a end) || jsonb_build_object('at', f.created_at) order by f.created_at), '[]'::jsonb)
  from public.friendships f where f.status = 'pending' and f.requested_by = private.me()
$$;

create function public.blocked_list() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(private.pub_profile(k.blocked) order by k.created_at), '[]'::jsonb) from public.blocks k where k.blocker = private.me()
$$;

-- Werte eines Freundes (oder von mir selbst)
create function public.friend_stats(p_user uuid) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := private.me();
begin
  if p_user <> v and not private.are_friends(v, p_user) then raise exception 'not_friends' using errcode = 'P0001'; end if;
  return (select to_jsonb(s) || jsonb_build_object('profile', private.pub_profile(p_user)) from public.public_stats s where s.user_id = p_user);
end $$;

-- Bisherige Duell-Gegner (aus dem Spielstand der App: Geraete-IDs) als bekannte Konten vorschlagen (Technik-Konzept Abschnitt 8)
create function public.match_legacy(p_device_ids text[]) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me();
begin
  if coalesce(array_length(p_device_ids, 1), 0) > 100 then raise exception 'too_many' using errcode = 'P0001'; end if;
  return coalesce((select jsonb_agg(private.pub_profile(p.id)) from public.profiles p
    where p.legacy_device_id = any (p_device_ids) and p.id <> v and p.discoverable <> 'none' and not private.blocked_between(v, p.id)), '[]'::jsonb);
end $$;
