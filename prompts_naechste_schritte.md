# Starting XI – Prompts für die nächsten Schritte

Diese Prompts sind fertig zum Einfügen in Claude Code. **Einen nach dem
anderen**, in der angegebenen Reihenfolge – erst den nächsten, wenn der
vorige umgesetzt, getestet und committet ist.

| # | Thema | Voraussetzung |
|---|---|---|
| 1 | Zoom auf dem iPhone entfernen | – |
| 2 | Überschneidungen der Namensfelder + Positions-Panel | – |
| 3 | Namensvarianten, Aliase, Sonderzeichen | 2 |
| 4 | Tippfehler-Toleranz „Fast richtig“ + Korrigieren | 2, 3 |
| 5 | Datenrecherche Rückennummer + Nationalität | – (vor 6 sinnvoll) |
| 6 | Scout-Rad + einheitliche Währung | 2, 5 (zumindest teilweise) |
| 7 | *Später:* PWA-Nacharbeit (Fonts lokal, Update-Strategie) | – |
| 8 | *Später:* Vorbereitung Capacitor | 7 |

**Wichtig nach jeder Änderung:** Der Service Worker liefert die App aus dem
Cache. Jeder Prompt erhöht deshalb `CACHE_NAME` in `sw.js` – sonst sieht die
installierte App auf dem iPhone die Änderung nicht. Auf dem iPhone danach die
App einmal komplett schließen und neu öffnen.

**Befundgrundlage:** Die Ursachen in Prompt 1–3 wurden vorab im Code geprüft
und die Überschneidungen per `getBoundingClientRect` bei 360/375/430 px
Viewport gemessen (Stand Commit `ffb697b`).

---

## Prompt 1 – Zoom entfernen (iPhone)

```
Lies CLAUDE.md. Problem: In der installierten PWA auf dem iPhone zoomt die
Ansicht ungewollt, v. a. beim Antippen der Namensfelder auf dem Spielfeld.

Ursachenanalyse (bereits geprüft):
- .pos-input hat font-size: clamp(10.5px, 3vw, 14px) → auf Handys ca. 11–13px.
  iOS Safari zoomt automatisch auf fokussierte Inputs mit font-size < 16px.
- Kein touch-action gesetzt → Doppeltipp-Zoom ist aktiv.
- Viewport-Meta ist aktuell: width=device-width, initial-scale=1.0

Umsetzung:
1. Viewport-Meta erweitern auf:
   width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover
   (maximum-scale=1 unterbindet den Auto-Zoom beim Input-Fokus auf iOS,
   ohne die Schriftgröße der Felder auf 16px anheben zu müssen – das würde
   die Überschneidungen auf dem Spielfeld verschlimmern).
2. Global touch-action: manipulation auf html/body sowie Buttons und Inputs
   setzen, um den Doppeltipp-Zoom zu deaktivieren.
3. -webkit-text-size-adjust: 100% auf html setzen.
4. KEIN JavaScript-Blocken von Pinch-Gesten (gesturestart o. ä.) – nur die
   drei Punkte oben.
5. In sw.js CACHE_NAME um eins erhöhen.

Test: Im Browser mit Mobile-Emulation (375px und 360px) prüfen, dass Fokus
auf ein .pos-input keinen Zoom auslöst und das Layout sonst unverändert ist.
Zeig mir den Diff, bevor du committest.
```

---

## Prompt 2 – Überschneidungen der Namensfelder + Positions-Panel

```
Lies CLAUDE.md. Das ist eine strukturelle Änderung → zuerst Plan Mode, Plan
zeigen, auf mein OK warten.

Problem: Auf dem Spielfeld überlappen sich die Positions-Slots (.pos-slot)
bei allen Formationen, am stärksten auf 360px-Geräten. Gemessen mit
getBoundingClientRect bei 375px Viewport: Slot ca. 58×80px.
Überlappungen u. a.:
- Alle Viererketten: TW/RIV und TW/LIV (TW y:90 vs. IV y:76)
- 3-5-2 / 3-4-2-1: TW/ZIV fast deckungsgleich (ZIV y:80), RIV/ZIV/LIV
  nur 15% Abstand
- 4-3-3, 4-5-1, 3-5-2, 5-3-2: RZM/ZM/LZM nur 14–18% Abstand
- 5-4-1 / 5-3-2: RIV/ZIV/LIV
- 4-1-4-1: ZDM überlappt mit RIV, LIV, RZM und LZM
- Bei 360px zusätzlich RV/RIV, RIV/LIV, RZM/LZM, RST/LST

Ursachen:
1. Slot zu hoch: .pos-label + .pos-input + .pos-actions (💡/🔍-Buttons)
   + .hint-text stehen in jedem Slot untereinander.
2. Slot-Breite clamp(58px, 15.5vw, 82px) skaliert mit dem Viewport statt
   mit dem Spielfeld; die 58px-Untergrenze ist auf schmalen Geräten zu breit.
3. Koordinaten in PITCH_LAYOUTS teils zu eng.

Lösungsansatz (bitte im Plan bewerten/verfeinern):
a) Slots kompakter machen: .pos-actions (💡/🔍) und .hint-text aus den
   einzelnen .pos-slot entfernen. Stattdessen ein einziges "Positions-Panel"
   unterhalb des Spielfelds einführen, das sich auf die aktuell ausgewählte
   Position bezieht (Auswahl per Fokus/Tap auf ein .pos-input; aktiver Slot
   optisch hervorgehoben, z. B. Gold-Rahmen).
   - Das Panel zeigt vorerst die BESTEHENDEN Aktionen (💡 Anfangsbuchstabe,
     🔍 Scout-Token) und den Hinweistext – Funktion, Kosten und XP-Logik
     bleiben 1:1 erhalten (hintsUsed, tokenRevealed, awardXP, evaluatePitch).
   - Das Panel so kapseln (eigene Render-Funktion, z. B.
     renderPositionPanel(abbr)), dass das Tipp-System später komplett
     ausgetauscht werden kann, ohne Spielfeld-Code anzufassen.
   - Das Tipp-System wird separat überarbeitet (Prompt 6) – hier bitte KEINE
     neuen Tipp-Arten oder Kostenmodelle einführen.
b) Slot-Breite relativ zum Spielfeld: .pitch als Container
   (container-type: inline-size) und Breite in cqw, z. B.
   clamp(52px, 17cqw, 82px) – Wert im Plan begründen.
c) PITCH_LAYOUTS nachjustieren, wo nach a) und b) noch Überlappungen
   bleiben (v. a. TW nach unten/IVs nach oben, zentrale Dreier- und
   Fünferreihen breiter). Taktische Anordnung muss erkennbar bleiben.
   Formationsnamen und Positionskürzel NICHT ändern (LINEUP_CHALLENGES
   referenziert sie).
d) Lange Nachnamen (z. B. "Schweinsteiger") im Input nicht abschneiden:
   text-overflow prüfen, ggf. Schrift bei Überlänge leicht verkleinern.

Absicherung:
- Ein Node-Skript tools/check-overlap.mjs mit Playwright anlegen, das jede
  Formation aus PITCH_LAYOUTS bei 360, 375 und 430px Breite rendert
  (currentMatch setzen, renderPitch() aufrufen) und alle .pos-slot-Paare
  per getBoundingClientRect auf Überlappung prüft. Ziel: 0 Überlappungen.
- Hook check-lineups läuft nach der PITCH_LAYOUTS-Änderung – Ergebnis zeigen.
- sw.js CACHE_NAME um eins erhöhen.
- Vorher/Nachher-Screenshots von 4-3-3, 3-4-2-1 und 5-3-2 bei 360px zeigen.
```

---

## Prompt 3 – Namensvarianten, Aliase, Sonderzeichen

```
Lies CLAUDE.md. Änderung an Datenmodell + Eingabelogik → Plan Mode, Plan
zeigen, auf OK warten.

Problem: Spieler sind teils unter anderem Namen bekannt, als in players
gespeichert (z. B. "Fabián Ruiz" → bekannt/Trikot "Fabián"; "Lautaro
Martínez" → "Lautaro" oder "Martínez"; "D. Silva" → "Silva"/"David Silva").
Außerdem schlägt normalizeName() bei ð, þ, æ fehl (Island-Aufstellung:
Sigurðsson, Guðmundsson, Böðvarsson, Sigþórsson, Sævarsson sind mit normaler
Tastatur nicht lösbar).

1. normalizeName() erweitern:
   - Sonderzeichen vor NFD: ð→d, þ→th, æ→ae, ø→o, œ→oe, ł→l, đ→d, ı→i
   - Umlaute: ä/ae→a, ö/oe→o, ü/ue→u, ß→ss, sodass "Mueller", "Muller"
     und "Müller" exakt gleich normalisiert werden.
     Achtung: gegen alle Namen in LINEUP_CHALLENGES prüfen, ob dadurch
     zwei Namen EINER Aufstellung identisch werden oder echte "ue"-Namen
     kaputtgehen – Ergebnis zeigen.
   - Bindestriche wie Leerzeichen behandeln ("Kim Min Jae" = "Kim Min-Jae").

2. Datenmodell (abwärtskompatibel)
   - players bleibt unverändert und ist der ANZEIGENAME (wird bei
     "richtig"/Aufdecken angezeigt).
   - Neues optionales Feld pro Challenge:
     aliases: { LZM: ["Fabián", "Ruiz"], ST: ["Lautaro", "Martínez"] }
   - Neue Funktion acceptedNames(challenge, abbr) liefert: Anzeigename +
     aliases[abbr] + automatisch abgeleitete Varianten:
     a) Initial-Namen "D. Silva" → zusätzlich "Silva"
     b) Eingabe "Vorname Nachname" wird akzeptiert, wenn die letzten
        Wörter exakt einem akzeptierten Namen entsprechen und höchstens
        ein Wort davorsteht ("Thomas Müller", "David Silva",
        "Lautaro Martinez").

3. Auflösung von Mehrdeutigkeit
   - Eigene Position: Eingabe ist richtig, wenn sie einem der
     acceptedNames der EIGENEN Position entspricht – auch wenn derselbe
     Name bei einer anderen Position ebenfalls passt ("Martínez" im TW-Feld
     = Emiliano, im ST-Feld = Lautaro; siehe Copa-América-Finale 2021).
   - Cross-Match: nur, wenn die Eingabe zu GENAU EINER anderen, noch
     offenen Position passt. Bei mehreren Treffern kein automatisches
     Einsortieren.
   - Live-Prüfung und evaluatePitch nutzen dieselbe Funktion
     isAcceptedFor(challenge, abbr, input) – keine doppelte Logik.
   - Beim Richtig-Werden wird das Feld mit dem Anzeigenamen befüllt.

4. Aliase befüllen
   - Alle Namen in LINEUP_CHALLENGES durchgehen und für Spieler, die
     bekanntermaßen anders gerufen werden oder mehrteilige Namen haben,
     eine Alias-Liste VORSCHLAGEN (Tabelle: Challenge-id, Position,
     Anzeigename, vorgeschlagene Aliase, Begründung/Quelle, z. B.
     Trikotname). Sicher betroffen u. a.: Fabián Ruiz, Lautaro Martínez,
     Lisandro Martínez, D. Silva, G. Sigurðsson, Bryan Gil, Óliver
     Torres, João Neves, Nuno Mendes, Kim Min-Jae, Junior Díaz,
     Bouba Diop, Heuer Fernandes, Filipe Luís.
   - Erst nach meinem OK eintragen. Aliase, die innerhalb derselben
     Aufstellung auch zu einem ANDEREN Spieler passen, in der Tabelle
     markieren.

5. Hook check-lineups erweitern: aliases-Keys müssen zu Positionen der
   Formation passen, Aliase nicht leer, Warnung bei Alias-Kollision
   innerhalb einer Aufstellung.

6. Tests: "Fabian" im LZM-Feld (Spanien EM 2024) → richtig;
   "Martinez" im ST-Feld (Copa 2021) → Lautaro richtig; "Martinez" im
   TW-Feld → Emiliano richtig; "Martinez" in einem falschen Feld → KEIN
   Cross-Match (mehrdeutig); "Sigurdsson" im LIV-Feld (Island) → richtig;
   "Silva" im RZM-Feld (Man City 2017) → richtig; "Mueller"/"Muller" für
   einen "Müller" → richtig.

7. sw.js CACHE_NAME um eins erhöhen.
```

---

## Prompt 4 – Tippfehler-Toleranz „Fast richtig“

```
Lies CLAUDE.md. Größere Änderung an der Eingabe-Logik → Plan Mode, Plan
zeigen, auf OK warten. Voraussetzung: Positions-Panel (Prompt 2) und
acceptedNames/isAcceptedFor inkl. erweiterter normalizeName (Prompt 3).

Ziel: Bei fast korrekt geschriebenen Namen ein "Fast richtig"-Signal geben
und eine Korrektur anbieten.

1. Distanzfunktion
   - Neue Funktion damerauLevenshtein(a, b) (Optimal String Alignment,
     Transposition zweier benachbarter Zeichen = 1), ohne Libraries.
   - Vergleich immer auf normalizeName()-Ergebnissen, gegen ALLE
     acceptedNames der eigenen Position (kleinste Distanz zählt).
   - Toleranz über zentrale Konstante:
     const FUZZY = { maxDist: len => len <= 4 ? 0 : len <= 8 ? 1 : 2,
                     debounceMs: 800, correctedXP: 10 };
     (len = Länge des normalisierten Zielnamens)

2. Wann geprüft wird
   - Exakte Prüfung (grün) und Cross-Match bleiben unverändert live im
     "input"-Event.
   - Die Fuzzy-Prüfung läuft NUR bei "blur", Enter (keydown) oder nach
     FUZZY.debounceMs ohne weitere Eingabe – nie während des Tippens.
   - Fuzzy nur gegen die EIGENE Position; Cross-Match bleibt exakt
     (verhindert, dass man durch Ausprobieren Namen erraten kann).
   - Keine Fuzzy-Prüfung, wenn die Position bereits ok/revealed/prefilled ist.

3. Darstellung
   - Neue CSS-Klasse .pos-input.near: Gold/Bernstein-Rahmen und -Hintergrund
     (CI-Gold, KEIN Rot), kleines ✏️-Symbol.
   - Im Positions-Panel bei Auswahl dieser Position: "Fast richtig – prüf
     die Schreibweise" + Button "✏️ Korrigieren".
   - Sobald der Nutzer weitertippt, .near entfernen und neu prüfen.

4. "Korrigieren"
   - Trägt die korrekte Schreibweise (Anzeigename) ein, Feld wird .ok,
     zählt als richtig.
   - XP: FUZZY.correctedXP (10) statt 15; mit vorher genutztem Hinweis 5.
   - Korrigierte Positionen in einem Set fuzzyCorrected sammeln;
     "Perfekt" (isPerfect in evaluatePitch) erfordert zusätzlich
     fuzzyCorrected.size === 0. Auf dem Ergebnisbildschirm Hinweis
     "(1 × korrigiert)" analog zu "(mit Hinweisen)".
   - Zählt nicht als Hinweis (hintsUsed bleibt unberührt).
   - Neuer Zähler profile.stats.positionsCorrectFuzzy.

5. evaluatePitch
   - Felder, die nur .near sind (nicht korrigiert), zählen als falsch –
     unveränderte Bewertungslogik.

6. Tests
   - Testskript mit Namenspaaren: Schwiensteiger→Schweinsteiger (fast),
     Lewandoski→Lewandowski (fast), Kane vs. Kahn (NICHT fast),
     Müler→Müller (fast), Schweinste→Schweinsteiger (nicht fast).
   - Gegen alle Namen in LINEUP_CHALLENGES prüfen: gibt es innerhalb einer
     Aufstellung zwei Namen, die sich nach dieser Toleranz zu ähnlich sind?
     Liste ausgeben.

7. Anleitung (GUIDE_SECTIONS) um einen kurzen Eintrag ergänzen,
   sw.js CACHE_NAME um eins erhöhen.
```

---

## Prompt 5 – Datenrecherche Rückennummer + Nationalität

```
Lies CLAUDE.md – Datengenauigkeit hat oberste Priorität.

Aufgabe: Für die Aufstellungen in LINEUP_CHALLENGES das optionale Feld
details ergänzen:
  details: { TW: { nr: 1, nat: "DE" }, RV: { nr: 2, nat: "FR" }, ... }
- nr = Rückennummer IN DIESEM SPIEL (nicht die "übliche" Nummer des Spielers)
- nat = Nationalität als ISO-3166-Alpha-2-Code (England/Schottland/Wales/
  Nordirland: "GB-ENG", "GB-SCT", "GB-WLS", "GB-NIR").
- Bei Nationalmannschaftsspielen (league ist "Weltmeisterschaft",
  "Europameisterschaft" oder "Copa America") nat weglassen, nur nr.
- Zusätzlich source: "<URL>" mit der Hauptquelle ergänzen.

Regeln:
- Nur mit verlässlicher Quelle (kicker.de, weltfussball.de, fussballdaten.de,
  offizielle Spielberichte von Verein/Verband/UEFA/FIFA). Rückennummern
  direkt aus dem Spielbericht dieses Spiels übernehmen.
- Nichts aus dem Gedächtnis ergänzen. Ist ein Wert nicht sicher belegbar,
  das Feld für diesen Spieler weglassen – das Scout-Rad blendet es dann aus.
- Stimmt ein Spielername oder eine Position in der Quelle NICHT mit dem
  bestehenden Eintrag überein: nichts ändern, sondern in einer Liste melden.
- Bestehende Felder (players, formation, aliases usw.) nicht verändern.

Hook check-lineups erweitern: wenn details vorhanden, müssen Keys zu den
Positionen der Formation passen, nr 1–99, nat gültiger Code.

Vorgehen in Etappen: jeweils 5 Aufstellungen, beginnend mit Stufe 1.
Nach jeder Etappe: Hook-Ergebnis zeigen, pro Aufstellung die Quelle
nennen, fehlende/unsichere Werte auflisten, dann auf mein OK warten.
```

---

## Prompt 6 – Scout-Rad + einheitliche Währung

```
Lies CLAUDE.md. Größere Änderung → Plan Mode, Plan zeigen, auf OK warten.
Voraussetzung: Positions-Panel (Prompt 2, renderPositionPanel) ist
umgesetzt; details-Daten (Prompt 5) sind zumindest teilweise vorhanden.

Ziel: Das Tipp-System komplett ersetzen – eine Währung, Glücksrad-Tipps.
Optik und Animation des Rads 1:1 aus prototypes/scout-rad.html übernehmen
(Farben, Flutlicht-Birnen am Rand, Zeiger-Tick an Feldgrenzen, Konfetti,
Jackpot-Stempel, Ergebnis-Karte, Chips, Chancen-Liste). Den Prototyp als
Referenz lesen, NICHT als Datei einbinden.

1. Währung vereinheitlichen
   - profile.hintCredits (💡) entfällt, nur noch profile.hintTokens
     (🔍 Scout-Token).
   - Migration in der Profil-Ladefunktion (einmalig, per Flag
     profile.economyVersion = 2): hintTokens = hintTokens * 3 + hintCredits,
     danach hintCredits entfernen.
   - Header-Anzeige (#hintCount) entfernen, nur #tokenCount behalten.
   - Alle Zahlen in einem zentralen Objekt – keine Magic Numbers im Code:
     const ECONOMY = {
       spinCost: 1, revealCost: 3,
       earnFirstPass: 1, earnPerfect: 2, earnDaily: 1,
       earnLevelUp: 3, earnAchievement: 2,
       wheel: { firstLetter: 30, shirtNumber: 30, nationality: 30, fullName: 10 }
     };

2. Verdienen
   - Bestehende Vergabe in evaluatePitch und beim Level-Up auf ECONOMY
     umstellen.
   - "Perfekt"-Bonus nur einmal pro Aufstellungs-id (profile.perfectRewarded).
   - Auf dem Ergebnisbildschirm eine "Token-Quittung": jede Einnahme als
     eigene Zeile (Grund + Betrag) und Summe; nur anzeigen, wenn > 0.

3. Ausgeben im Positions-Panel
   - Button "🎡 Scout-Rad (1)"; deaktiviert bei zu wenig Token oder wenn
     die Position bereits gelöst/aufgedeckt ist.
   - Button "👁️ Aufdecken (3)" – deckt den Namen direkt auf.
   - Rad-Segmente mit Gewichten aus ECONOMY.wheel:
       firstLetter  – immer verfügbar
       shirtNumber  – nur wenn details[abbr].nr vorhanden
       nationality  – nur wenn details[abbr].nat vorhanden UND die
                      Challenge kein Nationalmannschaftsspiel ist
       fullName     – immer verfügbar (Jackpot)
   - Nationalmannschaftsspiele über eine Konstante erkennen:
     const NATIONAL_TEAM_LEAGUES = new Set(["Weltmeisterschaft",
     "Europameisterschaft", "Copa America"]) – gegen challenge.league prüfen.
   - Gewichte der verfügbaren Segmente normalisieren; die Segmentgröße auf
     dem Rad entspricht exakt der Wahrscheinlichkeit. Ergebnis wird VOR der
     Animation per Zufall bestimmt, die Animation landet im Segment.
   - Gezogene Tipp-Arten pro Position aus dem Rad entfernen (Map abbr → Set),
     restliche Gewichte neu normalisieren (animierter Übergang wie im
     Prototyp). fullName löst die Position (zählt als Reveal wie
     tokenRevealed).
   - Keine Nieten.
   - Alle gezogenen Tipps einer Position im Panel als Chips anzeigen.
   - Jeder Dreh zählt als Hinweis (hintsUsed) für XP-Abzug und "Perfekt".
   - Tap aufs Rad während der Drehung überspringt die Animation;
     prefers-reduced-motion → Ergebnis ohne Drehung.

4. Anleitung (GUIDE_SECTIONS) und Intro-Text in renderPitch an das neue
   System anpassen.

5. sw.js CACHE_NAME um eins erhöhen.

Test: Migration mit Test-Profil (2 Token + 5 Hinweise → 11), Rad bei
Position ohne details (2 Felder) und mit details (4 Felder), Nationalteam
(Nationalität fehlt), Token-Quittung nach perfektem Spiel und Wiederholung
(kein zweiter Perfekt-Bonus). Screenshots vom Rad bei 375px zeigen.
```

---

## Prompt 7 – *Später:* PWA-Nacharbeit

```
Lies CLAUDE.md. Ich möchte die PWA-Umsetzung vor dem Capacitor-Schritt
robuster machen:
1. sw.js: Für HTML-Anfragen auf "network-first mit Cache-Fallback"
   umstellen, damit Updates ohne manuelles Hochzählen ankommen. Statische
   Assets bleiben cache-first. Die Cache-Version zentral an einer Stelle.
2. Google Fonts (Anton, Oswald, JetBrains Mono) als woff2 lokal in fonts/
   einbinden und die externen Aufrufe entfernen (DSGVO + offline). Nur die
   tatsächlich genutzten Schnitte.
3. manifest.json: separate Icons für "any" und "maskable"; maskable-Icon
   mit ausreichender Safe Zone neu erzeugen.
4. Die Datei "Packliste Croatia" aus dem Repo entfernen (gehört nicht dazu).

Zeig mir zuerst den Plan (Plan Mode). Teste danach im Browser, dass die App
offline startet und dass eine geänderte HTML-Datei nach einem Reload
ausgeliefert wird.
```

---

## Prompt 8 – *Später:* Vorbereitung Capacitor

```
Bereite das Projekt für Capacitor vor, ohne schon Android/iOS hinzuzufügen:
Web-Dateien nach www/ verschieben, startelf_check.html → index.html
umbenennen, alle Verweise anpassen (Manifest, SW, Icons, CLAUDE.md, Hook),
package.json + capacitor.config anlegen (App-ID-Vorschlag machen, nicht
festlegen). Außerdem eine Export/Import-Funktion für den Spielstand
einbauen (localStorage kann in iOS-Apps gelöscht werden). Plan zuerst zeigen.
```

---

## Ideen-Speicher (noch nicht ausgearbeitet)

- **Tages-Challenge** mit teilbarem Ergebnis (Wordle-Prinzip)
- **Themen-Pakete**: Legendäre Finals, Underdogs, Dramen, Pfalz-Paket (FCK)
- **Retro-Welt** 80er/90er mit neuem Layout 3-5-2 mit Libero
- **Beide Seiten eines Spiels** als verknüpfte Challenges
- Modi: „Wer fehlt?“, Umgekehrter Modus, Zeitmodus, Bonusfragen
- Inhaltliche Lücken: Serie A (nur 2), Ligue 1/Eredivisie (0), vor 2000 (0)
- Keine Vereinswappen/Original-Trikots verwenden (Markenrecht, Store)
