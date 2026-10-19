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
