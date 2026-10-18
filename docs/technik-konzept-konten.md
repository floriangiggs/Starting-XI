# Technik-Konzept: Konten, Freunde, Online-Duell

Stand: 18.10.2026 · Grundlage für die Prompts zur Stufe „Accounts“ (Fahrplan Punkt 4)
und den Pflichtpunkt Duell aus CLAUDE.md. Optische Vorlage: `prototypes/kabine-freunde.html`.
Entscheidungen von Florian: Ideen-Speicher „Kabine & Freunde“ in `prompts_naechste_schritte.md`.

> Dieses Dokument ist ein Plan, kein Prompt. Jede Stufe in Abschnitt 15 wird ein
> eigener Prompt (mit Plan Mode). Rechtliche Punkte sind Hinweise, keine
> Rechtsberatung – vor dem Store-Release einmal prüfen lassen bzw. selbst prüfen.

---

## 1. Ziel und Abgrenzung

**Ziel:** Jeder kann wie heute ohne Konto spielen. Wer ein Konto anlegt, bekommt:
einen eindeutigen @Namen mit Wappen, Freunde (Anfragen, Code, QR, Link), die
Tages-Tabelle unter Freunden, den Vergleich, Duelle ohne Links (mit Push) und
seinen Spielstand auf allen Geräten.

**Nicht Teil dieser Stufe:** Ranked und internationale Zufallsgegner, Englisch,
Chat (bewusst nie), Töne, Monetarisierung. Das Datenmodell lässt Ranked aber zu
(Abschnitt 11).

## 2. Grundsätze

1. **Offline zuerst.** Einzelspieler (Kampagne, Freispiel, Tages-Challenge)
   funktioniert ohne Netz wie heute. Der Server ist nie Voraussetzung zum Spielen.
2. **Zuständigkeiten:** Das Gerät ist die Quelle für den Einzelspieler-Stand,
   der Server ist die Quelle für alles Soziale (Name, Freunde, Duelle,
   Tages-Tabelle) und hält eine Sicherung des Spielstands.
3. **Gastmodus bleibt.** Kein Zwang zum Konto, kein Aufdrängen. Hinweise nur in
   der Kabine, beim Freunde-Menü und beim Duell.
4. **So wenig Daten wie möglich.** Kein Klarname, keine E-Mail sichtbar, keine
   Standortdaten, keine Werbe-IDs. Bei „Mit Apple“ darf die E-Mail verborgen sein.
5. **EU-Hosting.** Datenbank in Frankfurt.
6. **Alles Schreibende über Server-Funktionen.** Die App schreibt nicht frei in
   Tabellen, sondern ruft Funktionen auf, die prüfen (Limits, Blockaden, Regeln).
7. **Nichts geht verloren, nichts zählt doppelt** (Pflichtpunkt 4 bei Prompt 8):
   jede Übertragung ist wiederholbar, ohne doppelt zu zählen (eindeutige Schlüssel).

## 3. Bausteine und Kosten

```
 ┌───────────────────────────┐        ┌──────────────────────────────────┐
 │ App (PWA, später          │  HTTPS │ Supabase (Region Frankfurt)       │
 │ Capacitor iOS/Android)    │◄──────►│ · Auth: Apple, Google             │
 │ · Spielstand lokal        │        │ · Postgres + Zugriffsregeln (RLS) │
 │ · Warteschlange offline   │        │ · Server-Funktionen (RPC, Edge)   │
 └────────────┬──────────────┘        │ · Zeitplaner (Fristen, Aufräumen) │
              │ Push                  └───────────────┬──────────────────┘
 ┌────────────▼──────────────┐                        │ sendet Push
 │ Firebase Cloud Messaging  │◄───────────────────────┘
 │ (Android direkt, iOS über │
 │ APNs)                     │        ┌──────────────────────────────────┐
 └───────────────────────────┘        │ Eigene Domain (z. B. Website)     │
                                      │ · Einladungslinks /f/… /d/…       │
                                      │ · .well-known (Universal/App Links)│
                                      │ · Datenschutz, Impressum, Löschen  │
                                      └──────────────────────────────────┘
```

| Baustein | Wofür | Kosten (Stand 18.10.2026) |
|---|---|---|
| Supabase Free | Entwicklung und Test (pausiert nach 1 Woche ohne Nutzung) | 0 € |
| Supabase Pro | ab Store-Start; 100.000 aktive Nutzer/Monat inkl., tägliche Backups | 25 $/Monat, darüber ca. 3,25 $ je 1.000 Nutzer |
| Firebase Cloud Messaging | Push | kostenlos |
| Apple Developer Program | „Mit Apple anmelden“, TestFlight, App Store | 99 $/Jahr |
| Google Play Console | Play Store | 25 $ einmalig |
| Domain | Einladungslinks, Rechtstexte | ca. 10–15 €/Jahr |

Budget ab Store-Start: **ca. 30–35 €/Monat**. Ausgabenlimit („Spend Cap“) in
Supabase eingeschaltet lassen.

**Warum Supabase:** Freundschaften, Duelle, Bilanzen und Tabellen sind
Beziehungsdaten – das passt zu Postgres. Zugriffsregeln liegen in der Datenbank,
Apple-/Google-Anmeldung ist eingebaut, Region Frankfurt wählbar, Schema als
SQL-Dateien im Repo versionierbar. Verworfen: Firebase/Firestore (Abfragen wie
„Bilanz gegen Freund“ oder Tabellen umständlich), Game Center/Play Games (iPhone
und Android getrennt, keine gemeinsame Freundesliste), eigener Server
(Betriebsaufwand für eine Person zu hoch).

## 4. Anmeldung

- **Zum Start nur „Mit Apple anmelden“ und „Mit Google anmelden“.** Kein
  Passwort, keine E-Mail-Bestätigung, nichts zu vergessen. Wer Google-Login
  anbietet, muss bei Apple zusätzlich eine gleichwertige datensparsame Option
  anbieten (E-Mail verbergbar, keine Werbe-Auswertung) – „Mit Apple“ erfüllt das.
- **PWA (vor Capacitor):** Anmeldung im Browser über Weiterleitung (OAuth) mit
  Supabase Auth. Dafür nötig: Apple Services-ID (setzt das bezahlte Apple-Konto
  voraus) und ein Google-OAuth-Client.
- **Native App (nach Prompt 8):** Anmeldung über die System-Dialoge (Capacitor-
  Plugins für Apple/Google), das erhaltene Token geht an Supabase
  (`signInWithIdToken`). Gleiches Konto wie in der PWA.
- **Sitzung:** Supabase hält die Sitzung (Erneuerung automatisch). Gespeichert
  in der App über Capacitor Preferences statt nur localStorage (iOS kann
  localStorage löschen).
- **Abmelden:** Sitzung beenden, lokaler Spielstand bleibt auf dem Gerät.
- **Konto löschen** (Pflicht bei Apple und Google): in Kabine → Einstellungen.
  Rückfrage mit Klartext, dann Server-Funktion `delete_account`: löscht
  Auth-Nutzer und alle Zeilen (Kaskade), widerruft bei Apple-Konten das Apple-
  Token (Apple verlangt das), Name wird frei. Zusätzlich eine Web-Seite
  „Konto löschen“ auf der Domain (Google Play verlangt einen Web-Weg).
- **Alter:** Beim Anlegen ein Häkchen „Ich bin mindestens 16 oder meine Eltern
  sind einverstanden“. Keine Altersabfrage mit Datum (Datensparsamkeit).

## 5. Datenmodell

Alle Tabellen mit Zugriffsregeln (RLS). Schreiben nur über Funktionen
(Abschnitt 6), Lesen wie angegeben. Schema als SQL-Dateien unter
`supabase/migrations/` im Repo.

| Tabelle | Inhalt | Wer liest |
|---|---|---|
| `profiles` | `id` (= Auth-Nutzer), `username` (eindeutig, ohne Groß/Klein), `crest_color`, `friend_code` (eindeutig, z. B. `XI-7K4P`), `discoverable` (`all` / `code` / `none`), `username_changed_at`, `created_at`, `legacy_device_id` | alle Angemeldeten: nur `username`, `crest_color`, Rang (über eine Ansicht) |
| `public_stats` | `user_id`, `level`, `rank`, `campaign_stars`, `trophies`, `streak_current`, `streak_best`, `quote`, `lineups_played`, `updated_at` | man selbst + bestätigte Freunde |
| `saves` | `user_id`, `data` (Spielstand als JSON), `version`, `updated_at`, `device` | nur man selbst |
| `friendships` | `user_a` < `user_b`, `status` (`pending` / `accepted`), `requested_by`, `created_at`, `accepted_at` | die beiden Beteiligten |
| `blocks` | `blocker`, `blocked`, `created_at` | nur der Blockierende |
| `reports` | `reporter`, `target`, `reason`, `created_at`, `status` | nur Admin (Florian im Supabase-Dashboard) |
| `daily_results` | `user_id`, `day`, `lineup_id`, `correct`, `seconds`, `created_at` (eindeutig je Nutzer + Tag) | man selbst + Freunde |
| `duels` | `id`, `mode` (`quick`, später `league`), `settings`, `created_by`, `opponent`, `status`, `deadline`, `created_at`, `updated_at` | die beiden Spieler |
| `duel_rounds` | `duel_id`, `round`, `lineup_id`, `chosen_by` | die beiden Spieler |
| `duel_results` | `duel_id`, `round`, `user_id`, `correct`, `seconds`, `solved` (Positionen), `submitted_at` (eindeutig je Duell + Runde + Nutzer) | Gegner erst, wenn er die Runde selbst gespielt hat |
| `devices` | `user_id`, `push_token`, `platform`, `notify` (Schalter je Art), `updated_at` | nur man selbst |
| `name_rules` | gesperrte Wörter/Namen (de/en), reservierte Namen | nur Server |

**Was Freunde sehen** (Entscheidung „alles“): `public_stats` + heutiges
`daily_results` + Duell-Bilanz untereinander. **Fremde** sehen nur @Name,
Wappen und Rang (bei Suche und Anfragen).

## 6. Freundschaften

Server-Funktionen (RPC), jede prüft Anmeldung, Blockaden und Limits:

| Funktion | Verhalten |
|---|---|
| `search_users(prefix)` | ab 3 Zeichen, nur `discoverable = all`, höchstens 10 Treffer, ohne Blockierte, begrenzt pro Minute |
| `find_by_code(code)` | findet auch bei `discoverable = code`; bei `none` kein Treffer |
| `send_request(user)` | legt `pending` an; hat der andere schon angefragt → sofort `accepted`; bei Blockade still „erledigt“ (der Blockierte merkt nichts) |
| `answer_request(user, yes/no)` | annehmen → `accepted`; ablehnen → Zeile löschen, keine Nachricht |
| `remove_friend(user)` | Zeile löschen, keine Nachricht |
| `block(user)` / `unblock(user)` | blockiert: Freundschaft und offene Anfragen/Duelle zwischen beiden enden |
| `report(user, reason)` | legt Meldung an (höchstens 1 offene je Paar) |

**Limits gegen Spam:** höchstens 200 Freunde, 20 offene ausgehende Anfragen,
50 neue Anfragen pro Tag. Zahlen zentral in einer Konfig-Tabelle.

**Hinzufügen-Wege** (wie Prototyp): Suche nach @Namen, Freundescode, QR-Code
(enthält den Einladungslink), Einladungslink `https://<domain>/f/<code>`,
„aus Duell-Gegnern“ (siehe Abschnitt 8, Übernahme).

## 7. Username und Moderation

- **Regel:** 3–15 Zeichen, `a–z`, `0–9`, `_` und `.`, nicht mit `.`/`_`
  beginnen oder enden, Groß/Klein egal (eindeutig über `citext`).
  *Hinweis:* Das heutige Duell-Handle (Prompt 39) erlaubt 3–20 Zeichen mit `.`
  und `_`. Damit alte Handles meist übernommen werden können, bleibt der Punkt
  erlaubt; Handles über 15 Zeichen bekommen beim Anmelden einen gekürzten
  Vorschlag. (Der Prototyp lässt den Punkt noch weg – beim Bauen angleichen.)
- **Prüfung beim Tippen** (App) und **endgültig auf dem Server**
  (`claim_username`): gesperrte Wörter mit Normalisierung (Umlaute, Ziffern als
  Buchstaben wie `4→a`, `3→e`, `0→o`), reservierte Namen (`admin`, `support`,
  `startingxi` …), Namen bekannter Spieler und Trainer aus den Aufstellungen
  (automatisch aus `LINEUP_CHALLENGES` erzeugt) gesperrt. Vergeben →
  drei Vorschläge.
- **Ändern:** alle 30 Tage; der alte Name bleibt 30 Tage gesperrt (gegen
  Verwechslung).
- **Melden:** landet in `reports`. Florian prüft im Supabase-Dashboard (später
  kleine Admin-Seite). Bei Verstoß setzt eine Funktion den Namen auf
  `spieler_<4 Ziffern>` zurück; der Nutzer wählt beim nächsten Öffnen neu.
- **Kein Chat**, keine freien Texte außer dem Namen. Später nur feste
  Reaktionen.

## 8. Spielstand in der Cloud und Übernahme

**Was hochgeht:** das bestehende `profile`-Objekt (`anstoss_profile`) ohne
gerätebezogene Teile (`drafts` bleibt lokal, `hasSeenInstallTip` usw. egal).
Dazu wird `public_stats` aus dem Profil berechnet und mitgeschrieben.

**Wann:** nach jedem `saveProfile()` mit Verzögerung (z. B. 15 s Ruhe), beim
Wechsel in den Hintergrund und beim Öffnen (Abgleich). Offline → Warteschlange,
später senden.

**Konflikte:** Jeder Stand trägt `version` und `updated_at`. Ist der Server
neuer als der zuletzt bekannte Stand des Geräts, wird zusammengeführt:

| Feld | Regel |
|---|---|
| `campaign.levelPassed`, `trophiesWon`, `achievements`, `perfectRewarded`, `worldCelebrated`, `stats.playedMatchIds` | Vereinigung |
| `campaign.stars`, `best[*].correct` | jeweils das Höhere |
| `campaign.solutionSeen` | Vereinigung (eingefrorene Sterne bleiben eingefroren) |
| `totalXP`, `level`, Zähler in `stats`, `streak.best` | jeweils das Höhere (nie addieren) |
| `daily` | Vereinigung je Tag; bei gleichem Tag das bessere Ergebnis |
| `streak.current` | aus dem vereinigten `daily` neu berechnen |
| `hintTokens` | das Höhere der beiden, **nicht** addieren (sonst Token-Vermehrung durch zwei Geräte) |
| `duels`, `duelStats` | ab Konto vom Server (Abschnitt 10); alte lokale Duelle bleiben als Verlauf |

**Erstes Anmelden:**
1. Server hat keinen Stand → lokaler Stand wird hochgeladen. Fertig.
2. Server hat einen Stand, Gerät hat keinen nennenswerten (frisch installiert)
   → Server-Stand wird geladen („Willkommen zurück, @name“).
3. Beide haben Fortschritt (z. B. auf dem zweiten Gerät als Gast gespielt) →
   zusammenführen nach den Regeln oben und vorher kurz zeigen, was dabei
   herauskommt („Level 12 · 64 Sterne · 9 Trophäen“).

**Übernahme alter Daten:** `profile.deviceId` (Prompt 25) wird als
`legacy_device_id` gespeichert. Damit können bisherige Duell-Gegner, die
später ebenfalls ein Konto anlegen, automatisch als „bekannt“ vorgeschlagen
werden („Lisa aus deinen Duellen ist jetzt @lisa_kickt – als Freund adden?“).
`duelName`/`duelHandle` werden zum Vorschlag für den Username.

## 9. Tages-Tabelle und Vergleich

- Nach dem Auswerten einer Tages-Challenge (angemeldet) wird
  `submit_daily(day, lineup_id, correct, seconds)` aufgerufen. Eindeutig je Tag
  – ein zweiter Versuch ändert nichts (wie heute: zählt nur der erste).
- **Tagesgrenze:** wie heute in der App (deutsche Zeit). Mit Englisch/
  international später neu entscheiden.
- **Kein Spoiler:** Die Tabelle zeigt nur Anzahl Richtige, Zeit und Serie,
  keine Namen der Lösung. Ergebnisse von Freunden sind deshalb auch vor dem
  eigenen Spielen sichtbar.
- **Vergleich:** liest `public_stats` beider + heutiges Ergebnis + Bilanz aus
  `duel_results`. Werte wie im Prototyp.
- **Plausibilität:** `correct` 0–11, `seconds` ≥ Mindestzeit (z. B. 20 s),
  `lineup_id` muss die Tages-Aufstellung des Tages sein.

## 10. Duell über den Server (ersetzt das Link-Kopieren)

Erfüllt die Pflichtpunkte 1, 2, 4 und 5 bei Prompt 8.

1. **Herausfordern:** aus Freundesliste, Vergleich oder Duell-Zentrale →
   `create_duel(opponent, settings)`. Der Server legt Duell und Runden an
   (Aufstellungen nach den Regeln aus Prompt 25/39: keine kürzlich gegen
   denselben Gegner gespielten), Push an den Gegner.
2. **Spielen:** App lädt die Runde, spielt wie heute, sendet
   `submit_round(duel_id, round, correct, seconds, solved)`. Eindeutiger
   Schlüssel → doppeltes Senden zählt nicht doppelt.
3. **Versiegelt:** Das Ergebnis des Gegners einer Runde wird erst geliefert,
   wenn man sie selbst gespielt hat (Regel in der Lese-Funktion).
4. **Ende:** Wenn beide alle Runden haben, setzt der Server `finished`,
   berechnet Sieger (Regeln aus Prompt 26) und schickt Push an beide. XP für
   Duelle vergibt weiterhin die App beim Anzeigen des Ergebnisses (einmal je
   Duell, Schlüssel `duel_id`).
5. **Fristen:** Zeitplaner prüft stündlich; nach Ablauf (z. B. 48 h) Sieg für
   den, der gespielt hat. Erinnerungs-Push 6 h vor Ablauf.
6. **Fehlerfälle:** offline → Ergebnis in Warteschlange, Hinweis „wird
   gesendet, sobald du online bist“; App neu installiert/Handywechsel → nach
   Anmeldung kommen alle Duelle vom Server; doppeltes Öffnen → Schlüssel.
7. **Codes/Links** bleiben nur als Notfall-Weg für Gäste.
8. **Liga-Duell** (Ping-Pong, Prompt 40) nutzt dieselben Tabellen mit
   `mode = league` und `chosen_by` je Runde – eigener späterer Prompt.

## 11. Schutz gegen Schummeln

Die Lösungen aller Aufstellungen stehen in der App-Datei und lassen sich
auslesen. Deshalb zwei Stufen:

- **Stufe A – Freunde, Tages-Tabelle, Freundes-Duelle (diese Stufe):**
  Vertrauen mit Plausibilitätsprüfungen auf dem Server (Wertebereiche,
  Mindestzeit, eine Abgabe je Runde/Tag, Limits pro Minute). Unter Freunden
  vertretbar; man spielt gegen Leute, die man kennt.
- **Stufe B – Ranked und Zufallsgegner (später):** Aufstellungen für Ranked
  liegen **nur auf dem Server**, nicht in der App. Die App bekommt beim Start
  nur Formation und Kontext, sendet die eingetippten Namen, eine Server-Funktion
  prüft sie (gleiche Logik wie `okFor`/Fuzzy-Abgleich der App, als geteiltes
  Modul) und misst die Zeit selbst (Start- und End-Zeitpunkt auf dem Server).
  Dazu Erkennung von App-Wechseln wie beim Fairplay im Duell.

## 12. Push-Nachrichten

- Android über FCM direkt, iOS über FCM → APNs. In der App das Capacitor-Plugin
  für Push; Token in `devices`, bei jedem Start aktualisiert.
- **Arten** (einzeln schaltbar in Kabine → Benachrichtigungen):
  Freundschaftsanfrage, Anfrage angenommen, neue Herausforderung, „Du bist dran“,
  Duell beendet, Frist läuft ab, Erinnerung Tages-Challenge (Uhrzeit wählbar,
  Standard aus).
- Erst fragen, wenn es Sinn ergibt (beim ersten Duell oder der ersten
  Anfrage), nicht beim ersten Start.
- Ruhezeit 22–8 Uhr: keine Push außer bei auslaufender Frist.
- Web-Push für die PWA hat keine Priorität (auf dem iPhone eingeschränkt).

## 13. Domain und Einladungslinks

- Eigene Domain (Name noch offen; vorher Markenrecherche wie bei Prompt 8,
  Punkt 7).
- Wege: `/f/<freundescode>` (Freund adden), `/d/<duel_id>` (Duell öffnen),
  `/loeschen` (Konto löschen per Web), `/datenschutz`, `/impressum`, `/regeln`.
- **Universal Links (iOS) und App Links (Android):** Dateien
  `/.well-known/apple-app-site-association` und `/.well-known/assetlinks.json`.
  Ohne installierte App → kleine Seite mit Store-Knöpfen und dem Code zum
  Abtippen.
- Hosting: GitHub Pages mit eigener Domain ist möglich; ob `.well-known` dort
  mit richtigem Dateityp ausgeliefert wird, im Plan prüfen (sonst Cloudflare
  Pages oder Netlify, beides kostenlos).

## 14. Datenschutz und Store-Pflichten

**Gespeichert wird:** Konto-ID des Anbieters (Apple/Google), ggf. E-Mail (bei
Apple evtl. verborgen), @Name, Wappenfarbe, Freundescode, Spielstand,
Tages-Ergebnisse, Duelle, Freundschaften, Blockaden, Meldungen, Push-Token.
Nicht gespeichert: Klarname im Profil, Standort, Kontakte, Werbe-IDs.

**Zu erledigen vor dem Store:**
- Datenschutzerklärung (Zweck, Rechtsgrundlage: Vertrag für das Konto,
  Einwilligung für Push; Auftragsverarbeiter Supabase und Google/Firebase;
  Speicherort EU; Löschung; Rechte; Kontakt).
- Auftragsverarbeitungsverträge (AVV) mit Supabase und Google abschließen
  (online im jeweiligen Dashboard).
- Impressum klären (Pflicht bei geschäftsmäßigen Angeboten; auch zur Adresse
  im Impressum informieren).
- Nutzungs- und Fairplay-Regeln (Namen, Melden, Sperren).
- Apple: „Mit Apple anmelden“ (als datensparsame Option neben Google), Konto löschen in der App inkl. Token-Widerruf,
  Melden/Blockieren für Nutzerinhalte, Datenschutz-Angaben im App Store,
  Support-Adresse.
- Google Play: Formular „Datensicherheit“, Konto löschen in der App **und** per
  Web-Link.
- Löschfristen: Konto löschen wirkt sofort; Backups laufen nach 7 Tagen aus.

## 15. Umsetzung in Stufen (je ein Prompt)

| Stufe | Inhalt | Voraussetzung |
|---|---|---|
| K1 | Supabase-Projekt anbinden, Schema + Zugriffsregeln + Funktionen als SQL im Repo, Tests der Regeln (z. B. mit Supabase-CLI lokal) | Florian: Supabase-Konto, Projekt in Frankfurt |
| K2 | Kabine (Menü am Logo) nach Prototyp, Anmelden in der PWA, Username + Wappen, Gastmodus, Abmelden, Konto löschen | K1; Apple Developer + Google-OAuth-Client |
| K3 | Spielstand in der Cloud, Zusammenführen, Übernahme alter Daten | K2 |
| K4 | Freunde: Liste, Anfragen, Suche, Code, QR, Einladungslink mit Web-Fallback, Blockieren, Melden | K2, Domain |
| K5 | „Heute unter Freunden“ + Vergleich + `public_stats` | K3, K4 |
| K6 | Duell über den Server (Schnell-Duell), Fristen, Notfall-Codes | K4 |
| K7 | Prompt 8 (Capacitor) + native Anmeldung + Push + Universal/App Links, Tests mit zwei Geräten und zwei Konten | K6 |
| K8 | Rechtstexte, Store-Formulare, Markenrecherche, Testphase (TestFlight / interner Test) | K7 |
| später | Liga-Duell, Ranked servergeprüft (Abschnitt 11 Stufe B), Englisch, Töne | nach Store-Start |

**Was Florian selbst erledigen muss** (Claude kann das nicht für ihn):
Supabase-Konto anlegen, Apple Developer Program (99 $/Jahr), Google Play
Console (25 $), Google-Cloud-Projekt für den OAuth-Client, Domain kaufen,
AVV abschließen, Rechtstexte freigeben. Zugangsschlüssel nie ins Repo – nur
der öffentliche „anon key“ darf in die App.

## 16. Risiken

| Risiko | Gegenmittel |
|---|---|
| Schummeln über ausgelesene Lösungen | Stufe A Plausibilität; Ranked nur servergeprüft (Stufe B) |
| Datenverlust beim Zusammenführen | nur zusammenführen, nie überschreiben; vor dem ersten Abgleich lokale Sicherung (wie „Spielstand sichern“) |
| Token-Vermehrung über zwei Geräte | Token nie addieren, immer das Höhere |
| Unangemessene Namen | Filter + Melden + Zurücksetzen |
| Spam-Anfragen | Limits, Blockieren, `discoverable` |
| Kosten laufen weg | Ausgabenlimit an, Supabase-Nutzung im Dashboard beobachten |
| Supabase fällt aus | Einzelspieler läuft offline weiter, Warteschlange sendet später |
| Single-File-App wird zu groß | Server-Code getrennt in `supabase/`; in der App ein klar abgegrenzter Block „ONLINE“ |

## 17. Offene Punkte für Florian

1. Name der Domain (nach Markenrecherche).
2. Punkt im Username erlauben? (Vorschlag: ja, wegen alter Duell-Handles.)
3. Impressum: welche Adresse (eigene oder Dienstleister)?
4. Wann das Apple-Konto kaufen? (Nötig ab Stufe K2 für „Mit Apple“ – auch
   schon zum Testen.)
5. Standard für die Tages-Erinnerung: aus (Vorschlag) oder an?
