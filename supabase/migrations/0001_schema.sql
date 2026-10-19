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
