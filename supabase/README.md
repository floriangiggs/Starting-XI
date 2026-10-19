# supabase/ – Datenbank für Konten, Freunde und Duelle (Stufe K1)

Grundlage: `docs/technik-konzept-konten.md` (Abschnitte 5–10) und `docs/plan-store-release.md`.
Die App schreibt **nie direkt in Tabellen**. Sie ruft Funktionen auf, die Anmeldung, Grenzen und Regeln prüfen.
Lesen darf sie nur, was die Zugriffsregeln (RLS) erlauben.

## Inhalt

| Datei | Inhalt |
|---|---|
| `migrations/0001_schema.sql` | Tabellen, Konfig-Grenzen |
| `migrations/0002_helpers.sql` | Hilfsfunktionen (Schema `private`, nicht über die API erreichbar) |
| `migrations/0003_rls.sql` | Zugriffsregeln (inkl. Versiegelung der Duell-Ergebnisse) |
| `migrations/0004_profile.sql` | Username/Wappen, Sichtbarkeit, Geräte (Push), Konto löschen, Moderation |
| `migrations/0005_friends.sql` | Suche, Code, Anfragen, Blockieren, Melden, Freundesliste, Werte |
| `migrations/0006_daily_saves_stats.sql` | Spielstand mit Versionsprüfung, öffentliche Werte, Tages-Ergebnis |
| `migrations/0007_duels.sql` | Duell: anlegen, abgeben, versiegelt, beenden, Fristen |
| `migrations/0008_grants.sql` | Rechte: alles zu, dann gezielt öffnen |
| `seed.sql` | **erzeugt** von `tools/gen-supabase-seed.mjs` (Aufstellungs-Katalog, Tages-Plan, Namensregeln) |
| `tests/shim_supabase.sql` | nur für lokale Tests: bildet Rollen/`auth.uid()` nach |

## Tests (ohne Docker, ohne Supabase-Konto)

```bash
npm run test:db     # 187 Prüfungen gegen PGlite (Postgres im Projekt)
npm run gen:seed    # seed.sql neu erzeugen, wenn sich Aufstellungen/Tages-Plan in der App ändern
```

## Auf das echte Supabase-Projekt anwenden (macht Florian, Region Frankfurt)

1. Projekt anlegen, **Spend Cap eingeschaltet lassen**.
2. SQL Editor: `migrations/0001` bis `0008` der Reihe nach ausführen, danach `seed.sql`.
   (Mit der Supabase-CLI später: `supabase db push`.)
3. Zeitplaner einrichten (Dashboard → Database → Extensions → `pg_cron` aktivieren), dann im SQL Editor:
   ```sql
   select cron.schedule('duel-deadlines', '*/15 * * * *', $$select public.process_deadlines()$$);
   select cron.schedule('duel-warnings',  '*/30 * * * *', $$select public.enqueue_deadline_warnings()$$);
   ```
4. Geheime Schlüssel (service_role, Apple/Google/FCM) **nie** ins Repo – nur der öffentliche `anon key` gehört in die App.
5. Nach jeder Änderung an `tools/test-db.mjs`-relevanten Dateien zuerst den Test laufen lassen.

## Funktionen für die App (Rolle `authenticated`)

Fehler kommen als Meldung mit Code (z. B. `rate_limited`, `not_friends`). Erwartete Fälle bei Namen kommen als `{ok:false, error:…}`.

| Bereich | Funktionen |
|---|---|
| Profil | `claim_username(name, farbe, legacy_id)`, `my_profile()`, `set_discoverable(alle/code/none)`, `register_device(token, plattform)`, `unregister_device(token)`, `set_notify(prefs)`, `delete_account()` |
| Freunde | `search_users(prefix)`, `find_by_code(code)`, `send_request(user)`, `answer_request(user, ja)`, `remove_friend`, `block_user`, `unblock_user`, `report_user`, `friends_list()`, `incoming_requests()`, `outgoing_requests()`, `blocked_list()`, `friend_stats(user)`, `match_legacy(geraete_ids[])` |
| Spielstand/Werte | `get_save()`, `put_save(daten, erwartete_version, geraet)`, `put_public_stats(…)` |
| Tages-Challenge | `submit_daily(tag, aufstellung, richtige, sekunden)`, `friends_daily(tag)` |
| Duell | `create_duel(gegner, runden, sekunden, stufe)`, `submit_round(duell, runde, richtige, sekunden, loesungszeiten, maske, verlassen)`, `get_duel(id)`, `list_duels()`, `decline_duel`, `cancel_duel` |

Nur der Server (Rolle `service_role`): `process_deadlines()`, `enqueue_deadline_warnings()`, `admin_reset_username(user)`.

## Wichtige Entscheidungen

* **Versiegelung:** Das Ergebnis des Gegners einer Runde erscheint erst, wenn man sie selbst abgegeben hat oder das Duell beendet ist – in der Funktion **und** in der Tabellenregel.
* **Doppeltes Senden** ändert nichts (`recorded:false`). Je Duell wird nacheinander geschrieben (Zeilensperre), damit bei gleichzeitigem Senden das Ende nie übersehen wird.
* **Blockieren/Freund entfernen** beendet offene Duelle (`cancelled`), ohne Ergebnis.
* **Konto löschen** entfernt alles per Kaskade, auch die Duelle mit anderen (deren lokale Bilanz bleibt auf deren Gerät).
* **Plausibilität (Stufe A):** Wertebereiche, Mindestzeit (`min_seconds_per_correct`), Fristen, eine Abgabe je Runde/Tag. Die Lösungen liegen weiter in der App (siehe Technik-Konzept Abschnitt 11 für Ranked).
* **Push:** Hier nur das Einreihen (`notification_queue`); der Versand kommt in K6/8b.
