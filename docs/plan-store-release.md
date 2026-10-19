# Plan: Store-Release (Prompt 8 + Pflichtpunkt Duell)

Stand: 19.10.2026 · Ergänzt `docs/technik-konzept-konten.md` (Technik, Datenmodell, Kosten) um
**Reihenfolge, Abnahme-Tests, Entscheidungen und fertige Prompt-Texte**. Das ist ein Plan, kein Prompt.
Rechtliche Punkte und Store-Regeln sind meine Kenntnis, keine Rechtsberatung – vor dem Einreichen
gegen die aktuellen Store-Richtlinien prüfen.

---

## 1. Ziel in einem Satz

Zwei Menschen mit zwei Handys (iPhone und Android, jeweils eigenes Konto) fordern sich zum Duell heraus,
spielen zeitversetzt, sehen danach dasselbe Ergebnis – ohne einen Link oder Code zu kopieren – und bekommen
Push-Nachrichten dazu. Einzelspieler läuft weiter komplett offline. Alles ist vor dem Einreichen mit echten
Geräten getestet.

## 2. Was schon steht (nicht noch einmal bauen)

| Baustein | Stand |
|---|---|
| Duell offline per Link (Format v2, Handle, 1/2/3/5 Min, Maske + Lösungszeiten) | fertig (Prompt 25/26/39), bleibt als **Notfall-Weg für Gäste** |
| Duell-Oberfläche im Taktiktafel-Stil (Zentrale, Einladung, Walkout, Rundenende, Abpfiff) | fertig (Prompt 54) |
| Fehlerfall-Bausteine: Ergebnis sofort gespeichert, Duell fortsetzen nach Neustart, XP nur einmal je Duell | fertig (Prompt 54) |
| Spielstand sichern/laden per Code | fertig (Prompt 32) → ersetzt den Export/Import-Teil aus Prompt 8 |
| Töne mit Haken `haptic()` und Stummschalter-Modus | fertig (Prompt 55) |
| App-Icon, Manifest, Service Worker | fertig (Prompt 56) |
| Datenmodell, RLS, Funktionen, Fristen, Push-Arten | geplant (`technik-konzept-konten.md`) |
| Kabine/Freunde-Optik | Prototyp `prototypes/kabine-freunde.html` freigegeben |

**Zurückgestellte Prompts, die hier aufgehen:** 28 („Ergebnis kommt sicher an“) und 29 („Zwischenstand
nach jeder Runde“) werden **nicht** mehr offline gebaut, sondern in Stufe K6 über den Server gelöst.
Prompt 40 (Liga-Duell/Ranked) bleibt Spezifikation für nach dem Start (siehe Entscheidung E1).

## 3. Reihenfolge und Abhängigkeiten

```
 Florian (parallel, ab sofort)           Claude (Prompts)
 ────────────────────────────           ───────────────────────────────────────────────
 Domain-Name + Markenrecherche   ──►    8a  Capacitor-Vorbereitung (www/, index.html, Umleitung)
 Supabase-Konto (Frankfurt)      ──►    K1  Schema + Regeln + Funktionen + Regeltests
 Apple Developer (99 $) +        ──►    K2  Kabine, Anmelden (PWA), Name + Wappen, Konto löschen
 Google-OAuth-Client                    K3  Spielstand in der Cloud + Zusammenführen
 Domain gekauft, Hosting mit            K4  Freunde (Suche, Code, QR, Link, Blockieren, Melden)
 .well-known                            K5  „Heute unter Freunden“ + Vergleich
 Firebase-Projekt (Push)         ──►    K6  Duell über den Server (Pflichtpunkte 1, 2*, 4, 5)
 Google Play Console (25 $)      ──►    8b  Capacitor iOS + Android, native Anmeldung, Push,
                                            Universal/App Links, Haptik (Pflichtpunkt 2, 3)
 Rechtstexte freigeben           ──►    K8  Store-Formulare, Rechtliches, Testphase
```

\* Push-Nachrichten im Duell hängen technisch an 8b (nativ); K6 liefert Server-Seite und die Einstellungen.

Die Nummern K1–K8 bleiben wie im Technik-Konzept; **K7 heißt hier 8b**, weil es dasselbe ist wie der
zweite Teil von Prompt 8. Geschätzte Größe je Stufe (Arbeitssitzungen mit Tests): 8a 1 · K1 2 · K2 2 · K3 2 ·
K4 2 · K5 1 · K6 3 · 8b 3 · K8 2. Dazu Wartezeiten, die ich nicht beschleunigen kann (Abschnitt 8).

## 4. Zwei Stolperfallen, die den Plan bestimmen

**Falle 1 – Der Speicher zieht nicht mit um.** `localStorage` gehört zu einer Adresse. Wer heute unter
`floriangiggs.github.io/Starting-XI/…` spielt, hat dort seinen Stand. Eine eigene Domain und später die
native App (`capacitor://localhost`) sind **jeweils ein neuer, leerer Speicher**.
→ Jeder bestehende Tester muss seinen Stand mitnehmen können. Wege, in dieser Reihenfolge:
(1) Konto + Cloud-Spielstand (K3) – automatisch beim ersten Anmelden;
(2) „Spielstand sichern/laden“ (gibt es schon);
(3) **Umzugs-Hinweis** auf der alten Adresse: sobald die neue Domain steht, zeigt die alte Seite ein Banner
„Wir sind umgezogen – Spielstand mitnehmen“ mit Sichern-Knopf und Link. Das baue ich in 8a mit ein.
Test: Spielstand vom alten Ort über Code und über Konto auf neue Adresse und in die native App laden.

**Falle 2 – Datei umbenennen bricht Links.** `startelf_check.html` → `index.html` ändert die Adresse aller
bisher verschickten Duell-Links und den Service-Worker-Bereich. → In 8a bleibt `startelf_check.html` als
kleine Umleitungsseite bestehen (nimmt `#duel=`/`#duelr=` mit), bis die Domain-Umstellung abgeschlossen ist.
`APP_URL`/`duelBaseUrl()` zeigen danach auf die Domain.

## 5. Die Pflichtpunkte aus Prompt 8 – wo sie gelöst werden und wie sie abgenommen werden

| # | Pflichtpunkt | gelöst in | Abnahme (Pass/Fail) |
|---|---|---|---|
| 1 | Automatischer Ergebnis-Abgleich über Konten | K6 | Matrix D1–D9 (Abschnitt 6) auf zwei echten Geräten |
| 2 | Push bei Herausforderung und Ergebnis | K6 (Server) + 8b (nativ) | P1–P6: Push kommt bei Herausforderung, „Du bist dran“, Ergebnis, Frist-Warnung; ein-/ausschaltbar; Ruhezeit |
| 3 | Universal Links / App Links | 8b | L1–L5: Link in Nachricht öffnet App direkt; ohne App → Seite mit Store-Knöpfen + Code; Link zu gelöschtem/fremdem Duell → freundliche Meldung |
| 4 | Fehlerfälle sauber | K6 + 8b | F1–F10 (Abschnitt 6) |
| 5 | „Code einfügen“ nur noch Notfall | K6 | Menüpunkt wandert in Kabine → „Duell per Code (Gast)“; Gäste ohne Konto spielen weiter wie heute |
| 6 | Quizduell-Ablauf (Wechsel-Runden, Kategorie-Wahl) | **nach dem Start** (Liga-Duell, Prompt 40) – siehe E1 | – |
| 7 | Markenrecherche + Impressum/Datenschutz | K8 (Recherche **vorab**, Abschnitt 8) | schriftliches Ergebnis im Repo `docs/` |

## 6. Duell-Abnahme-Matrix (K6 + 8b)

Jeder Test läuft zuerst automatisiert gegen die lokale Supabase (Playwright mit zwei Browser-Kontexten =
zwei Konten, Zeit per Test-Hook gerafft), danach einmal von Hand auf **iPhone + Android**.

**Normalablauf**
- D1 Freund herausfordern (Best of 1/3/5, 1/2/3/5 Min, Stufe) → erscheint beim Gegner ohne Link, Push kommt.
- D2 Gegner nimmt an, spielt seine Runden (Walkout → Runde → Rundenende) → Herausforderer bekommt Push.
- D3 Beide sehen **dasselbe** Ergebnis (Sieger, Rundenstand, Richtige, Zeiten je Runde, Begründung).
- D4 Versiegelung: Ergebnis des Gegners einer Runde ist erst sichtbar, wenn man sie selbst gespielt hat
  (auch per Server-Abfrage direkt – Regel liegt im Server, nicht in der App).
- D5 XP/Trophäen/Bilanz genau **einmal** je Duell, auf beiden Geräten.
- D6 Revanche aus dem Abpfiff legt ein neues Duell an.
- D7 Duell löschen/aufräumen ändert die Bilanz nicht (wie heute).
- D8 Duell gegen Gast (ohne Konto) per Link/Code funktioniert weiter wie heute.
- D9 Bo3/Bo5: Zwischenstand nach jeder Runde (aus Prompt 29), Sieg vorzeitig entschieden → Rest entfällt.

**Fehlerfälle**
- F1 Gegner offline beim Absenden → Ergebnis in Warteschlange, Hinweis, später automatisch gesendet, **nicht doppelt**.
- F2 Beide senden gleichzeitig / dasselbe Ergebnis zweimal → Server nimmt eines (eindeutiger Schlüssel).
- F3 App mitten in der Runde schließen → Runde zählt als aufgegeben (wie heute), Server kennt den Stand.
- F4 App neu installiert / Handywechsel → nach Anmeldung kommen alle Duelle und der Spielstand zurück.
- F5 Zwei Geräte desselben Kontos gleichzeitig → dieselbe Runde lässt sich nur einmal abgeben.
- F6 Frist läuft ab (Test-Hook) → Sieg für den, der gespielt hat; Push; Erinnerung vorher.
- F7 Freundschaft endet/blockiert mitten im Duell → Duell endet sauber, kein Hängenbleiben.
- F8 Uhr am Handy falsch gestellt → Zeiten und Fristen zählen nach Serverzeit.
- F9 Keine Verbindung beim Start → Einzelspieler normal, Duell-Bereich zeigt Offline-Hinweis.
- F10 Server-Fehler (Test: Funktion wirft Fehler) → verständliche Meldung, nichts geht verloren, Wiederholen möglich.

**Schutz (Stufe A)**: ungültige Werte (Richtige > 11, Zeit unter Mindestzeit, Runde doppelt, fremdes Duell) werden
vom Server abgelehnt – eigene Regeltests in K1/K6.

## 7. Entscheidungen, die ich von dir brauche

| | Frage | Empfehlung |
|---|---|---|
| **E1** | Store-Version 1.0 **ohne** Liga-Duell und Ranked (nur Schnell-Duell + Freunde)? Pflichtpunkt 6 wäre dann Version 1.1. | **Ja.** Liga-Duell braucht Kategorie-Pool (je ~20 Aufstellungen), Ping-Pong-Logik, Fristen je Zug und eine eigene Optik – das verdoppelt K6. Ein stabiles Schnell-Duell zuerst. |
| **E2** | Domain: Name? Erst Markenrecherche (DPMA + EUIPO, kostenlos) zu „Starting XI“ und Modus-Begriffen. | Recherche **jetzt** machen, vor Domain und vor Apple-Konto. Ergebnis entscheidet über den App-Namen im Store. |
| **E3** | Punkt im Username erlauben (alte Duell-Handles)? | Ja, wie im Technik-Konzept. |
| **E4** | Impressum: eigene Adresse oder Dienstleister? | Vor K8 klären (Zustelladresse nötig). |
| **E5** | Zuerst nur iPhone oder gleich Android mit? | Beides: Capacitor erzeugt beides aus demselben Code. Android-Test ist billig, Pflicht laut Prompt 8. |
| **E6** | Mindest-iOS / Mindest-Android | iOS 16+, Android 8+ (Web-Audio, Safe-Areas, Push). |
| **E7** | App-ID | Vorschlag `de.startingxi.app` (nur sinnvoll, wenn die Domain `startingxi.de` o. ä. wird – sonst die echte Domain umgekehrt). **Nie mehr änderbar** nach Veröffentlichung. |
| **E8** | Gastmodus im Store: Duell nur mit Konto, Gäste behalten den Notfall-Code? | Ja – Apple akzeptiert Gastmodus; Konto nur für Online-Funktionen. |
| **E10** | Wann Einnahmen (Werbung/Käufe)? Nach Store-Start (Version 1.x) oder gar nicht? | Nach dem Start, schrittweise (Fahrplan Punkt 3). Hängt an der Checkliste in Abschnitt 8a. |
| **E9** | Altersfreigabe / Zielgruppe: ab 12? Für unter 16: Einwilligung der Eltern (Häkchen)? | Häkchen wie im Technik-Konzept; Store-Fragebogen später ehrlich ausfüllen. |

## 8. Was du selbst erledigen musst – mit Vorlaufzeit

| Wann | Was | Dauer/Kosten |
|---|---|---|
| **Jetzt** | Markenrecherche (E2) | ½ Tag |
| **Jetzt** | Supabase-Konto, Projekt **Frankfurt**, Ausgabenlimit an | 15 Min, 0 € (Free) |
| **Vor K2** | Apple Developer Program (Privatperson oder Firma – Firma braucht D-U-N-S-Nummer, dauert bis zu Wochen) | 99 $/Jahr, Freischaltung Stunden bis Tage |
| **Vor K2** | Google-Cloud-Projekt + OAuth-Client | 1 Stunde |
| **Vor K4** | Domain kaufen, Hosting für `.well-known` (GitHub Pages mit eigener Domain oder Cloudflare Pages) | 10–15 €/Jahr |
| **Vor K6** | Firebase-Projekt (Push), Apple-Push-Schlüssel (APNs) im Apple-Konto erzeugen | 1 Stunde |
| **Vor 8b** | Google Play Console | 25 $ einmalig |
| **Vor K8** | Datenschutzerklärung freigeben, AVV mit Supabase und Google abschließen, Impressum | 1–2 Tage |
| **K8** | **Google Play – neue private Entwicklerkonten brauchen vor der Veröffentlichung einen geschlossenen Test mit einer Mindestzahl Tester über 14 Tage** (Stand meiner Kenntnis: 12 Tester – vor Start prüfen). Tester früh sammeln (Freunde, Kollegen). | 14 Tage Wartezeit |
| **K8** | Apple-Prüfung (App Review) | meist 1–3 Tage, bei Ablehnung Nachbesserung |

Zugangsschlüssel (Service-Role, APNs-Schlüssel, Google-Secrets) **nie** ins Repo und nicht in den Chat –
ich nutze nur den öffentlichen `anon key`; geheime Werte trägst du selbst im Supabase-/Firebase-Dashboard ein.

## 8a. Checkliste: Hobby oder Gewerbe, Händlerstatus, Impressum

Hinweise, keine Rechtsberatung. Vor dem Einreichen einmal mit Finanzamt, IHK-Gründungsberatung oder Steuerberater bestätigen.
**Die Entscheidung fällt vor K8**, weil der Händlerstatus bei Apple und Google schon beim Einreichen angegeben werden muss.

| Frage | Antwort / Folge |
|---|---|
| Soll die App Geld bringen (Werbung, Käufe, Abos) – jetzt oder später? | **Nein, dauerhaft kostenlos ohne Einnahmen:** meist Hobby, kein Gewerbe nötig. **Ja, geplant:** Gewerbe und Finanzamt klären, bevor die erste Einnahme entsteht (nicht erst danach). |
| Gewerbe anmelden | Beim Gewerbeamt der Gemeinde (kleine Gebühr). Danach schickt das Finanzamt den „Fragebogen zur steuerlichen Erfassung“. Zeitpunkt: **vor dem Live-Gang von Werbung/Käufen.** |
| Kleinunternehmerregelung | Bei kleinen Umsätzen möglich (keine Umsatzsteuer ausweisen). Im Fragebogen angeben, Steuerberater fragen, ob sie passt. |
| Händlerstatus (Trader) bei Apple/Google | Wer gewerblich handelt, ist „Händler“: Name, Adresse, Telefon und E-Mail werden im Store öffentlich angezeigt. Rein kostenlose Hobby-App: eventuell „kein Händler“. Ehrlich angeben, im Zweifel Händler. |
| Apple Developer Program | Als **Privatperson** möglich, Firma/Gewerbe nicht nötig. Firmenkonto braucht D-U-N-S-Nummer (dauert länger). |
| Impressum | Pflicht für geschäftsmäßige Angebote. Praktisch immer anlegen, da der Store eine Support-Adresse verlangt. Zustellfähige Adresse nötig (E4: eigene Adresse oder Impressums-Dienstleister). |
| Datenschutzerklärung | Pflicht für Konten, Push, Server (K8), unabhängig von Gewerbe. |
| Werbung später | Werbeanbieter bringen eigene Pflichten (Einwilligungsabfrage, Datenschutz-Angaben in den Stores). Eigener Prompt nach dem Store-Start, **nicht** Teil von 1.0. |

**Reihenfolge für dich:** (1) Einnahmeplan festlegen (E10), (2) Gewerbeamt/Finanzamt oder Steuerberater fragen,
(3) Händlerstatus und Impressumsadresse festlegen (E4), (4) Apple/Google-Konto entsprechend anlegen, (5) K8 starten.

## 9. Store-Risiken und Gegenmittel

| Risiko | Gegenmittel |
|---|---|
| **Apple 4.2 „nur eine Webseite im Rahmen“** (häufiger Ablehnungsgrund bei Capacitor/PWA) | Nativer Mehrwert zeigen: Push, Haptik, Anmelden mit Apple, Offline-Spiel, Teilen-Dialog. In den Review-Notizen erklären. |
| **Apple 4.8** Anmeldedienste | „Mit Apple“ ist neben Google angeboten ✔ |
| **Apple 5.1.1(v)** Konto löschen in der App | K2: Löschen inkl. Token-Widerruf |
| **Apple 1.2** nutzergenerierte Inhalte (Namen) | Filter + Melden + Blockieren (K2/K4); Support-Adresse |
| Apple Datenschutz-Angaben + Privacy-Manifest | K8: Fragebogen aus dem Datenmodell ableiten; Manifest prüfen |
| Google „Datensicherheit“, Konto löschen per Web | K8 + Seite `/loeschen` |
| Universal/App Links funktionieren nicht | `.well-known` mit richtigem Dateityp prüfen (Technik-Konzept Abschnitt 13), Test L1–L5 |
| iOS löscht `localStorage` der Web-App | Capacitor Preferences statt nur `localStorage`; Cloud-Spielstand |
| Single-File-App wird zu groß | Server-Code getrennt in `supabase/`; in der App ein Block „ONLINE“ |
| Schummeln über ausgelesene Lösungen (Stufe A) | Plausibilitätsprüfung im Server; Ranked später nur servergeprüft |
| Kosten | Supabase Pro ab Store-Start ~25 $/Monat, Ausgabenlimit an |

## 10. Qualitäts-Tore (nichts geht in die nächste Stufe, bevor das grün ist)

1. Alle bestehenden Skripte aus `tools/` grün (Duell, Namen, XP, Überlappung, Safe-Area, Geräte, Ton).
2. Neue Regeltests der Datenbank (K1) grün – inklusive „fremder Nutzer sieht fremde Daten nicht“.
3. Zwei-Konten-Playwright-Lauf gegen die lokale Supabase (ab K4, voll ab K6).
4. Handtest auf echten Geräten laut Matrix (ab 8b), Ergebnis als Tabelle im Repo (`docs/test-protokoll-*.md`).
5. Nach jeder Stufe: Stand pushen, `CACHE_NAME` erhöhen, Status-Tabelle pflegen.

---

## 11. Die Prompts (zum Kopieren; jeder beginnt mit „Lies CLAUDE.md. Plan Mode …“)

### Prompt 8a – Capacitor-Vorbereitung (ohne Plattformen)

```
Lies CLAUDE.md und docs/plan-store-release.md (Abschnitt 4). Plan Mode, Plan zeigen.
1. Web-Dateien nach www/ verschieben, startelf_check.html → index.html. Alle Verweise anpassen
   (Manifest, Service Worker, Icons, CLAUDE.md, Hook, tools/*.mjs, prompts-Datei-Hinweise).
2. Auf der alten Adresse eine kleine startelf_check.html als Umleitung (nimmt #duel=/#duelr= mit)
   und – sobald APP_URL auf die neue Domain zeigt – das Umzugs-Banner „Spielstand mitnehmen“
   mit Sichern-Knopf (nutzt bestehendes Sichern/Laden).
3. package.json + capacitor.config.json anlegen (App-ID aus E7, noch nicht festlegen), Capacitor
   als Dev-Abhängigkeit, noch KEINE Plattform hinzufügen.
4. Speicher: Profil über eine kleine Schicht lesen/schreiben (localStorage jetzt, später Capacitor
   Preferences), ohne Verhalten zu ändern.
5. Tests: alle tools/-Skripte, Offline-Start, alter Duell-Link über die Umleitung, Installation als PWA.
Kein Commit/Push ohne Zeigen der Testausgabe.
```

### Prompt K1 – Server: Schema, Regeln, Funktionen

```
Lies CLAUDE.md und docs/technik-konzept-konten.md (Abschnitte 5–7, 9–10). Plan Mode.
Ordner supabase/ im Repo: migrations/*.sql (Tabellen aus Abschnitt 5, RLS, Funktionen aus 6/7/9/10
inkl. create_duel, submit_round mit eindeutigem Schlüssel, Versiegelung, Fristen-Zeitplaner),
seed/ (name_rules aus LINEUP_CHALLENGES), tests/ (pgTAP oder SQL-Skripte).
Test-Pflicht: fremder Nutzer sieht nichts Fremdes; Gegner-Ergebnis erst nach eigener Runde;
doppeltes submit_round zählt nicht doppelt; Limits; Blockieren beendet Duelle; Plausibilität
(Richtige 0–11, Mindestzeit, Runde nur einmal). Lokal mit Supabase-CLI laufen lassen.
Keine Schlüssel ins Repo. Ich lege das Supabase-Projekt (Frankfurt) an und trage Secrets selbst ein.
```

### Prompt K2 – Kabine, Anmelden, Name, Konto löschen

```
Lies CLAUDE.md, docs/technik-konzept-konten.md (Abschnitt 4, 7) und prototypes/kabine-freunde.html
(Fassung v2, Optik 1:1). Plan Mode. Block „ONLINE“ in der App getrennt vom Rest.
Kabine am Logo, Gast-Kopf mit „Mit Apple / Google anmelden“ (Supabase Auth, OAuth im Browser),
Username + Wappenfarbe (Prüfung beim Tippen + endgültig im Server, 3 Vorschläge), Abmelden,
Konto löschen (Rückfrage, delete_account), Alterhäkchen. Gastmodus bleibt unverändert.
Tests: Zwei-Konten-Playwright gegen lokale Supabase, Offline-Start ohne Konto, Konto löschen
entfernt alle Zeilen. Optik-Check 393×852 und 375×667, Safe-Area-Skript erweitern.
```

### Prompt K3 – Spielstand in der Cloud

```
Lies CLAUDE.md und Technik-Konzept Abschnitt 8. Plan Mode.
Hochladen nach saveProfile (15 s Ruhe, Hintergrund, Öffnen), Warteschlange offline, Zusammenführen
nach der Tabelle (Token nie addieren), Erstes-Anmelden-Fälle 1–3 mit Vorschau „Level · Sterne ·
Trophäen“, vorher automatische lokale Sicherung (Sichern-Code). Übernahme legacy_device_id.
Tests: tools/test-merge.mjs mit allen Feldregeln, Zwei-Geräte-Szenario (Token-Vermehrung unmöglich),
alter Spielstand aus dem Git-Stand lädt fehlerfrei, Umzug alte Adresse → Domain → Konto.
```

### Prompt K4 – Freunde

```
Lies CLAUDE.md, Technik-Konzept Abschnitt 6, prototypes/kabine-freunde.html. Plan Mode.
Freundesliste, Anfragen, Suche (ab 3 Zeichen), Code, QR (Bibliothek lokal einbinden, keine
externe Quelle), Einladungslink /f/<code> mit Web-Fallback, Blockieren, Melden, „aus Duell-
Gegnern“ (legacy_device_id). Limits laut Konfig-Tabelle. Tests: Spam-Limits, Blockade still,
Gegenseitige Anfrage = sofort befreundet, Datenschutz (Fremde sehen nur @Name, Wappen, Rang).
```

### Prompt K5 – Heute unter Freunden + Vergleich

```
Lies CLAUDE.md, Technik-Konzept Abschnitt 9. Plan Mode.
submit_daily nach dem Auswerten (eindeutig je Tag, Plausibilität), Tabelle „Heute unter Freunden“
ohne Spoiler, Vergleich nach Prototyp, public_stats aus dem Profil. Tests: zweiter Versuch ändert
nichts, Freund ohne Freundschaft sieht nichts, Offline-Warteschlange.
```

### Prompt K6 – Duell über den Server

```
Lies CLAUDE.md, Technik-Konzept Abschnitt 10, docs/plan-store-release.md Abschnitt 5–6 und die
Prompts 28/29 (Anforderungen gelten jetzt über den Server). Plan Mode.
Herausfordern aus Freundesliste/Vergleich/Zentrale, create_duel/submit_round/Versiegelung/Ende/
Fristen, Zwischenstand nach jeder Runde, Offline-Warteschlange, Duell-Zentrale liest vom Server
(Gäste behalten die Link-Variante, „Code einfügen“ nur als Notfall in der Kabine), Benachrichtigungs-
Einstellungen (Server-Seite + Schalter), Revanche, XP genau einmal je Duell (Schlüssel duel_id).
Abnahme: Matrix D1–D9 und F1–F10 automatisiert mit zwei Konten gegen lokale Supabase (Test-Hook
für Zeit/Fristen), Ergebnis als Tabelle zeigen. Optik: Taktiktafel-Stil wie Prompt 54.
```

### Prompt 8b – Capacitor iOS + Android, Push, Links, Haptik

```
Lies CLAUDE.md und docs/plan-store-release.md. Plan Mode. Voraussetzungen: K1–K6 erledigt, Konten
und Schlüssel von Florian vorhanden. Plattformen hinzufügen, App-ID aus E7, Icons/Splash aus
icons/, Safe-Areas und Statusleiste, Anmelden mit Apple/Google nativ (signInWithIdToken),
Sitzung in Capacitor Preferences, Push (FCM/APNs, Token in devices, Ruhezeit 22–8 Uhr, Erlaubnis
erst beim ersten Duell/Anfrage), Universal Links + App Links (.well-known, Fallback-Seite mit
Store-Knöpfen und Code), haptic() mit Capacitor Haptics füllen, audioSession/Stummschalter prüfen,
Zurück-Taste Android. Abnahme: Tests P1–P6, L1–L5, F1–F10 auf iPhone + Android mit zwei Konten;
Protokoll in docs/test-protokoll-8b.md.
```

### Prompt K8 – Rechtliches, Store-Formulare, Testphase

```
Lies CLAUDE.md, Technik-Konzept Abschnitt 14 und plan-store-release.md Abschnitt 8–9. Plan Mode.
Seiten /datenschutz /impressum /regeln /loeschen (Domain), Datenschutz-Angaben für Apple und
Google aus dem Datenmodell ableiten (Tabelle), Privacy-Manifest prüfen, Screenshots (393×852 usw.),
Store-Texte, Review-Notizen (Argumente gegen 4.2), TestFlight + geschlossener Android-Test,
Checkliste Review-Ablehnungsgründe. Markenrecherche-Ergebnis (E2) einarbeiten. Ich reiche selbst ein.
```

---

## 12. Nächster Schritt

1. Du entscheidest E1–E9 (am wichtigsten E1, E2, E7).
2. Du startest **parallel** die Dinge aus Abschnitt 8 mit langer Vorlaufzeit (Markenrecherche, Supabase,
   Apple Developer, Domain).
3. Ich beginne mit **8a**, sobald E2/E7 grob stehen – oder, wenn du schneller sichtbaren Fortschritt
   willst, mit **K1** (läuft ohne Domain und ohne Apple-Konto).
