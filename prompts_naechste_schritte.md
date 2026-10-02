# Starting XI – Prompts für die nächsten Schritte

Diese Prompts sind fertig zum Einfügen in Claude Code. **Einen nach dem
anderen**, in der angegebenen Reihenfolge – erst den nächsten, wenn der
vorige umgesetzt, getestet und committet ist.

| # | Thema | Status / Voraussetzung |
|---|---|---|
| 1 | Zoom auf dem iPhone entfernen | ✅ erledigt |
| 2 | Überschneidungen der Namensfelder + Positions-Panel | ✅ erledigt |
| 3 | Namensvarianten, Aliase, Sonderzeichen | ✅ erledigt |
| 4 | Tippfehler-Toleranz „Fast richtig“ + Korrigieren | ✅ erledigt |
| 5 | Datenrecherche Rückennummer + Nationalität | ✅ erledigt |
| 6 | Scout-Rad + einheitliche Währung | ✅ erledigt |
| 7 | PWA-Nacharbeit (Fonts lokal, Update-Strategie) | ✅ erledigt |
| 8 | *Später:* Vorbereitung Capacitor | 7 |
| 9 | Bugfix: feste Vorgaben pro Kampagnen-Level | ✅ erledigt |
| 10 | Typografie aufräumen (kein „maschineller“ Look) | ✅ erledigt |
| 11 | Sterne, XP nur für Verbesserung, Kombo, neue XP-Kurve | ✅ erledigt |
| 11b | Navigation / One-Pager: eigene Bildschirme, Welten-Ausschmückung | ✅ erledigt |
| 11c | Feinschliff nach iPhone-Test: Weltkarte, Ziel-Knoten, Ball, Regeln-Button | ✅ erledigt |
| 11d | Ladescreen beim App-Start (Startelf stellt sich auf, Zähler bis 100 %) | ✅ erledigt |
| 12 | Scout-Profil + Trophäenschrank | ✅ erledigt |
| 13 | Tages-Challenge + Serie | ✅ erledigt |
| 13b | Sterne nur in Kampagne und Tages-Challenge (Freispiel ohne Sterne) | ✅ erledigt |
| 13c | Startseite: Tages-Karte sichtbar machen, Modus-Kacheln verkleinern | ✅ erledigt |
| 13d | Neues App-Icon „Taktiktafel – Flutlicht“ | ✅ erledigt |
| 14 | Recherche Tages-Pool (Gegenseiten + neue Spiele) | ✅ erledigt (41 Aufstellungen) |
| 15 | Kampagne auf ca. 60 Aufstellungen ausbauen | ✅ erledigt (60 Aufstellungen) |
| 16 | Tages-Karte im Ticket-Stil | – |
| 17 | Level-Kachel „Scout-Ausweis“ mit Weg ins Scout-Profil | 16 |
| 18 | Modus-Kacheln: einheitliches Raster, Welten-Kette, Formkurve | 17 |
| 19 | „So geht's“ als Reiter-Blatt (4 Themen) + Texte mit Code abgeglichen | – |
| 20 | Frei spielen neu sortiert, Stufe 1–5, Tages-Archiv als eigene Karte | 19 |
| 21 | Ladescreen etwas langsamer (~4 s statt ~2,4 s) | – |

**Empfohlene Reihenfolge ab jetzt:** 16 → 17 → 18 → 19 → 20 → 21 → 8

Prompt 7 steht bewusst vor der Tages-Challenge: Nur mit der neuen
Update-Strategie kommen neue Tages-Aufstellungen zuverlässig auf dem iPhone an.

Optische Vorlagen: `prototypes/scout-rad.html` (Prompt 6),
`prototypes/scout-profil.html` (Prompts 11–13) und
`prototypes/navigation.html` (Prompt 11b – Bildschirme, Übergänge,
Welten-Ausschmückung), `prototypes/ladescreen.html` (Prompt 11d) und
`prototypes/tageskarte.html` (Prompt 16, nur Variante „Ticket – neu“) und
`prototypes/scout-ausweis.html` (Prompt 17, nur Variante A) und
`prototypes/modus-kacheln.html` (Prompt 18, nur „A · neu“) und
`prototypes/regeln.html` (Prompt 19) und `prototypes/freispiel.html` (Prompt 20).

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

## Prompt 7 – PWA-Nacharbeit

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

## Prompt 9 – Bugfix: feste Vorgaben pro Kampagnen-Level

```
Lies CLAUDE.md. Bugfix mit Spielbalance-Auswirkung → kurz Plan Mode, Plan
zeigen, auf OK warten.

Problem (Exploit): In der Kampagne ändern sich die vorgegebenen Positionen
bei jedem Start eines Levels. Wer ein Level abbricht (zurück zur Weltkarte)
und neu startet, bekommt andere Spieler geschenkt – durch mehrfaches
Neustarten lässt sich so die komplette Aufstellung aufdecken.

Ursache: renderPitch() ruft bei jedem Start getPrefillAbbrs() auf;
selectPrefillAbbrs() mischt die Positionen per shuffled() mit Math.random()
jedes Mal neu.

Umsetzung:
1. Pro Profil einen festen Zufalls-Seed einführen: profile.prefillSeed
   (32-Bit-Integer), einmalig bei Profil-Erstellung bzw. beim Laden eines
   bestehenden Profils ohne Seed erzeugen (Migration in loadProfile) und
   speichern.
2. Deterministischen Zufall einbauen, ohne Libraries:
   - hashString(str) → 32-Bit-Hash (z. B. FNV-1a oder cyrb53)
   - seededRandom(seed) → PRNG-Funktion (z. B. mulberry32)
   - shuffled(arr, rng = Math.random) um optionalen RNG-Parameter
     erweitern (Standardverhalten für andere Aufrufer unverändert).
3. selectPrefillAbbrs(positions, count, rng) bekommt den RNG übergeben.
   getPrefillAbbrs(m) erzeugt ihn aus
   hashString(m.id) XOR profile.prefillSeed.
   Wichtig: Die Auswahl muss immer die ERSTEN count Einträge derselben
   deterministischen Reihenfolge sein – ändert sich count (z. B. weil neue
   Aufstellungen hinzukommen), ist die neue Auswahl eine Teilmenge bzw.
   Obermenge der alten, nie eine andere Kombination.
4. PREFILL_PROTECTED (TW, ST, RST, LST) und PREFILL_MAX_BY_TIER bleiben
   unverändert; Freispiel bleibt ohne Vorgaben.
5. Den Kommentarblock "PROGRESSIVES VORGEBEN" anpassen: nicht mehr "bei
   jedem Versuch neu gemischt", sondern "pro Spieler und Level fest,
   zwischen Levels unterschiedlich".
6. Prüfen, ob es weitere Stellen gibt, an denen ein Neustart des Levels
   Vorteile verschafft (z. B. Scout-Rad-Zustand wheelDrawn, hintsUsed,
   fuzzyCorrected) – nur auflisten und bewerten, nicht ungefragt ändern.
7. sw.js CACHE_NAME um eins erhöhen.

Test:
- Kampagnen-Level starten, vorgegebene Positionen notieren, abbrechen,
  5× neu starten → immer identisch.
- Seite neu laden, gleiches Level → identisch.
- Zwei verschiedene Level derselben Welt → unterschiedliche Muster.
- Neues Profil (localStorage leeren) → anderes Muster als vorher.
- Freispiel → keine Vorgaben.
- Bestehendes Profil ohne prefillSeed lädt fehlerfrei, Fortschritt bleibt.
```

---

## Prompt 10 – Typografie aufräumen

```
Lies CLAUDE.md – die Schrift-Regeln unter "Design / Corporate Identity"
wurden aktualisiert: Die App darf nicht "maschinell" wirken.

Problem: startelf_check.html nutzt JetBrains Mono an rund 28 Stellen,
auch für Kicker, Labels, Badges und Buttons (z. B. .kicker mit
letter-spacing 0.35em). Das wirkt technisch/kalt.

Umsetzung:
1. Alle Selektoren mit font-family JetBrains Mono auflisten und je Stelle
   einordnen (Tabelle: Selektor, Inhalt, neue Schrift, Begründung):
   - Texte, Labels, Kicker, Badges, Buttons, Hinweise → Oswald
     (Labels 500/600, Großbuchstaben, letter-spacing max. 0.12em;
     Nebentexte Oswald 300)
   - hervorgehobene Zahlen (Score, Serien-/Token-Zähler, Level-Zahl im
     Level-Punkt) → Anton, wo es passt
   - nur kleine tabellarische Zahlen, deren Ziffern exakt untereinander
     stehen müssen → JetBrains Mono darf bleiben
2. Tabelle zeigen, auf mein OK warten, dann umsetzen.
3. Keine Farben, Abstände oder Layouts ändern – nur Schrift, Gewicht,
   Letter-Spacing. Optische Referenz: prototypes/scout-profil.html.
4. Screenshots vorher/nachher bei 375px: Startseite, Weltpfad, Spielfeld,
   Ergebnisbildschirm, Scout-Rad.
5. sw.js CACHE_NAME um eins erhöhen.
```

---

## Prompt 11 – Sterne, XP nur für Verbesserung, Kombo, neue XP-Kurve

```
Lies CLAUDE.md. Größere Änderung am Progressionssystem → Plan Mode, Plan
zeigen, auf OK warten. Optische Referenz: prototypes/scout-profil.html
(Sterne unter den Level-Punkten, Sterne-Summe pro Welt).
WICHTIG: Weltkarte (Stadion-Roadmap) und geschlängelter Level-Pfad pro Welt
bleiben in Aufbau und Optik unverändert. Der flache Level-Streifen im
Prototyp ist nur ein Platzhalter, um die Sterne zu zeigen – NICHT nachbauen.
Es kommen lediglich die Sterne unter die bestehenden Level-Punkte und die
Sterne-Summe an die Welten.

Ausgangslage (bereits analysiert):
- xpForLevel(n) = 100·n·(n+1)/2 → Level 30 (Weltklasse) = 46.500 XP.
- Eine perfekte Aufstellung bringt ca. 360 XP (11×15 + 150 Perfekt + 20
  Erstversuch + 25 Tagesbonus). Selbst alle 50 Aufstellungen perfekt
  ergeben nur ca. Level 18 → Weltklasse ist mit dem Inhalt unerreichbar.
- Wiederholen ist die beste XP-Quelle: eine auswendig gelernte Aufstellung
  bringt jedes Mal wieder Positions-XP + 150 Perfekt-XP (nur die Token sind
  einmalig). XP belohnt Wiederholen statt Wissen.

1. Sterne pro Aufstellung
   - ⭐ = bestanden (>= PASS_THRESHOLD, also 7), ⭐⭐ = 9+,
     ⭐⭐⭐ = 11/11 ohne Scout-Rad, ohne Aufdecken, ohne Korrigieren.
     Vorgegebene (prefilled) Positionen blockieren ⭐⭐⭐ nicht.
   - Speichern pro Aufstellung: profile.best[match.id] =
     { stars, correct, solvedAbbrs: [...] } – immer das beste Ergebnis.
     Gilt für Kampagne und Freispiel gemeinsam.
   - Migration: aus stats.perfectMatchIds → 3 Sterne; aus
     campaign.levelPassed → mind. 1 Stern (solvedAbbrs dann leer lassen).
   - Anzeige: kleine Stern-SVGs unter jedem Level-Punkt im Level-Pfad,
     "⭐ x/y" pro Welt im Welt-Kopf und auf der Weltkarte, Sterne auf dem
     Ergebnisbildschirm (neu errungene Sterne kurz animiert einblenden).

2. XP nur für Verbesserung
   - Positions-XP nur für Positionen, die in solvedAbbrs dieser Aufstellung
     noch NICHT enthalten sind (bereits früher gelöste Positionen: 0 XP,
     aber weiterhin grün).
   - Stern-Boni einmalig beim ERSTEN Erreichen: ⭐ 50, ⭐⭐ +75, ⭐⭐⭐ +125.
   - Ersetzt die bisherigen Boni "Perfekte Aufstellung" (150, bei jedem
     Mal) und "Starkes Ergebnis" (40). "Erstmals gespielt" (20 XP + Token)
     bleibt.
   - Keine Verbesserung → 10 "Trainings-XP", damit Wiederholen nicht
     wertlos ist.
   - Den bisherigen "Tagesbonus" vorerst unverändert lassen (wird in
     Prompt 13 durch die Tages-Challenge ersetzt).
   - Alle Werte zentral in einem Objekt XP_RULES (keine Magic Numbers).

3. Kombo
   - Richtige Positionen in Folge ohne Hilfe: XP pro neuer Position
     min(15 + 2·(kombo−1), 25).
   - Zurücksetzen bei: Scout-Rad-Dreh, Aufdecken, Korrigieren sowie beim
     Verlassen eines Feldes (blur) mit nicht-leerer, nicht akzeptierter
     Eingabe.
   - Cross-Match zählt in die Kombo (mit seinen eigenen, niedrigeren Basis-XP).
   - Anzeige: kleiner Chip "Kombo ×n" in Anton ab n = 3, dezent oberhalb
     des Spielfelds; keine Dauer-Animation.

4. Neue XP-Kurve
   - Skript tools/xp-sim.mjs: berechnet aus LINEUP_CHALLENGES die maximal
     erreichbaren XP (alle Aufstellungen ⭐⭐⭐, realistische Kombo) und
     zeigt eine Tabelle Level → benötigte XP für Kurven-Varianten.
   - Ziel: alle Aufstellungen mit ⭐⭐⭐ ≈ Level 25; Level 30 zusätzlich
     über ca. 2 Monate Tages-Challenges erreichbar (Annahme ca. 150 XP pro
     Tages-Challenge – in Prompt 13 feinjustiert).
   - Kurvenform frei wählbar (z. B. a·n·(n+1)/2 mit neuem a), zentrale
     Konstante, Kurve im Plan mit Tabelle begründen.
   - RANKS-Grenzen und Hardcore ab Level 15 bleiben.
   - Migration: Level darf für bestehende Profile NICHT sinken –
     totalXP = max(totalXP, xpForLevel_neu(altesLevel)).

5. Anleitung (GUIDE_SECTIONS) anpassen, sw.js CACHE_NAME erhöhen.

Test: frisches Profil – Aufstellung 8/11 (1 Stern + XP), Wiederholung 8/11
(nur 10 Trainings-XP), Wiederholung 11/11 ohne Hilfe (nur neue Positionen +
⭐⭐ + ⭐⭐⭐-Boni), vierte Wiederholung 11/11 (10 XP). Kombo: 5 Treffer in
Folge, dann Scout-Rad → Reset. Migration eines Profils mit
perfectMatchIds/levelPassed. Ausgabe von tools/xp-sim.mjs zeigen.
```

---

## Prompt 11b – Navigation / One-Pager

```
Lies CLAUDE.md. Große strukturelle Änderung → Plan Mode, Plan zeigen, auf
OK warten. Optische Vorlage: prototypes/navigation.html (Bildschirme,
Übergänge, Modus-Kacheln, Weltkarte, Welten-Ausschmückung). Den Prototyp
als Referenz lesen, nicht einbinden.

Ziel: Die App soll sich wie eine echte App anfühlen – jeder Bereich ist ein
eigener Bildschirm, der ohne Scrollen auf das iPhone passt. Einzige
Ausnahmen: der Level-Pfad einer Welt (scrollt nach unten) und das
Spielfeld (siehe Punkt 5).

1. Bildschirm-Architektur
   - Fünf Bildschirme: start, worldmap, levelpath, freeplay, game (+ der
     bestehende Ergebnis-Zustand im game-Bildschirm).
   - Zentrale Navigation: showScreen(id, direction) mit Verlaufs-Stapel;
     navigate(id) vorwärts, goBack() zurück. Bestehende Views
     (pickerView, campaignView, freeplayView, pitchView) darauf abbilden –
     keine doppelte Logik, bestehende Render-Funktionen weiterverwenden.
   - Übergänge wie im Prototyp: vorwärts von rechts hereinschieben, zurück
     nach rechts heraus, ca. 300 ms; prefers-reduced-motion → ohne
     Animation.
   - Jeder Unterbildschirm hat oben links einen Zurück-Button
     ("← Start", "← Welten", "← Abbrechen"). Zusätzlich Wischgeste vom
     linken Rand = zurück. history.pushState/popstate einbinden, damit
     auch die Android-Zurück-Taste funktioniert.
   - Laufende Aufstellung: Zurück aus dem Spielfeld verhält sich wie der
     bisherige "Abbrechen"-Button.

2. Start-Bildschirm (kein Scrollen)
   - Aufbau wie bisher und wie im Prototyp: Kopf (Logo, "So geht's",
     Kicker, Titel, Schriftzug "Echte Spiele aus der Fußballgeschichte …"),
     Profilleiste, darunter Platz für die Tages-Challenge-Karte (kommt in
     Prompt 13 – bis dahin leer lassen, Layout muss ohne sie funktionieren),
     darunter zwei große Modus-Kacheln nebeneinander:
     Kampagne (Gold): Icon, "Kampagne", aktuelle Welt + Sterne gesamt,
       Fortschrittsbalken.
     Frei spielen (dunkel): Icon, "Frei spielen", Anzahl Aufstellungen,
       "nach Liga & Stufe".
   - Die Welten/der Weltpfad erscheinen NICHT mehr auf der Startseite.
   - Die Statistik-Leiste (.scoreboard) entfällt (die Werte kommen in
     Prompt 12 ins Scout-Profil), ebenso andere Elemente, die Scrollen
     erzwingen würden – im Plan auflisten.
   - Höhe: html/body/App-Container auf volle Bildschirmhöhe (100dvh bzw.
     height: 100% mit Safe-Area-Abständen), Abstände per flex und
     clamp()/vh so, dass alles auf iPhone SE (375×667) bis iPhone 16 Pro
     Max ohne Scrollen passt.

3. Weltkarte (kein Scrollen)
   - Die bestehende Stadion-Weltkarte als eigener Bildschirm, auf die
     verfügbare Höhe skaliert; pro Welt Fortschrittsring, Name und
     "⭐ x/y". Gesperrte Welten: grau + Schloss, Tipp zeigt kurzen Hinweis.

4. Level-Pfad (scrollt)
   - Der bestehende geschlängelte Pfad (Level 1 oben → Ziel unten) als
     eigener Bildschirm mit fester Kopfzeile; beim Öffnen automatisch zum
     aktuellen Level scrollen.
   - Ausschmückung je Welt wie im Prototyp, rein dekorativ an den Rändern
     und oben (nie über Level-Punkten), als inline SVG/CSS:
       Kreisliga: Holzzaun, Bäume, ein Flutlichtmast, warmer Abendhimmel
       Regionalliga: kleine Tribüne, Bandenwerbung (nur eigene
         Fantasie-Schriftzüge, keine echten Marken)
       Bundesliga: Zuschauer-Muster an den Seiten, Fahnen
       Champions League: Nacht, Sternenhimmel, Flutlichtkegel (KEIN
         Champions-League-Sternenball oder anderes echtes Logo)
       Weltklasse: goldenes Licht, Konfetti
     Oben ein kurzer Intro-Text je Welt (siehe Prototyp).
   - Sterne unter den Level-Punkten (aus Prompt 11) bleiben.

5. Spielfeld – WICHTIG: nicht kleiner machen
   - Das Spielfeld mit den Namensfeldern behält mindestens seine heutige
     Größe (volle Breite, heutiges Seitenverhältnis). Es wird NICHT auf die
     Bildschirmhöhe gestaucht.
   - Platz gewinnen nur durch eine kompaktere Spielinfo oben (Wettbewerb,
     Teams, gesuchte Mannschaft in 2–3 Zeilen) und eine schlanke
     Kopfzeile.
   - Passt es auf kleineren Geräten nicht ganz, darf dieser Bildschirm
     vertikal scrollen. Beim Tippen muss das Eingabefeld über der
     iOS-Tastatur sichtbar bleiben (visualViewport berücksichtigen).
   - Mit tools/check-overlap.mjs erneut prüfen: 0 Überlappungen.

6. Freispiel (kein Scrollen)
   - Filter (Wettbewerb, Schwierigkeit, Hardcore-Chip ab Level 15) und
     "Zufällige Aufstellung" als eigener Bildschirm.

7. sw.js CACHE_NAME erhöhen.

Test (Screenshots bei 375×667 und 402×874): Start ohne Scrollen, Weltkarte
ohne Scrollen, Level-Pfad jeder Welt (Ausschmückung sichtbar, springt zum
aktuellen Level), Freispiel ohne Scrollen, Spielfeld in heutiger Größe;
Zurück-Button, Wischgeste und Browser-Zurück funktionieren; laufender
Fortschritt, Sterne und Profil bleiben unverändert.
```

---

## Prompt 11c – Feinschliff nach iPhone-Test

```
Lies CLAUDE.md. Feinschliff nach iPhone-Test (4 Punkte) → kurz Plan Mode,
Plan zeigen, auf OK warten. Jeden Punkt einzeln umsetzen und prüfen.

1. Weltkarte: erste Welt überlappt den Zurück-Button
   Befund (gemessen bei 402×780): Der Kreisliga-Knoten beginnt bei y=40px,
   der Button "← Start" reicht bis y=62px. #campaignView endet bei y=632,
   darunter bleiben ca. 150px ungenutzt. Ursache: .roadmap-wrap nutzt
   padding-bottom: 148% (breitenabhängig) und ROADMAP_NODES startet bei
   y:10 %, Knoten sind per translate(-50%,-50%) zentriert und ragen nach
   oben aus dem Container.
   Umsetzung:
   - Die Roadmap füllt die verfügbare Höhe des Weltkarten-Bildschirms unter
     der Kopfzeile (flex: 1; min-height: 0) statt padding-bottom: 148 %.
   - y-Werte in ROADMAP_NODES/ROADMAP_SEGMENTS so verteilen, dass der
     oberste Knoten inklusive Ring vollständig unter der Kopfzeile liegt und
     der unterste inklusive Name und Sterne-Chip vollständig sichtbar ist –
     gleichmäßige Abstände, unten kein großer leerer Rest.
   - Weiterhin ohne Scrollen, geprüft bei 375×667, 402×780 und 430×932.

2. Level-Pfad: Ziel-Knoten am Ende abgeschnitten
   Befund: In der Kreisliga endet .level-path-wrap bei y=1268, das Label
   des Ziel-Knotens ("Weiter zu Regionalliga") bei y=1281 – Label und Teil
   des 82px-Ziel-Buttons werden durch overflow: hidden abgeschnitten.
   Ursache: Der letzte Punkt liegt bei (totalNodes − 0,4)/totalNodes der
   Inhaltshöhe; unten ist nur 20px Reserve (contentH = totalNodes · Y_STEP
   + 20).
   Umsetzung: unten ausreichend Platz reservieren (analog INTRO_H oben,
   z. B. OUTRO_H), sodass Ziel-Button + Label + etwas Luft immer komplett
   sichtbar sind – in allen 5 Welten.

3. Level-Pfad: Ball verdeckt Sterne/Namen
   Befund: .level-ball (top: -30px) und .level-spotlight (44px hoch +
   80px breiter Lichtkegel) ragen über den aktuellen Level-Knoten hinaus.
   Level liegen nur Y_STEP = 98px auseinander, Sterne und Label des
   vorherigen Levels liegen genau in diesem Bereich (je nach Zickzack-
   Position darunter oder daneben).
   Umsetzung:
   - Ball und Spotlight dürfen nicht mehr über den Knoten hinausragen.
     Vorschlag: Spotlight entfernen; der Ball wird zu einem kleinen Badge
     an der unteren rechten Ecke des Level-Punkts (innerhalb der
     Knoten-Box, ohne Hüpf-Animation). Alternativ weglassen, wenn es
     unruhig wirkt – im Plan beide Varianten kurz zeigen.
   - Das Pulsieren (floodlightPulse) des aktuellen Levels BLEIBT erhalten
     (bewusste Ausnahme zur Regel "keine Dauer-Animationen", da es kein
     Text ist).
   - Absicherung: tools/check-overlap.mjs um eine Prüfung des Level-Pfads
     erweitern – für jede Welt (auch mit aktuellem Level in der Mitte) dürfen
     sich Level-Punkt, Sterne, Label und Badge VERSCHIEDENER Level nicht
     überschneiden. Ziel: 0 Überlappungen bei 375, 402 und 430px Breite.

4. Spielfeld: Infotext durch "Regeln"-Button ersetzen
   Befund: Unter "Gesucht: <Mannschaft>" steht fest der Text "Namen
   eintippen – richtige Felder werden sofort grün … Scout-Rad … Scout-
   Token" (renderPitch, .bonus-text). Er kostet ca. 4 Zeilen Platz.
   Umsetzung:
   - Den Infotext entfernen, "Gesucht: <b>Mannschaft</b>" bleibt.
   - In der Kopfzeile des Spielfelds rechts (gleiche Höhe wie
     "← Abbrechen") einen Button "ℹ️ Regeln" im Stil der bestehenden
     Buttons (Oswald, kein Mono).
   - Tipp öffnet ein Bottom-Sheet/Modal im Stil des Scout-Rad-Modals mit
     kurzen Abschnitten: Eingabe (falsche Zeile wird automatisch
     einsortiert), Fast richtig/Korrigieren, Scout-Rad (Kosten, Felder),
     Aufdecken, Sterne, Kombo, aktueller Token-Stand. Texte aus
     GUIDE_SECTIONS wiederverwenden bzw. von dort ableiten, keine
     doppelte Pflege.
   - Beim allerersten gespielten Level den Regeln-Button einmalig dezent
     hervorheben (z. B. goldener Punkt wie bei "So geht's"), danach nicht
     mehr (Flag im Profil).
   - Das Spielfeld bleibt in seiner Größe unverändert (Prompt 11b, Punkt 5).

5. sw.js CACHE_NAME erhöhen.

Test: Screenshots bei 402×780 von Weltkarte, Kreisliga-Pfad oben (aktuelles
Level in der Mitte) und ganz unten (Ziel-Knoten vollständig), Spielfeld mit
Regeln-Button und geöffnetem Regeln-Fenster; Ausgabe von
tools/check-overlap.mjs zeigen.
```

---

## Prompt 11d – Ladescreen beim App-Start

```
Lies CLAUDE.md. Neues Feature → kurz Plan Mode, Plan zeigen, auf OK warten.
Optik, Ablauf und Texte 1:1 aus prototypes/ladescreen.html übernehmen
(Prototyp als Referenz lesen, nicht einbinden).

Ziel: Beim Start der App erscheint ein professioneller Ladescreen: Logo,
"STARTING XI", Claim "Elf Namen. Ein Spiel. Dein Fußballwissen.", ein
Spielfeld, dessen Kreidelinien sich zeichnen und auf dem die Startelf
(4-3-3) Spieler für Spieler einläuft, ein Zähler bis 100 %, wechselnde
Ladetexte, eine "Wusstest du?"-Karte und zum Schluss "Anpfiff!" mit
Überblendung zur Startseite. Kein Scrollen (One-Pager).

1. Aufbau
   - Eigenes Overlay #splash als oberstes Element über allen Bildschirmen
     (kein eigener Eintrag im Navigations-Verlauf aus Prompt 11b).
   - Die Startseite wird darunter normal aufgebaut; der Splash blendet sich
     am Ende aus (opacity + leichtes scale, ca. 0,5 s) und wird danach aus
     dem DOM entfernt.
   - Inhalte wie im Prototyp: Flutlicht-Kegel in den Ecken (mit Maske
     ausgeblendet, keine harte Kante), Logo-Badge, Kicker, Titel, Claim,
     SVG-Spielfeld (Linien per stroke-dashoffset gezeichnet), 11 goldene
     Positions-Punkte mit Kürzel, Formations-Chip "4-3-3" oben rechts im
     Feld, Zähler in Anton, Verlaufsbalken (Pitch-Grün → Gold) mit 12
     Ticks, Status-Text, Tipp-Karte, "Version x.y" klein unten.
   - Die Versionsnummer aus einer zentralen Konstante APP_VERSION lesen.

2. Ablauf und Dauer
   - Zähler 0 → 100 % mit nicht-linearer Kurve (kleine Pausen wie im
     Prototyp); pro ca. 8 % läuft ein Spieler vom unteren Rand auf seine
     Position (TW zuerst, LA zuletzt), mit kurzem Halo-Effekt.
   - Status-Texte je Schwelle: Rasen wird gemäht … / Linien werden
     gekreidet … / Trikots werden verteilt … / Taktiktafel wird vorbereitet
     … / Startelf wird aufgestellt … / Kapitänsbinde wird angelegt … /
     Gleich geht's los! – Wechsel per kurzem Fade, KEIN Blinken.
   - Gesamtdauer in der App kürzer als im Prototyp: Zähler ca. 1,8 s,
     danach "Anpfiff!" ca. 0,6 s, dann Überblendung – insgesamt höchstens
     ca. 2,5 s. Die 100 % werden erst erreicht, wenn die App wirklich
     bereit ist (Profil geladen, document.fonts.ready); ist sie schneller,
     läuft trotzdem die Mindest-Animation.
   - Tipp auf den Bildschirm überspringt den Rest (direkt zur Überblendung).
   - prefers-reduced-motion: statische Version ohne Einlaufen/Anpfiff,
     ca. 0,8 s, dann Startseite.
   - Nur beim Start der App bzw. Neuladen der Seite – nie bei Wechseln
     zwischen Bildschirmen oder nach einer Aufstellung.

3. "Wusstest du?"-Tipps
   - Zentrale Liste SPLASH_TIPS, pro Start ein zufälliger Tipp.
   - Nur Tipps zu Funktionen, die es in der App schon gibt (z. B. falsche
     Zeile wird automatisch einsortiert, Fast richtig/Korrigieren, drei
     Sterne nur für 11/11 ohne Hilfe, Scout-Rad-Jackpot, Kombo). Tipps zur
     Tages-Challenge erst mit Prompt 13 ergänzen.

4. Kein weißer Blitz beim Öffnen auf dem iPhone
   - Kritisches Inline-CSS ganz oben im <head>: html/body background
     #14202B, damit vor dem Laden der Styles nichts Weißes aufblitzt.
   - manifest.json background_color/theme_color prüfen (#14202B).
   - Im Plan bewerten: apple-touch-startup-image (Startbild, das iOS vor
     dem Laden der App zeigt) für die gängigen iPhone-Größen per Skript aus
     einer SVG-Vorlage erzeugen (dunkler Hintergrund + Logo-Badge +
     "STARTING XI"), sodass der Übergang Startbild → Ladescreen nahtlos
     wirkt. Nur umsetzen, wenn der Aufwand vertretbar ist – sonst Punkt
     begründet weglassen.

5. Schriften/Regeln laut CLAUDE.md (Anton für Titel/Zähler, Oswald sonst,
   keine Mono, keine Blink-Animationen). Neue Dateien (z. B. Startbilder)
   in den Service-Worker-Cache aufnehmen, sw.js CACHE_NAME erhöhen.

Test: Screenshots bei 375×667 und 402×874 bei ca. 50 % und kurz vor
100 %; Gesamtdauer messen (≤ 2,5 s); Tipp zum Überspringen; Neuladen zeigt
den Splash erneut, Bildschirmwechsel nicht; reduced-motion-Variante.
```

---

## Prompt 12 – Scout-Profil + Trophäenschrank

```
Lies CLAUDE.md. Größere UI-Änderung → Plan Mode, Plan zeigen, auf OK
warten. Optik und Aufbau 1:1 aus prototypes/scout-profil.html übernehmen
(Bottom-Sheet, drei Reiter, Trophäen-SVGs, Balken). Voraussetzung:
profile.best aus Prompt 11, Bildschirm-Architektur aus Prompt 11b.

1. Startseite (Voraussetzung: Prompt 11b)
   - Die Statistik-Leiste ist mit 11b von der Startseite verschwunden
     (falls noch vorhanden: entfernen) – ihre Werte erscheinen jetzt im
     Profil. Die Startseite muss weiterhin ohne Scrollen passen.
   - Tipp auf die Profilleiste öffnet statt openAchievementsModal() das
     neue Bottom-Sheet "Mein Scout-Profil" (Schließen per Button, Tipp
     daneben, Escape). Das alte Achievement-Modal entfällt.

2. Reiter "Übersicht"
   - Rang-Karte (Rang-Icon, Rangname, Level, "noch x Level bis <nächster
     Rang>").
   - 6 Kacheln: Absolviert, Ø Treffer, Perfekt, ⭐ gesamt / maximal,
     🔥 Serie, Längste Serie (Serie-Werte zeigen "–", solange Prompt 13
     noch nicht umgesetzt ist).
   - Karriereleiter aus RANKS (vergangen gedimmt, aktuell hervorgehoben).
   - Platz für "Letzte 7 Tage" vorsehen (wird in Prompt 13 befüllt).

3. Reiter "Trophäen"
   - Datenmodell const TROPHIES = [{ id, group, kind: "cup"|"plate"|
     "flame"|"medal", name, req, desc, check(profile), progress(profile)
     → [aktuell, ziel] }].
   - Gruppen und Inhalte:
     Kampagne: je Welt (Tier 1–5) "Pokal" (alle Level bestanden) und
       "Meisterschale" (alle Level ⭐⭐⭐) – aus getMatchesByTier()
       berechnet, also automatisch korrekt bei neuen Aufstellungen.
     Serie & Tages-Challenge: Wochenpokal (7 Tage), Supercup (30),
       Jahrhundert-Serie (100), Tagessieger (10× 11/11 in der
       Tages-Challenge), Tageslegende (50×) – check() liefert false,
       solange Prompt 13 fehlt.
     Besondere Leistungen: die 8 bestehenden ACHIEVEMENTS als Medaillen –
       gleiche ids, damit freigeschaltete Achievements und Titel
       (unlockedTitle) erhalten bleiben.
   - Vitrinen-Optik mit Regalbrett, nicht gewonnene Trophäen als dunkle
     Silhouette mit Schloss; Tipp auf eine Trophäe zeigt Beschreibung +
     Fortschrittsbalken.
   - Neu gewonnene Trophäe: bestehender Toast + ECONOMY.earnAchievement
     Token (wie bisher bei Achievements).

4. Reiter "Wissen"
   - Trefferquote je Wettbewerbsgruppe = Summe best.correct / (11 ×
     Anzahl gespielter Aufstellungen) aus profile.best. Gruppierung der
     league-Werte im Plan vorschlagen (z. B. ob "Bundesliga / DFB-Pokal"
     und "2. Bundesliga" zu einer Gruppe "Deutschland" zusammengefasst
     werden).
   - Trefferquote je Jahrzehnt (Jahr aus comp-Datum parsen).
   - Nicht gespielte Gruppen mit "–".
   - Stärke/Schwäche-Karten: höchste bzw. niedrigste Quote mit mindestens
     2 gespielten Aufstellungen.
   - Button "🎯 <Schwäche> trainieren": startet im Freispiel eine
     Aufstellung dieser Gruppe, bevorzugt eine ohne ⭐⭐⭐.

5. Keine JetBrains Mono für Texte (siehe CLAUDE.md), keine Blink-
   Animationen. sw.js CACHE_NAME erhöhen.

Test: Screenshots aller drei Reiter bei 375px mit einem Test-Profil;
bestehendes Profil mit Achievements → Medaillen gewonnen, Titel bleibt;
Startseite ohne Statistik-Leiste.
```

---

## Prompt 13 – Tages-Challenge + Serie

```
Lies CLAUDE.md. Neues Feature → Plan Mode, Plan zeigen, auf OK warten.
Optik der Startseiten-Karte (offen/gelöst), des 🔥-Chips in der
Profilleiste und der "Letzte 7 Tage"-Leiste 1:1 aus
prototypes/scout-profil.html. Voraussetzungen: Prompts 7, 11, 11b, 12.
Die Kampagne (Weltkarte + Level-Pfad) bleibt unverändert; der Level-
Streifen im Prototyp ist nur Platzhalter.

1. Auswahl der Tages-Aufstellung (ohne Server, für alle gleich)
   - Datum immer LOKAL bestimmen (dateKey "YYYY-MM-DD" aus
     getFullYear/getMonth/getDate). Achtung: der bisherige Tagesbonus nutzt
     new Date().toISOString() = UTC → in Deutschland zwischen 0 und 2 Uhr
     falscher Tag. Gemeinsame Funktion localDateKey() für alles.
   - DAILY_EPOCH = Starttag (Konstante); Tag-Nummer = Tage seit Epoch + 1.
   - Schwierigkeit nach Wochentag: Mo 1, Di 2, Mi 2, Do 3, Fr 3, Sa 4, So 5.
   - Neues Array DAILY_CHALLENGES (gleiches Schema wie LINEUP_CHALLENGES,
     plus optional pairedWith: id der Kampagnen-Aufstellung). Pro
     Schwierigkeit eine feste Warteschlange (nach id sortiert); der n-te
     Montag seit Epoch nimmt den n-ten Stufe-1-Eintrag usw.
   - Ist die Warteschlange leer (anfangs ist DAILY_CHALLENGES leer):
     Fallback deterministisch per hashString(dateKey) aus allen
     LINEUP_CHALLENGES der passenden Schwierigkeit (Funktionen aus
     Prompt 9). Es fällt nie ein Tag aus.
   - Archiv: DAILY_CHALLENGES-Einträge, deren Tag vorbei ist, erscheinen im
     Freispiel-Bildschirm unter einem Filter "📅 Archiv"; heutige/künftige
     nie.
   - Tipp auf die Karte öffnet direkt den Spielfeld-Bildschirm (Navigation
     aus Prompt 11b, Zurück führt zur Startseite).

2. Regeln
   - Ein Versuch pro Tag: gesperrt, sobald "Auswerten" gedrückt wurde;
     Ergebnis in profile.daily[dateKey] = { id, correct, grid, stars }.
   - Keine geschenkten Positionen; Scout-Rad, Aufdecken, Korrigieren
     erlaubt (im Ergebnis-Raster sichtbar).
   - Stern-/XP-Regeln aus Prompt 11 gelten normal.

3. Serie
   - profile.streak = { current, best, lastDayKey }. +1, wenn die
     Tages-Challenge am Folgetag von lastDayKey abgeschlossen wird; ein
     verpasster Tag setzt current beim nächsten Abschluss auf 1.
     Beim Laden prüfen und Anzeige korrekt halten.
   - NUR die Tages-Challenge zählt für die Serie. KEIN Serien-Schutz.
   - XP-Bonus auf die XP der Tages-Challenge: +10 % pro Serientag,
     max. +50 % (zentral in XP_RULES).
   - Der alte "Tagesbonus" (erstes Spiel des Tages) entfällt; ECONOMY.
     earnDaily wird stattdessen beim Abschluss der Tages-Challenge vergeben.

4. Startseite
   - Kompakte Karte auf dem Start-Bildschirm zwischen Profilleiste und
     den Modus-Kacheln (Platz ist seit Prompt 11b reserviert; der
     Start-Bildschirm muss auch mit Karte ohne Scrollen passen – bei Bedarf
     die Modus-Kacheln etwas niedriger, siehe prototypes/navigation.html).
     So flach wie im Prototyp, nicht dominant:
     offen: "Tages-Challenge · TT.MM.", "Tag n", Wochentag + Schwierigkeit
       in DIFF_COLOR, Timer "Neue in HH:MM:SS" bis lokale Mitternacht
       (Anton, groß, Doppelpunkte NICHT blinkend), 🔥-Zähler, Button
       "Spielen".
     gelöst: Mini-Raster in Aufstellungsform, "x/11", Timer "Nächste in",
       🔥-Zähler, Button "Teilen".
   - 🔥-Chip unter dem Token-Chip in der Profilleiste.
   - Übersicht im Scout-Profil: "Letzte 7 Tage" (🔥 = gespielt, heute
     gestrichelt), Serie + Längste Serie befüllen; Serien-/Tages-Trophäen
     aus Prompt 12 aktiv schalten.

5. Teilen
   - Raster in Aufstellungsform: Positionen nach y aus PITCH_LAYOUTS in
     Reihen gruppieren, von vorne (Sturm) nach hinten (TW).
     🟩 direkt richtig · 🟨 mit Scout-Rad/Aufdecken/Korrigieren · ⬛ falsch.
   - Text: "Starting XI · Tag n · x/11 🔥s" + Zeilen des Rasters.
   - navigator.share({ text }) wenn verfügbar, sonst Zwischenablage +
     Toast "Ergebnis kopiert".

6. Anleitung ergänzen, sw.js CACHE_NAME erhöhen.

Test: Systemdatum simulieren (Funktion für "heute" injizierbar machen):
Mo→So liefert Schwierigkeiten 1,2,2,3,3,4,5; zwei Profile bekommen am selben
Tag dieselbe Aufstellung; zweiter Versuch am selben Tag gesperrt; Serie
1→2→3, Tag auslassen → 1; Uhrzeit 00:30 → richtiger lokaler Tag; Teilen-
Text für 4-3-3 und 3-5-2 zeigen; Fallback bei leerem DAILY_CHALLENGES.
```

---

## Prompt 13c – Startseite: Tages-Karte sichtbar, Kacheln verkleinern

```
Lies CLAUDE.md. Kleiner Layout-Bugfix auf dem Start-Bildschirm → kurz
Plan zeigen, dann umsetzen. Optische Referenz: prototypes/navigation.html
(Startseite) und prototypes/scout-profil.html (Tages-Karte offen/gelöst).

Befund (gemessen bei 402×780):
1. Die Tages-Challenge-Karte hat keine Optik: <div id="dailyCard"> fehlt
   die Klasse "daily". Die CSS-Regel .daily (grüner Verlauf, goldener
   Rahmen, Grid-Layout) existiert, greift aber nicht. Folge: Kicker,
   "Tag n", Timer, 🔥 und "Spielen" stehen lose ohne Kasten, "Spielen"
   hängt rechts unten frei.
2. Die Modus-Kacheln (.mode-tiles mit flex: 1) füllen den gesamten
   Restplatz – bei 402×780 ca. 333px hoch. Das wirkt übergroß.
3. Die Kampagnen-Kachel zeigt als Titel den Weltnamen ("Kreisliga" mit ⚽)
   statt "Kampagne" mit 🌍 wie im Prototyp.
4. Im Profilbalken überdeckt das dribbelnde ⚽ (.xp-ball) das Wort "Noch"
   in #xpNext.

Umsetzung:
1. #dailyCard bekommt die Klasse "daily" (bzw. renderDailyCard() setzt
   sie), sodass die Karte in BEIDEN Zuständen (offen / gelöst) exakt wie
   im Prototyp aussieht: grüner Kasten mit goldenem Rahmen, links Kicker,
   "Tag n" + Wochentag/Schwierigkeit, Timer; rechts 🔥-Zähler und Button
   "Spielen" bzw. Mini-Raster + "x/11" + "Teilen".
2. Modus-Kacheln auf eine angemessene Höhe begrenzen (z. B.
   max-height: clamp(150px, 24vh, 210px)) und den Start-Bildschirm
   vertikal ausgewogen verteilen (Kopf, Profilleiste, Tages-Karte,
   Kacheln), sodass es wie im Prototyp stimmig und ohne Scrollen auf
   375×667 bis 430×932 passt – keine großen Leerflächen, nichts gequetscht.
3. Kampagnen-Kachel wie im Prototyp: Icon 🌍, Titel "Kampagne",
   darunter "Welt n · <Weltname>", "⭐ x / y" und Fortschrittsbalken.
   Frei-spielen-Kachel: 🎲, "Frei spielen", Anzahl Aufstellungen,
   "nach Liga & Stufe".
4. .xp-ball darf keinen Text überdecken: festen Platz neben dem Text
   (inline mit Abstand) statt Überlagerung; wenn die Dribbel-Animation
   dabei stört, Animation entfernen (CLAUDE.md: keine Dauer-Animationen
   an Text).
5. sw.js CACHE_NAME erhöhen.

Test: Screenshots der Startseite bei 375×667, 402×874 und 430×932, jeweils
mit offener und gelöster Tages-Challenge (Test-Profil); Vergleich mit
dem Prototyp kurz kommentieren; kein Scrollen auf dem Start-Bildschirm.
```

---

## Prompt 13d – Neues App-Icon „Taktiktafel – Flutlicht“

```
Lies CLAUDE.md. Neues App-Icon einbauen → kurz Plan zeigen, dann umsetzen.

Vorlagen (fertig gestaltet, NICHT neu zeichnen oder verändern):
- icons/source/app-icon.svg – Haupt-Icon 1024×1024: Spielfeld in
  Perspektive, Startelf als 11 goldene Punkte, leuchtender Stürmer,
  Flutlicht, goldener Rahmen. Vollflächig, ohne Transparenz.
- icons/source/app-icon-maskable.svg – Variante für Android
  ("maskable"): ohne Goldrahmen, Inhalt innerhalb der Safe Zone
  (Kreis mit 80 % Durchmesser).
- icons/source/*-preview.png – nur zur Kontrolle, wie es aussehen muss.

Umsetzung:
1. Skript tools/build-icons.mjs (Playwright oder sharp – im Plan
   begründen), das aus den SVGs alle PNGs erzeugt und die bestehenden
   Dateien in icons/ ersetzt:
   - icon-512.png, icon-192.png (purpose "any", aus app-icon.svg)
   - icon-512-maskable.png, icon-192-maskable.png (aus
     app-icon-maskable.svg)
   - apple-touch-icon.png 180×180 (aus app-icon.svg, ohne Transparenz)
   - favicon-32.png, favicon-16.png – prüfen, ob das Icon in 16/32px noch
     erkennbar ist; falls nicht, für die Favicons eine vereinfachte
     Variante vorschlagen (z. B. nur Feld + leuchtender Punkt).
   - zusätzlich icon-1024.png als Vorlage für den späteren App-Store-
     Eintrag (Capacitor, Prompt 8).
   Gerendert wird mit den SVG-Farbverläufen exakt wie in den Previews.
2. manifest.json: Icon-Einträge prüfen (any + maskable getrennt, korrekte
   Größen). index/HTML: apple-touch-icon und Favicon-Links prüfen.
3. Falls in Prompt 11d iOS-Startbilder (apple-touch-startup-image)
   erzeugt wurden: prüfen, ob sie das alte Icon enthalten, und ggf. mit
   neu erzeugen. Das ⚽-Logo-Badge in der App (Kopf, Ladescreen) bleibt
   unverändert.
4. icons/source/ NICHT in den Service-Worker-Cache aufnehmen (nur die
   erzeugten PNGs). sw.js CACHE_NAME erhöhen.

Test: alle erzeugten PNGs nebeneinander als Übersicht zeigen (inkl. 16px
und 32px vergrößert), Vergleich mit den Preview-PNGs; Hinweis an mich,
dass ich das Icon auf dem iPhone nur sehe, wenn ich die App vom
Homescreen lösche und neu über "Zum Home-Bildschirm" hinzufüge.
```

---

## Prompt 13b – Sterne nur in Kampagne und Tages-Challenge

```
Lies CLAUDE.md. Bugfix mit Datenmodell-Änderung → Plan Mode, Plan zeigen,
auf OK warten.

Problem: Aufstellungen, die im Freispiel (oder in der Tages-Challenge)
gespielt werden, zeigen ihre Sterne bereits in der Kampagne an – auch in
noch gesperrten Welten.

Befund (bereits geprüft):
- Es gibt nur EINEN Sterne-Speicher: profile.best[match.id] =
  { stars, correct, solvedAbbrs }. evaluatePitch() schreibt ihn bei JEDER
  Aufstellung, unabhängig vom Modus.
- Kampagnen-Anzeigen lesen diesen gemeinsamen Speicher:
  starsSummaryForTier() (Weltkarte), Level-Pfad (levelStars),
  Kampagnen-Kachel auf der Startseite, Trophäen "Meisterschale",
  Sterne-Kachel im Scout-Profil.
- Die Tages-Challenge nutzt im Fallback Aufstellungen aus
  LINEUP_CHALLENGES und schreibt dabei ebenfalls in profile.best.
- profile.campaign.levelPassed wird korrekt NUR mit currentLevelContext
  gesetzt – die Freischaltung ist nicht betroffen.
- Die Sterne-Migration in loadProfile (Prompt 11) hat aus
  stats.perfectMatchIds (alle Modi!) 3 Sterne erzeugt.

Neue Regel: Sterne gibt es NUR in der Kampagne und in der
Tages-Challenge – getrennt voneinander. Das Freispiel ist Training und
vergibt keine Sterne. Tages-Sterne erscheinen NIE in den Welten, auch
nicht, wenn die Tages-Aufstellung aus der Kampagne stammt.

1. Kampagnen-Sterne
   - Neuer Speicher profile.campaign.stars[match.id] (0–3), geschrieben
     AUSSCHLIESSLICH in evaluatePitch() bei gesetztem currentLevelContext
     (immer das Maximum).
   - ALLE Kampagnen-Anzeigen lesen nur noch daraus: Weltkarte, Level-Pfad,
     Startseiten-Kachel, Meisterschale-Trophäen, Sterne-Kachel im
     Scout-Profil ("Kampagnen-⭐ x / max").
   - Stern-XP-Boni (⭐ 50, ⭐⭐ +75, ⭐⭐⭐ +125) gibt es nur für neue
     Kampagnen-Sterne (Vergleich mit profile.campaign.stars, nicht mit
     profile.best).

2. Tages-Sterne
   - Bleiben in profile.daily[dateKey].stars (pro Tag, unabhängig von
     Kampagne und Freispiel). Jede Tages-Challenge vergibt Tages-Sterne
     und die Stern-XP-Boni für diesen Tag – einheitlich an jedem Tag, egal
     woher die Aufstellung stammt.
   - Sie schreiben NIE in profile.campaign.stars – auch dann nicht, wenn
     die Tages-Aufstellung aus LINEUP_CHALLENGES stammt.
   - Optional im Scout-Profil eine Kachel "Tages-⭐ gesamt" – im Plan
     vorschlagen.

3. Freispiel (inkl. Archiv)
   - Keine Sterne: weder speichern noch auf dem Ergebnisbildschirm
     anzeigen. Stattdessen dort z. B. "9/11 · 3 Positionen neu gelernt".
   - Positions-XP für neu gelöste Positionen, Kombo und Trainings-XP
     bleiben.

4. profile.best wird zum reinen "Wissensstand"
   - Felder correct + solvedAbbrs, das Feld stars entfällt (bei Migration
     entfernen). Genutzt für: XP nur für neu gelöste Positionen (über alle
     Modi – kein doppeltes XP), Ø Treffer, Reiter "Wissen".
   - "Schwäche trainieren" bevorzugt Aufstellungen mit best.correct < 11
     statt "ohne ⭐⭐⭐".
   - Alle Lesestellen von profile.best per Suche finden und im Plan
     tabellarisch auflisten (Stelle, liest heute, liest künftig).

5. Migration (einmalig, Flag z. B. profile.starsVersion = 2)
   - campaign.stars[id] = alter best.stars, aber nur für Level mit
     levelPassed = true (mindestens 1); sonst 0.
   - Damit verschwinden Sterne aus gesperrten Welten und aus noch nicht in
     der Kampagne bestandenen Leveln.
   - Meisterschalen neu berechnen; bereits gewonnene Trophäen bleiben
     gewonnen (im Plan melden, falls das eine betrifft).
   - Level, XP, Token, levelPassed und Tages-Ergebnisse bleiben
     unverändert.

6. Anleitung (GUIDE_SECTIONS, Regeln-Fenster, SPLASH_TIPS) an die neue
   Regel anpassen. sw.js CACHE_NAME erhöhen.

Test (Test-Profile):
- Neues Profil: Aufstellung aus Welt 4 im Freispiel 11/11 → keine Sterne
  im Ergebnis, Weltkarte Welt 4 bleibt ⭐ 0.
- Dieselbe Aufstellung später in der Kampagne 11/11 → 3 Sterne + Stern-
  Boni, aber 0 Positions-XP (schon gelernt).
- Tages-Challenge mit Kampagnen-Aufstellung → Tages-Sterne ja,
  Kampagnen-Sterne nein, Weltkarte unverändert.
- Bestehendes Profil → nach Migration Sterne nur bei bestandenen
  Kampagnen-Leveln; Level/XP/Token unverändert.
```

---

## Prompt 14 – Recherche Tages-Pool

```
Lies CLAUDE.md – Datengenauigkeit hat oberste Priorität. Voraussetzung:
Prompt 13 (DAILY_CHALLENGES existiert).

Ziel: DAILY_CHALLENGES mit ca. 45 Aufstellungen füllen, die NICHT in der
Kampagne vorkommen.

Teil A – bekannte Gegenseiten (ca. 25–30)
- Für die Spiele in LINEUP_CHALLENGES die jeweils ANDERE Mannschaft als
  eigene Challenge anlegen (pairedWith = id des Originals). Die Quelle
  (source) des Originals enthält beide Aufstellungen.
- Nur bekannte Mannschaften. Meine Vorauswahl u. a.: Leverkusen (DFB-Pokal
  2024), AC Mailand (CL 2005), Real Madrid (2:6 2009), Liverpool (vs.
  Leicester 2016), Argentinien (WM 2014), Frankreich (WM 2022, WM 2006,
  WM 2002), England (EM 2021, EM 2016, EM 2024), Atlético (CL 2014),
  Deutschland (EM 2008, WM 2018, WM 2022), Barcelona (LaLiga 2014, EL
  2022), Real Madrid (vs. Ajax 2019, vs. Wolfsburg 2016), Uruguay (WM
  2014), Belgien (EM 2016), Spanien (WM 2010), Manchester United (vs. YB
  2021, EL-Finale 2021), RB Leipzig (Pokal 2022), Inter (CL 2023),
  Brasilien (Copa 2021), Bayern (CL 2012), Arsenal (CL 2026),
  Argentinien (WM 2026), Tottenham (2025), Kolumbien (Copa 2024),
  AS Rom (EL 2023).
  Unbekanntere Gegner (z. B. Monaco 2017, Villarreal 2022, Südkorea 2018)
  nur als Stufe 4–5 (Wochenende).
- Zuerst Liste mit vorgeschlagener difficulty zeigen, auf OK warten.

Teil B – neue große Spiele (ca. 15–20)
- Vorschlagsliste berühmter Spiele, die noch nicht in der App sind
  (Mischung aus Jahrzehnten inkl. vor 2000, verschiedenen Ligen/
  Wettbewerben, ausgewogen über Stufe 1–5). Liste zeigen, auf OK warten.

Regeln für beide Teile (wie Prompt 5):
- Alle Pflichtfelder laut CLAUDE.md + details (nr, nat – nat nicht bei
  Nationalteams) + aliases, wo nötig + source.
- Nur mit verlässlicher Quelle, nichts aus dem Gedächtnis; unsichere Werte
  weglassen; Abweichungen melden statt raten.
- formation muss in PITCH_LAYOUTS existieren; fehlt eine Formation,
  melden statt eigenmächtig anlegen.
- Etappen zu je 5 Aufstellungen, nach jeder Etappe Hook-Ergebnis, Quellen
  und offene Punkte zeigen, auf OK warten.
```

---

## Prompt 15 – Kampagne auf ca. 60 Aufstellungen ausbauen

```
Lies CLAUDE.md. Ziel: LINEUP_CHALLENGES von 50 auf ca. 60 erweitern und
die inhaltlichen Lücken schließen: Serie A (bisher 2), Ligue 1 (0),
Eredivisie (0), Spiele vor 2000 (0). Weiterhin ausgewogen über die Stufen
(möglichst gleich viele je Stufe).

1. Vorschlagsliste (ca. 12 Spiele, etwas mehr als nötig) mit Wettbewerb,
   Datum, abgefragter Mannschaft, Formation, vorgeschlagener Stufe und
   kurzer Begründung – keine Überschneidung mit DAILY_CHALLENGES.
   Auf mein OK warten.
2. Für Spiele vor 2000 prüfen, ob die Formation in PITCH_LAYOUTS existiert
   (z. B. 3-5-2 mit Libero). Fehlt ein Layout: Vorschlag für neue
   Koordinaten zeigen, mit tools/check-overlap.mjs auf 0 Überlappungen
   prüfen, erst nach OK anlegen.
3. Recherche-Regeln wie Prompt 5/14 (Quelle, details, aliases, nichts aus
   dem Gedächtnis), Etappen zu je 5, Hook-Ergebnis zeigen.
4. Trophäen/Sterne-Summen passen sich automatisch an – kurz prüfen.
```

---

## Prompt 16 – Tages-Karte im Ticket-Stil

```
Lies CLAUDE.md. Optische Überarbeitung der Tages-Challenge-Karte auf dem
Start-Bildschirm → kurz Plan zeigen, dann umsetzen. Optik 1:1 aus
prototypes/tageskarte.html übernehmen – maßgeblich ist NUR die Variante
"Ticket – neu" (CSS .t1, Funktion v1b). Prototyp als Referenz lesen, nicht
einbinden.

Ziel: Die Karte wirkt wie eine Eintrittskarte und typografisch nicht mehr
"maschinell". Position auf der Startseite bleibt (zwischen Profilleiste und
Modus-Kacheln).

1. Aufbau (renderDailyCard / #dailyCard)
   - Ticket mit zwei Abschnitten: links breit (grüner Verlauf mit
     Rasenstreifen, goldener Rand), rechts ca. 100px Abriss-Abschnitt in
     GOLD (Verlauf wie im Prototyp). Dazwischen gepunktete Abrisslinie und
     oben/unten je eine halbrunde Einkerbung in der Hintergrundfarbe.
   - Höhe ca. 148px (heute ca. 99px). Den Mehrplatz aus den Abständen der
     Startseite nehmen, aber unter der Profilleiste/Level-Kachel weiterhin
     Reserve lassen – die Level-Kachel wird später überarbeitet und braucht
     dann ggf. mehr Platz. Startseite weiterhin ohne Scrollen auf 375×667
     bis 430×932.

2. Linker Abschnitt
   - Zeile 1: kleiner grüner Live-Punkt + Datum AUSGESCHRIEBEN in Oswald
     400 (z. B. "Freitag, 2. Oktober" via toLocaleDateString("de-DE",
     { weekday: "long", day: "numeric", month: "long" })) – keine
     gesperrten Großbuchstaben.
   - Zeile 2: großer Titel in Anton "TAGES-CHALLENGE", "Tages-" chalk,
     "Challenge" gold mit leichtem Glow.
   - Zeile 3 (offen): "Spieltag n" (Anton, klein), Trennpunkt,
     Schwierigkeit als Leuchtbalken mit 5 Segmenten in DIFF_COLOR der
     Tagesstufe, dahinter der Stufenname.
     Zeile 3 (gelöst): Mini-Raster in Aufstellungsform, "x/11" (Anton),
     Tages-Sterne aus profile.daily[dateKey].stars und "Spieltag n".
   - Zeile 4: "Neue Challenge in" (offen) bzw. "Nächste in" (gelöst) +
     Timer als Klappziffern: jede Ziffer in einem eigenen dunklen Kästchen
     mit Mittellinie (Anton), Doppelpunkte dezent. Ziffern aktualisieren
     sich jede Sekunde OHNE Animation/Blinken (CLAUDE.md).

3. Rechter Abschnitt (gold)
   - Serie: "🔥 n" in Anton (dunkle Schrift auf Gold), darunter
     "Tage Serie" in Oswald.
   - Offen: Button "STARTEN" in Anton – GRÜN wie die linke Seite
     (grüner Verlauf mit Rasenstreifen, Schrift Gold-hell, dunkle
     Schattenkante); startet startDailyChallenge().
   - Gelöst: Button "TEILEN" (dezent, dunkle Schrift auf Gold mit Rahmen),
     ruft die bestehende Teilen-Funktion auf.

4. Alte, nicht mehr genutzte .d-* Styles entfernen. Schriften laut
   CLAUDE.md (kein Mono). sw.js CACHE_NAME erhöhen.

Test: Screenshots der Startseite (offen und gelöst) bei 375×667, 402×874
und 430×932; Vergleich mit dem Prototyp kurz kommentieren; kein Scrollen;
Starten und Teilen funktionieren.
```

---

## Prompt 17 – Level-Kachel „Scout-Ausweis“

```
Lies CLAUDE.md. Optische Überarbeitung der Profilleiste (#profileBar) auf
dem Start-Bildschirm → kurz Plan zeigen, dann umsetzen. Optik 1:1 aus
prototypes/scout-ausweis.html übernehmen – maßgeblich ist NUR Variante A
(Funktion pA, CSS .sp/.ring/.foot). Voraussetzung: Prompt 16 ist umgesetzt.

Ziel: Die Leiste wird zum "Scout-Ausweis": Level und Rang wirken wie etwas,
auf das man stolz ist, das nächste Ziel ist sichtbar, und der Weg ins
Scout-Profil ist unübersehbar (heute gibt es keinen Hinweis darauf, dass
ein Tipp das Profil öffnet).

1. Aufbau (renderProfileBar / #profileBar)
   - Gesamte Kachel bleibt ein Button, Tipp öffnet wie bisher das
     Scout-Profil (Bottom-Sheet aus Prompt 12).
   - Oberer Teil:
     links: Rang-Emblem (Rang-Icon aus RANKS, goldener Verlauf) mit
       XP-Fortschritt als goldenem RING drumherum (SVG, Anteil = XP im
       aktuellen Level) und Level-Plakette "LVL n" (Anton) unten am Ring.
     Mitte: Rangname groß in Anton; dahinter – falls vorhanden –
       profile.unlockedTitle in Oswald gold („Titel“); darunter XP-Balken;
       darunter "Noch x XP bis Level n+1"; darunter
       "Ziel: <Icon> <nächster Rang> in k Level" (aus RANKS: nächster Rang
       mit min > Level, k = min − Level). Im höchsten Rang stattdessen
       "Höchster Rang erreicht".
     rechts oben: Token-Chip 🔍 (wie bisher).
   - Fußleiste (abgesetzt durch feine Goldlinie): 🏆 gewonnene/alle
     Trophäen (aus TROPHIES), ⭐ Kampagnen-Sterne erreicht/max (aus
     profile.campaign.stars), "📊 Wissen", rechts "SCOUT-PROFIL ›" in
     Anton gold.
   - Neue-Trophäe-Hinweis: kleiner goldener Punkt vor "SCOUT-PROFIL",
     solange eine Trophäe gewonnen, im Profil aber noch nicht angesehen
     wurde (neues Feld z. B. profile.seenTrophies; beim Öffnen des
     Trophäen-Reiters als gesehen markieren). Kein Blinken.
   - Das 🔥-Serien-Chip entfällt in dieser Kachel (die Serie steht groß
     auf der Tages-Karte aus Prompt 16).
   - Weltklasse-Goldrahmen (gold-frame ab Level 30) bleibt erhalten.

2. Platz
   - Die Kachel wird höher als heute (ca. 125–135px statt 91px). Den
     Platz aus den verbleibenden Abständen der Startseite nehmen; die
     Startseite muss weiterhin ohne Scrollen auf 375×667 bis 430×932
     passen. Abstände zwischen Kopf, Kachel, Tages-Karte und
     Modus-Kacheln gleichmäßig.

3. Schriften laut CLAUDE.md (Anton für Rang, Level, Zahlen und
   "SCOUT-PROFIL"; Oswald für alles andere; kein Mono). Alte, nicht mehr
   genutzte Styles der Profilleiste entfernen. sw.js CACHE_NAME erhöhen.

Test: Screenshots der Startseite bei 375×667, 402×874 und 430×932 mit
Test-Profilen: Level 1 (Kreisliga, kein Titel), Level 17 (mit Titel und
neuer Trophäe), Level 30 (Weltklasse, "Höchster Rang erreicht",
Goldrahmen). Tipp auf die Kachel öffnet das Scout-Profil; nach Öffnen der
Trophäen verschwindet der goldene Punkt.
```

---

## Prompt 18 – Modus-Kacheln „Kampagne“ und „Frei spielen“

```
Lies CLAUDE.md. Optische Überarbeitung der beiden Modus-Kacheln auf dem
Start-Bildschirm (#modeTileCampaign, #modeTileFreeplay) → kurz Plan
zeigen, dann umsetzen. Optik 1:1 aus prototypes/modus-kacheln.html –
maßgeblich ist NUR "A · neu" (Funktion mA2, CSS .mt/.a2/.wp/.form/.ln/.ft).
Voraussetzung: Prompts 16 und 17 sind umgesetzt.

Befund heute: Jede Kachel zentriert ihren Inhalt einzeln (flex,
justify-content: center) – bei unterschiedlich langen Texten sitzen Icon,
Titel und Infozeile nicht auf einer Höhe. Die Infozeile ist reiner Text
und wirkt langweilig.

1. Gemeinsames Raster
   - Beide Kacheln nutzen dasselbe CSS-Grid mit festen Zeilen: Icon,
     Titel (Anton), Bildzeile, Textzeile, Aktionsleiste. Alle Zeilen liegen
     in beiden Kacheln exakt auf gleicher Höhe, gleiche Schriftgrößen.
   - Aktionsleiste unten über die volle Kachelbreite, abgesetzt durch
     feine Linie, Text in Anton mit Pfeil ›.
   - Dezente Hintergründe wie im Prototyp: Kampagne heller Lichtschein
     oben, Frei spielen Mittellinie + Anstoßkreis (sehr transparent).

2. Kachel Kampagne (Gold)
   - Icon 🌍, Titel "KAMPAGNE".
   - Bildzeile: die Welten als Kette (Anzahl aus den Tiers mit
     Aufstellungen): abgeschlossene Welt = dunkler Punkt mit ✓, aktuelle
     Welt = großer dunkler Punkt mit Weltnummer, künftige = leere Ringe,
     Verbindungsstriche dazwischen (abgeschlossen dunkel).
   - Textzeile: "<Weltname> · Level n" (aktuelle Welt = erste noch nicht
     komplett bestandene freigeschaltete Welt; Level = erstes nicht
     bestandenes Level darin). Ist alles geschafft: alle Punkte ✓ und
     "Alle Welten geschafft".
   - Aktionsleiste: "WEITER SPIELEN ›". Navigation wie bisher (Weltkarte).

3. Kachel Frei spielen (dunkel)
   - Icon 🎲, Titel "FREI SPIELEN".
   - Bildzeile: FORMKURVE – die letzten 5 Freispiel-Ergebnisse als kleine
     Felder mit der Trefferzahl (Anton), älteste links, neueste rechts und
     umrandet. Farben: 9–11 grün (--ok), 7–8 gold, darunter grau.
     Weniger als 5 Spiele: die fehlenden Felder leer/gestrichelt.
   - Textzeile: "Formkurve · Ø x,x Treffer" (Schnitt der angezeigten
     Spiele, deutsches Komma). Ohne Spiele: "Noch keine Spiele".
   - KEINE Anzeige, wie viele Aufstellungen schon gespielt/gelernt sind
     (keine Prozente, kein "x von y") – das soll bewusst offen bleiben.
   - Datenquelle: neues Feld profile.freeplayForm (Array, max. 5 Einträge,
     Trefferzahl 0–11), wird in evaluatePitch NUR im Freispiel (weder
     Kampagne noch Tages-Challenge) hinten angehängt und auf 5 gekürzt.
   - Aktionsleiste: "ZUFALL ODER FILTER ›". Navigation wie bisher.

4. Platz: Die Startseite muss mit Scout-Ausweis (17) und Tages-Ticket (16)
   weiterhin ohne Scrollen auf 375×667 bis 430×932 passen; Kachelhöhe
   entsprechend wählen (Prototyp ca. 180px). Schriften laut CLAUDE.md,
   alte nicht mehr genutzte .mode-tile-Styles entfernen. sw.js
   CACHE_NAME erhöhen.

Test: Screenshots der Startseite bei 375×667, 402×874 und 430×932 mit
Test-Profilen: neu (Welt 1, keine Freispiele), mittendrin (Welt 3,
Formkurve 9/7/11/6/10), alles geschafft. Prüfen, dass Icon, Titel,
Bild- und Textzeile beider Kacheln pixelgenau auf gleicher Höhe liegen.
```

---

## Prompt 19 – „So geht's“ als Reiter-Blatt

```
Lies CLAUDE.md. Strukturelle Änderung an der Spielanleitung → Plan Mode,
Plan zeigen, dann umsetzen. Optik 1:1 aus prototypes/regeln.html
(Daten-Array P mit 4 Reitern, CSS .tabs/.panel/.goal/.num/.help/.warn/
.modes/.stars/.chain/.mini).

Befund heute: openGuideModal() listet 14 GUIDE_SECTIONS ungeordnet
untereinander – unübersichtlich. Zwei Texte sind veraltet bzw. falsch:
"Achievements" (es gibt inzwischen auch Trophäen) und "Schwierigkeit
steigt zur Wochenmitte hin" (laut WEEKDAY_DIFFICULTY: Mo 1 → So 5).
"Aufdecken ... ohne XP-Abzug" ist irreführend: eine aufgedeckte Position
zählt als richtig, bekommt aber gar keine Positions-XP.

1. Neues Blatt "SO GEHT'S" (ersetzt die Liste in openGuideModal)
   - Kopf: Titel "SO GEHT'S" (Anton, "GEHT'S" gold) + "Schließen".
   - Darunter 4 Reiter (role="tablist", Icon + Label, aktiver Reiter
     goldener Rahmen): ⚽ SPIELEN · 🔍 HILFEN · 🏟️ MODI · 🏆 BELOHNUNG.
   - Jeder Reiter passt OHNE Scrollen auf 375×667 bis 430×932 (Panel darf
     nur als Notlösung intern scrollen). Kein Auf-/Zuklappen.
   - Zuletzt geöffneter Reiter wird nicht gespeichert – startet immer bei
     SPIELEN.

2. Inhalte (Texte wie im Prototyp, Zahlen IMMER aus den Konstanten
   ECONOMY / XP_RULES / PASS_THRESHOLD ziehen, nichts hart codieren):
   SPIELEN: grüne Ziel-Karte mit kleiner Spielfeld-Skizze (SVG aus dem
     Prototyp) – Text enthält den bisherigen Fußnoten-Hinweis "echte
     Startelf eines konkreten Spiels, keine typische Stammelf". Darunter
     "So trägst du ein" mit 3 nummerierten Schritten: Nachname reicht /
     Falsche Zeile? / Fast richtig (Feld gold, Korrigieren = weniger XP).
   HILFEN: zwei Karten mit Preisschild – Scout-Rad (spinCost 🔍, Tipp
     1. Buchstabe/Rückennummer/Nationalität/Jackpot Name, Position bringt
     weniger XP) und Aufdecken (revealCost 🔍, zählt als richtig, keine
     Positions-XP). Hinweisbalken: jede Hilfe kostet ⭐⭐⭐ und beendet
     die Kombo, gilt in allen Modi. Karte "Token verdienen" als Chips MIT
     Menge: +earnFirstPass Erstmals gespielt, +earnPerfect Perfekte
     Aufstellung (einmalig), +earnDaily Tages-Challenge, +earnLevelUp je
     Level-Up, +earnAchievement Trophäe / Achievement. Fußnote
     Rückennummer/Nationalität nur wo Daten vorliegen, bei
     Nationalteams keine Nationalität.
   MODI: Vergleichstabelle Kampagne / Tages-Challenge / Frei spielen mit
     Zeilen Spiele (5 Welten / 1 pro Tag / frei wählbar), Versuche
     (beliebig / 1 / beliebig), Sterne (✓ ✓ –), Serie (– ✓ –).
     Darunter je ein Satz: Kampagne (ab PASS_THRESHOLD von 11 bestanden),
     Tages-Challenge (Mo leicht, So am schwersten, Serie bis
     +dailyStreakBonusMax XP, teilbar), Frei spielen (Training ohne
     Druck; mehrere Wettbewerbe/Stufen = mehr Spiele, beides kombiniert
     grenzt ein; Tages-Archiv). Frei spielen bekommt KEINEN eigenen
     Info-Button – die Erklärung steht hier.
   BELOHNUNG: Sterne als 3 Stufen (7/11, 9/11, 11/11 ohne Hilfe – nur
     Kampagne & Tages-Challenge), Kette XP › Level › Rang mit Chips
     (neu gelöste Positionen, neue Sterne, Tages-Challenge) + Hinweis
     Trainings-XP, Karten Kombo und Trophäen, Leiste "Ab Level 15:
     Hardcore-Modus im Freispiel – nur Stufe 4–5".

3. Datenstruktur: GUIDE_SECTIONS durch GUIDE_TABS ersetzen (je Reiter
   id, icon, label, render()). Das Regeln-Modal im Spielfeld
   (openRulesModal, RULES_SECTION_TITLES) nutzt dasselbe Blatt, zeigt
   aber nur SPIELEN, HILFEN, BELOHNUNG und darunter weiterhin
   "🔍 Aktueller Stand: n Scout-Token". hasSeenGuide/helpDot und
   hasSeenPitchRules/rulesDot verhalten sich wie bisher. Alte
   .guide-row-Styles entfernen, falls nicht mehr genutzt.

4. Nichts an Spielmechanik, Token-Kosten oder XP ändern – nur Anzeige.
   Prüfe beim Umsetzen jede Aussage gegen den Code; weicht etwas ab,
   gilt der Code und der Text wird angepasst (im Plan auflisten).
   Kleiner Datenfix nebenbei: NATIONAL_TEAM_LEAGUES enthält "Copa
   America" ohne Akzent, die Daten nutzen "Copa América" – auf die
   Schreibweise der Daten angleichen und "Afrika-Cup" (Tages-Pool)
   ergänzen. sw.js CACHE_NAME erhöhen.

Test: Screenshots aller 4 Reiter + Regeln-Modal bei 375×667 und
430×932; prüfen, dass kein Reiter scrollt und keine Konsolenfehler.
```

---

## Prompt 20 – Frei spielen neu sortiert

```
Lies CLAUDE.md. Umbau des Freispiel-Bildschirms (#screen-freeplay) →
kurz Plan zeigen, dann umsetzen. Optik 1:1 aus prototypes/freispiel.html
(CSS .lab/.grp/.gl/.chips/.ch/.levels/.lvl/.count/.go/.arch).
Voraussetzung: Prompt 19 (die Erklärung steht im Reiter MODI, daher
KEIN eigener Info-Button auf diesem Bildschirm).

Befund heute: Liga- und Stufen-Chips stehen ohne Überschrift und
ungeordnet, "Bundesliga / DFB-Pokal" und "Bundesliga" stehen getrennt,
die Stufen heißen wie Wettbewerbe (Kreisliga … Champions League) und
werden mit den echten Wettbewerben verwechselt. "📅 Archiv" steht
zwischen den Ligen, obwohl es kein Wettbewerb ist.

1. Abschnitt WETTBEWERB
   - Überschrift (Anton, gold) + rechts "Mehrfachauswahl möglich"
     (Oswald 300).
   - Chip "Alle Wettbewerbe <n>" (aktiv = goldener Verlauf).
   - Gruppen mit kleiner Beschriftung links: Turniere (WM, EM, Copa
     América), Europapokal (Champions League, Europa League), Ligen &
     Pokal (Deutschland, England, Spanien, Italien, Niederlande).
   - Ein Länder-Chip steht für mehrere league-Werte: neue Konstante
     FREEPLAY_GROUPS (Chip-Label → league-Werte), z. B. Deutschland =
     Bundesliga + 2. Bundesliga + Bundesliga / DFB-Pokal + DFB-Pokal.
     Kurzlabels WM/EM nur in der Anzeige. selectedLeagues bleibt ein Set
     von league-Werten (Chip an = alle seine Werte rein, aus = raus), so
     funktionieren poolForActiveLeague() und trainWeakness() unverändert.
   - Jede league aus LINEUP_CHALLENGES muss genau einem Chip zugeordnet
     sein; fehlt eine Zuordnung, im Plan melden (nicht still weglassen).
     Chips ohne Aufstellungen ausblenden. Zahl je Chip = passende
     Aufstellungen.

2. Abschnitt SCHWIERIGKEIT
   - Überschrift + "Mehrfachauswahl möglich".
   - 5 gleich breite Kacheln "Stufe 1" … "Stufe 5" mit 5-Balken-Anzeige
     in DIFF_COLOR und "<n> Spiele". DIFF_LABEL selbst NICHT ändern (wird
     für Welten-Namen gebraucht) – nur hier "Stufe n" anzeigen.
   - Kein eigener "Alle Stufen"-Chip mehr: keine Stufe gewählt = alle.
   - Hardcore-Modus (ab Level 15, bisher #unlockRow): als kleiner
     Schalter "🔥 Hardcore · nur Stufe 4–5" direkt unter den Stufen,
     Verhalten wie bisher (profile.hardcoreMode).

3. Unten
   - "<n> Aufstellungen passen" (Zahl Anton), grüner Button
     "🎲 Zufällige Aufstellung", darunter klein (Oswald 300) "Die Partie
     bleibt geheim, bis du sie spielst."
   - Bei 0 Treffern: Button deaktiviert, Text "Keine Aufstellung passt –
     wähle etwas ab".
   - Tages-Archiv als eigene Karte (gestrichelter Goldrahmen): "📅
     TAGES-ARCHIV – Verpasste Tages-Challenges nachspielen" + Anzahl.
     Tipp startet eine zufällige archivierte Tages-Aufstellung direkt
     (bisherige Logik von showDailyArchive/archivedDailyChallenges, aber
     ohne Umweg über den Filter). Gespielt wird mit Freispiel-Regeln:
     keine Sterne, keine Serie, kein earnDaily. Ohne Archiv-Einträge
     Karte ausblenden.

4. Spielfluss & Token unverändert lassen: Scout-Rad/Aufdecken, Kosten,
   Kombo, XP und Token-Vergabe im Freispiel funktionieren genau wie
   bisher. Prüfe das nach dem Umbau mit je einem Freispiel aus Filter
   und aus dem Archiv (Token-Stand vor/nach Rad und Aufdecken, Kombo,
   Ergebnis-Quittung).

5. Muss ohne Scrollen auf 375×667 bis 430×932 passen. Alte
   .filter-btn-Styles entfernen, falls nicht mehr genutzt. sw.js
   CACHE_NAME erhöhen.

Test: Screenshots bei 375×667 und 430×932 (Level < 15 und ≥ 15, mit und
ohne Archiv); Klick-Tests: Deutschland + Stufe 3 → Zahl stimmt mit
manueller Zählung überein; Alle Wettbewerbe setzt zurück; Archiv-Karte
startet ein Archivspiel ohne Sterne.
```

---

## Prompt 21 – Ladescreen etwas langsamer

```
Lies CLAUDE.md. Kleine Timing-Änderung am Ladescreen (runSplash /
finishSplash) – kein Plan Mode nötig, Änderung kurz beschreiben und
umsetzen.

Befund: Der Ladescreen läuft heute ca. 2,4 s (Zähler DUR = 1800 ms +
600 ms Anpfiff). Die Startelf läuft dadurch sehr schnell ein, der Tipp
unten ist kaum lesbar. Der Prototyp prototypes/ladescreen.html war mit
3200 ms + 850 ms angelegt und wirkt deutlich besser.

1. Zeitwerte als Konstante SPLASH_TIMING oben im Splash-Block:
   counterMs: 3200 (bisher 1800), kickoffHoldMs: 900 (bisher 600),
   reduced-motion-Werte unverändert (800 / 100). Gesamtdauer damit ca.
   4,1 s. Alle Teil-Animationen (Spieler-Einlauf ab 8 %, Statustexte,
   Fortschrittsbalken) hängen weiter an der Prozentkurve und strecken
   sich automatisch mit – nichts doppelt timen.
2. Überspringen bleibt: Tipp irgendwo auf den Ladescreen beendet ihn
   sofort (skipSplash, existiert schon). Neu: kleiner Hinweis
   "Tippen zum Überspringen" (Oswald 300, ca. 12px, gedimmt) am unteren
   Rand, der nach ca. 1,2 s einmal sanft einblendet und dann stehen
   bleibt – kein Blinken/Pulsieren.
3. Weiterhin nur beim App-Start, nie bei Bildschirmwechseln. 100 %
   erst, wenn Mindestdauer UND document.fonts.ready erfüllt sind (wie
   bisher). sw.js CACHE_NAME erhöhen.

Test: Ablauf einmal per Video/Screenshot-Serie (0 s, 1 s, 2 s, 3 s, 4 s)
bei 402×874 prüfen: alle 11 Spieler stehen vor dem Anpfiff, Tipp und
Statustexte sind lesbar, Tippen überspringt sofort, keine
Konsolenfehler.
```

---

## Ideen-Speicher (noch nicht ausgearbeitet)

- **Themen-Pakete**: Legendäre Finals, Underdogs, Dramen, Pfalz-Paket (FCK)
- **Retro-Welt** 80er/90er mit neuem Layout 3-5-2 mit Libero
- **Beide Seiten eines Spiels** als verknüpfte Challenges
- Modi: „Wer fehlt?“, Umgekehrter Modus, Zeitmodus, Bonusfragen
- Keine Vereinswappen/Original-Trikots verwenden (Markenrecht, Store)
- *Später:* Belohnungsleiste („nächste Belohnung“: Rasenmuster, Rad-Designs, Titel)
- *Später:* Scout-Aufträge (täglich/monatlich)
- *Später (nach Capacitor):* Bestenlisten über Apple Game Center / Google Play Games
