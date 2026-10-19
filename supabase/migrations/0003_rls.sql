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
