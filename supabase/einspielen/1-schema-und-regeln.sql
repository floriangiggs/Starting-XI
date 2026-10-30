-- ===== migrations/0001_schema.sql =====
-- Starting XI – Datenbank (Stufe K1). Siehe docs/technik-konzept-konten.md, Abschnitte 5–10.
-- Grundsatz: Tabellen werden NUR über Funktionen (0003–0006) beschrieben; die App darf lesen, was die Zugriffsregeln (0002) erlauben.
-- Hilfsfunktionen liegen im Schema "private" (nicht über die API erreichbar).

create schema if not exists private;

-- Einstellbare Grenzen (Zahlen zentral, Technik-Konzept Abschnitt 6)
create table public.app_config (key text primary key, value integer not null);
insert into public.app_config (key, value) values
  ('max_friends', 200), ('max_outgoing_requests', 20), ('max_requests_per_day', 50), ('search_per_minute', 20),
  ('report_per_day', 10), ('username_change_days', 30), ('min_daily_seconds', 20), ('daily_days_back', 3),
  ('min_seconds_per_correct', 2), ('duel_deadline_hours', 48), ('duel_warn_hours', 6), ('max_open_duels', 30),
  ('create_duel_per_minute', 10), ('max_save_bytes', 2000000);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  crest_color text not null default '#7FE0A8' check (crest_color ~ '^#[0-9A-Fa-f]{6}$'),
  friend_code text not null,
  discoverable text not null default 'all' check (discoverable in ('all', 'code', 'none')),
  username_changed_at timestamptz,
  legacy_device_id text check (legacy_device_id is null or length(legacy_device_id) <= 64),
  created_at timestamptz not null default now(),
  constraint username_format check (username = lower(username) and username ~ '^[a-z0-9][a-z0-9._]{1,13}[a-z0-9]$')
);
create unique index profiles_username_key on public.profiles (username);
create unique index profiles_friend_code_key on public.profiles (friend_code);
create index profiles_legacy_idx on public.profiles (legacy_device_id) where legacy_device_id is not null;

-- alte Namen bleiben 30 Tage gesperrt (gegen Verwechslung)
create table public.username_history (
  old_name text not null, user_id uuid not null references public.profiles (id) on delete cascade, released_at timestamptz not null default now()
);
create index username_history_name_idx on public.username_history (old_name, released_at);

create table public.public_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  level int not null default 1 check (level between 1 and 100),
  rank text not null default 'Kreisliga' check (length(rank) between 1 and 30),
  campaign_stars int not null default 0 check (campaign_stars between 0 and 1000),
  trophies int not null default 0 check (trophies between 0 and 500),
  streak_current int not null default 0 check (streak_current between 0 and 10000),
  streak_best int not null default 0 check (streak_best between 0 and 10000),
  quote int check (quote between 0 and 100),
  lineups_played int not null default 0 check (lineups_played between 0 and 100000),
  updated_at timestamptz not null default now()
);

create table public.saves (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  data jsonb not null, version int not null default 1, device text check (device is null or length(device) <= 60),
  updated_at timestamptz not null default now()
);

create table public.friendships (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  requested_by uuid not null,
  created_at timestamptz not null default now(), accepted_at timestamptz,
  primary key (user_a, user_b),
  check (user_a < user_b), check (requested_by in (user_a, user_b))
);
create index friendships_b_idx on public.friendships (user_b);

create table public.blocks (
  blocker uuid not null references public.profiles (id) on delete cascade,
  blocked uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(), primary key (blocker, blocked), check (blocker <> blocked)
);

create table public.reports (
  id bigint generated always as identity primary key,
  reporter uuid not null references public.profiles (id) on delete cascade,
  target uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (length(reason) between 1 and 300),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);
create unique index reports_one_open_idx on public.reports (reporter, target) where status = 'open';

-- Aufstellungs-Katalog (nur IDs + Merkmale; Lösungen bleiben in der App – Stufe A, Technik-Konzept Abschnitt 11)
create table public.lineup_catalog (id text primary key, difficulty int not null check (difficulty between 1 and 5), league text, year int);
create table public.daily_lineups (day date primary key, lineup_id text not null);

create table public.daily_results (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null, lineup_id text not null,
  correct int not null check (correct between 0 and 11), seconds int not null check (seconds between 1 and 7200),
  created_at timestamptz not null default now(), primary key (user_id, day)
);

create table public.duels (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'quick' check (mode in ('quick', 'league')),
  rounds int not null check (rounds in (1, 3, 5)),
  seconds int not null check (seconds in (60, 120, 180, 300)),
  difficulty int not null default 0 check (difficulty between 0 and 5),
  created_by uuid not null references public.profiles (id) on delete cascade,
  opponent uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'finished', 'declined', 'cancelled', 'expired')),
  deadline timestamptz not null,
  warned boolean not null default false,
  result jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), finished_at timestamptz,
  check (created_by <> opponent)
);
create index duels_created_by_idx on public.duels (created_by, status);
create index duels_opponent_idx on public.duels (opponent, status);
create index duels_deadline_idx on public.duels (deadline) where status = 'open';

create table public.duel_rounds (
  duel_id uuid not null references public.duels (id) on delete cascade,
  round int not null check (round between 1 and 5), lineup_id text not null,
  chosen_by uuid references public.profiles (id) on delete set null,
  primary key (duel_id, round)
);

create table public.duel_results (
  duel_id uuid not null references public.duels (id) on delete cascade,
  round int not null, user_id uuid not null references public.profiles (id) on delete cascade,
  correct int not null check (correct between 0 and 11), seconds int not null check (seconds between 1 and 300),
  mask int check (mask between 0 and 2047), solved jsonb, left_app int not null default 0 check (left_app between 0 and 100),
  submitted_at timestamptz not null default now(),
  primary key (duel_id, round, user_id)
);

create table public.devices (
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null check (length(token) between 8 and 400), platform text not null check (platform in ('ios', 'android', 'web')),
  notify jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

-- Warteschlange fuer Push-Nachrichten (der Versand kommt in K6/8b als Server-Funktion; hier nur das Einreihen)
create table public.notification_queue (
  id bigint generated always as identity primary key,
  to_user uuid not null references public.profiles (id) on delete cascade, kind text not null, payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), sent_at timestamptz
);
create index notification_queue_open_idx on public.notification_queue (created_at) where sent_at is null;

create table public.rate_events (
  id bigint generated always as identity primary key, user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null, at timestamptz not null default now()
);
create index rate_events_idx on public.rate_events (user_id, kind, at);

create table public.name_rules (kind text not null check (kind in ('blocked', 'reserved', 'person')), word text not null, primary key (kind, word));

-- ===== migrations/0002_helpers.sql =====
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

-- ===== migrations/0003_rls.sql =====
-- Zugriffsregeln (Row Level Security). Die App darf NUR lesen (und nur, was hier erlaubt ist); geschrieben wird ausschliesslich ueber Funktionen.
alter table public.app_config enable row level security;
alter table public.profiles enable row level security;
alter table public.username_history enable row level security;
alter table public.public_stats enable row level security;
alter table public.saves enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.lineup_catalog enable row level security;
alter table public.daily_lineups enable row level security;
alter table public.daily_results enable row level security;
alter table public.duels enable row level security;
alter table public.duel_rounds enable row level security;
alter table public.duel_results enable row level security;
alter table public.devices enable row level security;
alter table public.notification_queue enable row level security;
alter table public.rate_events enable row level security;
alter table public.name_rules enable row level security;

-- Keine Regel = kein Zugriff: app_config, username_history, reports, notification_queue, rate_events, name_rules (nur service_role).
create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid());
create policy stats_self_or_friend on public.public_stats for select to authenticated using (user_id = auth.uid() or private.are_friends(auth.uid(), user_id));
create policy saves_self on public.saves for select to authenticated using (user_id = auth.uid());
create policy friendships_members on public.friendships for select to authenticated using (auth.uid() in (user_a, user_b));
create policy blocks_self on public.blocks for select to authenticated using (blocker = auth.uid());
create policy catalog_read on public.lineup_catalog for select to authenticated using (true);
create policy daily_lineups_read on public.daily_lineups for select to authenticated using (true);
create policy daily_self_or_friend on public.daily_results for select to authenticated using (user_id = auth.uid() or private.are_friends(auth.uid(), user_id));
create policy duels_members on public.duels for select to authenticated using (auth.uid() in (created_by, opponent));
create policy duel_rounds_members on public.duel_rounds for select to authenticated using (private.is_duel_member(duel_id, auth.uid()));
-- Versiegelung: eigene Ergebnisse immer; die des Gegners erst, wenn man die Runde selbst gespielt hat oder das Duell beendet ist
create policy duel_results_sealed on public.duel_results for select to authenticated using (
  user_id = auth.uid()
  or (private.is_duel_member(duel_id, auth.uid()) and (private.has_played(duel_id, round, auth.uid()) or private.duel_finished(duel_id))));
create policy devices_self on public.devices for select to authenticated using (user_id = auth.uid());

-- ===== migrations/0004_profile.sql =====
-- Konto-Profil: Username/Wappen, Sichtbarkeit, Geraete (Push), Konto loeschen, Moderation

-- Name anlegen oder aendern (Technik-Konzept Abschnitt 7). Erwartete Fehler kommen als {ok:false, error:...} zurueck.
create function public.claim_username(p_name text, p_crest text default null, p_legacy text default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := private.me(); v_name text := lower(btrim(coalesce(p_name, ''))); v_err text; v_row public.profiles;
  v_code text; v_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; tries int := 0; v_exists boolean;
begin
  if p_crest is not null and p_crest !~ '^#[0-9A-Fa-f]{6}$' then return jsonb_build_object('ok', false, 'error', 'crest'); end if;
  select * into v_row from public.profiles where id = v_uid;
  v_exists := found;
  if v_exists and v_row.username = v_name then  -- gleicher Name: nur Wappenfarbe aendern
    update public.profiles set crest_color = coalesce(p_crest, crest_color) where id = v_uid;
    return jsonb_build_object('ok', true, 'username', v_name);
  end if;
  if v_exists and v_row.username_changed_at is not null and v_row.username_changed_at > now() - make_interval(days => private.cfg('username_change_days')) then
    return jsonb_build_object('ok', false, 'error', 'too_soon', 'next_change_at', v_row.username_changed_at + make_interval(days => private.cfg('username_change_days')));
  end if;
  v_err := private.username_error(v_name);
  if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
  if exists (select 1 from public.profiles p where p.username = v_name and p.id <> v_uid)
     or exists (select 1 from public.username_history h where h.old_name = v_name and h.user_id <> v_uid and h.released_at > now() - make_interval(days => private.cfg('username_change_days'))) then
    return jsonb_build_object('ok', false, 'error', 'taken', 'suggestions', private.suggest_names(v_name));
  end if;
  begin
    if not v_exists then
      loop
        v_code := 'XI-' || (select string_agg(substr(v_alpha, 1 + floor(random() * length(v_alpha))::int, 1), '') from generate_series(1, 4));
        begin
          insert into public.profiles (id, username, crest_color, friend_code, legacy_device_id)
            values (v_uid, v_name, coalesce(p_crest, '#7FE0A8'), v_code, nullif(left(p_legacy, 64), ''));
          exit;
        exception when unique_violation then
          if exists (select 1 from public.profiles p where p.username = v_name) then raise; end if; -- Name weg -> aeussere Behandlung
          tries := tries + 1; if tries > 20 then raise; end if;       -- nur der Code kollidierte: neuen ziehen
        end;
      end loop;
      insert into public.public_stats (user_id) values (v_uid) on conflict do nothing;
    else
      insert into public.username_history (old_name, user_id) values (v_row.username, v_uid);
      update public.profiles set username = v_name, crest_color = coalesce(p_crest, crest_color), username_changed_at = now() where id = v_uid;
    end if;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'taken', 'suggestions', private.suggest_names(v_name));
  end;
  return jsonb_build_object('ok', true, 'username', v_name);
end $$;

create function public.my_profile() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select to_jsonb(p) - 'legacy_device_id' from public.profiles p where p.id = private.me()
$$;

create function public.set_discoverable(p_mode text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_mode not in ('all', 'code', 'none') then raise exception 'bad_mode' using errcode = 'P0001'; end if;
  update public.profiles set discoverable = p_mode where id = private.me();
  if not found then raise exception 'no_profile' using errcode = 'P0001'; end if;
end $$;

create function public.register_device(p_token text, p_platform text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me();
begin
  if not exists (select 1 from public.profiles where id = v) then raise exception 'no_profile' using errcode = 'P0001'; end if;
  -- ein Token gehoert immer nur einem Konto (Handy-/Kontowechsel)
  delete from public.devices where token = p_token and user_id <> v;
  insert into public.devices (user_id, token, platform) values (v, p_token, p_platform)
    on conflict (user_id, token) do update set platform = excluded.platform, updated_at = now();
end $$;

-- Benachrichtigungs-Schalter je Art (Technik-Konzept Abschnitt 12), gilt fuer alle Geraete des Kontos
create function public.set_notify(p_prefs jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if jsonb_typeof(p_prefs) <> 'object' or (select count(*) from jsonb_each(p_prefs) e where jsonb_typeof(e.value) <> 'boolean') > 0 then raise exception 'bad_prefs' using errcode = 'P0001'; end if;
  update public.devices set notify = p_prefs, updated_at = now() where user_id = private.me();
end $$;

create function public.unregister_device(p_token text) returns void language sql security definer set search_path = public, pg_temp as $$
  delete from public.devices where token = p_token and user_id = private.me()
$$;

-- Konto loeschen (Apple/Google-Pflicht). Das Widerrufen des Apple-Tokens macht in K2 eine Edge Function.
create function public.delete_account() returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid := private.me();
begin
  delete from auth.users where id = v;  -- Kaskade loescht Profil, Freunde, Duelle, Ergebnisse, Spielstand, Geraete
end $$;

-- Moderation (nur service_role): Name auf spieler_#### zuruecksetzen, Meldungen schliessen
create function public.admin_reset_username(p_user uuid) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_new text; v_old text;
begin
  select username into v_old from public.profiles where id = p_user;
  if v_old is null then raise exception 'no_profile' using errcode = 'P0001'; end if;
  loop
    v_new := 'spieler_' || lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from public.profiles where username = v_new);
  end loop;
  insert into public.username_history (old_name, user_id) values (v_old, p_user);
  update public.profiles set username = v_new, username_changed_at = null where id = p_user;
  update public.reports set status = 'actioned' where target = p_user and status = 'open';
  return v_new;
end $$;

-- ===== migrations/0005_friends.sql =====
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

-- ===== migrations/0006_daily_saves_stats.sql =====
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

-- ===== migrations/0007_duels.sql =====
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

-- ===== migrations/0008_grants.sql =====
-- Rechte: alles zu, dann gezielt oeffnen. Die App (Rolle authenticated) darf nur lesen und Funktionen aufrufen; Gaeste (anon) nichts.
revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on schema private from public, anon, authenticated;

grant select on public.profiles, public.public_stats, public.saves, public.friendships, public.blocks, public.lineup_catalog, public.daily_lineups,
  public.daily_results, public.duels, public.duel_rounds, public.duel_results, public.devices to authenticated;

-- Regeln (Policies) rufen diese Hilfsfunktionen im Namen des Nutzers auf
grant usage on schema private to authenticated;
grant execute on function private.are_friends(uuid, uuid), private.has_played(uuid, int, uuid), private.is_duel_member(uuid, uuid), private.duel_finished(uuid) to authenticated;

grant execute on function
  public.claim_username(text, text, text), public.my_profile(), public.set_discoverable(text), public.register_device(text, text), public.set_notify(jsonb), public.unregister_device(text),
  public.delete_account(),
  public.search_users(text), public.find_by_code(text), public.send_request(uuid), public.answer_request(uuid, boolean), public.remove_friend(uuid), public.block_user(uuid),
  public.unblock_user(uuid), public.report_user(uuid, text), public.friends_list(), public.incoming_requests(), public.outgoing_requests(), public.blocked_list(),
  public.friend_stats(uuid), public.match_legacy(text[]),
  public.get_save(), public.put_save(jsonb, int, text), public.put_public_stats(int, text, int, int, int, int, int, int), public.submit_daily(date, text, int, int), public.friends_daily(date),
  public.create_duel(uuid, int, int, int), public.submit_round(uuid, int, int, int, jsonb, int, int), public.decline_duel(uuid), public.cancel_duel(uuid), public.get_duel(uuid), public.list_duels()
  to authenticated;

-- nur der Server selbst (Zeitplaner, Moderation)
grant execute on function public.process_deadlines(), public.enqueue_deadline_warnings(), public.admin_reset_username(uuid) to service_role;

