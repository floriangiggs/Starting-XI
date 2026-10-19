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
