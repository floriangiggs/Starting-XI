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
| 16 | Tages-Karte im Ticket-Stil | ✅ erledigt |
| 17 | Level-Kachel „Scout-Ausweis“ mit Weg ins Scout-Profil | ✅ erledigt |
| 18 | Modus-Kacheln: einheitliches Raster, Welten-Kette, Formkurve | ✅ erledigt |
| 19 | „So geht's“ als Reiter-Blatt (4 Themen) + Texte mit Code abgeglichen | ✅ erledigt |
| 20 | Frei spielen neu sortiert, Stufe 1–5, Tages-Archiv als eigene Karte | ✅ erledigt |
| 21 | Ladescreen etwas langsamer (~4 s statt ~2,4 s) | ✅ erledigt |
| 22 | Fehler aus dem Testlauf: Tages-Reihenfolge, Hilfe-Buttons, lange Namen u. a. | ✅ erledigt |
| 23 | Daten: Ajax 1995 durch echtes Spiel ersetzen, fehlende Rückennummern/Nationalitäten | ✅ erledigt (Ajax-Eintrag gestrichen, 59 Aufstellungen) |
| 24 | Tages-Challenge: Ticket-Einkerbung, „Erledigt“ + Teilen als Bild | ✅ erledigt |
| 25 | Duell Teil 1: Hosting-Prüfung, Links, Startseite (Duell-Kachel), Duell-Bildschirme | ✅ erledigt |
| 26 | Duell Teil 2: Spielen, Walkout, Ergebnis, XP, Bilanz, Trophäen | ✅ erledigt |
| 27 | Duell-Einladung: „Hier im Browser spielen“ ohne Funktion, Fair-Play-Schritt klarer | – |
| 28 | Duell: Ergebnis kommt sicher an, beendete Duelle (Richtige + Zeiten), Duelle entfernen | ⏸ zurückgestellt – kommt ins Online-Duell |
| 29 | Duell: Zwischenstand nach jeder Runde, vorzeitige Entscheidung, Auflösung beim Abpfiff | ⏸ zurückgestellt – kommt ins Online-Duell |
| 30 | Kampagne: direkt weiter zum nächsten Level, Level-Anzeige „Level n von N“ | – |
| 31 | Kampagne: Animation „Welt geschafft“ (Aufstieg + Pokal) | 30 |
| 32 | iPhone: Hinweise unter der Kamera, Token-Anzeige im Spiel, Spielstand sichern (Export/Import) | – |
| 33 | Kampagne: Auswerten verrät keine Lösungen mehr, „Lösung anzeigen“ friert Sterne ein | – |
| 34 | Angefangene Aufstellungen merken und fortsetzen (Kampagne, Freispiel, Tag) | – |
| 35 | Aufstellungen: nur Spiele ab 2006, Welt 2 mit deutschen Top-Clubs, 15 Einträge ersetzen | – |

**Empfohlene Reihenfolge ab jetzt:** 27 → 32 → 33 → 34 → 35 → 30 → 31 → weitere Offline-Feinschliffe → Planung Online-Duell → 8

Prompt 7 steht bewusst vor der Tages-Challenge: Nur mit der neuen
Update-Strategie kommen neue Tages-Aufstellungen zuverlässig auf dem iPhone an.

Optische Vorlagen: `prototypes/scout-rad.html` (Prompt 6),
`prototypes/scout-profil.html` (Prompts 11–13) und
`prototypes/navigation.html` (Prompt 11b – Bildschirme, Übergänge,
Welten-Ausschmückung), `prototypes/ladescreen.html` (Prompt 11d) und
`prototypes/tageskarte.html` (Prompt 16, nur Variante „Ticket – neu“) und
`prototypes/scout-ausweis.html` (Prompt 17, nur Variante A) und
`prototypes/modus-kacheln.html` (Prompt 18, nur „A · neu“) und
`prototypes/regeln.html` (Prompt 19) und `prototypes/freispiel.html` (Prompt 20) und
`prototypes/teilen.html` (Prompt 24) und `prototypes/duell.html` (Prompts 25–26) und
`prototypes/welt-animation.html` (Prompt 31, nur „C + A“).

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

> ⚠️ **PFLICHT VOR DEM STORE-RELEASE – Duell muss automatisch und fehlerfrei
> laufen (Florian, 05.10.2026).** Das Duell wird der wichtigste Modus. Der
> heutige Weg über Links/Codes kopieren ist nur eine Übergangslösung und darf
> so NICHT in den Store. Vor dem Release müssen umgesetzt und mit echten
> Geräten (iPhone + Android, zwei Accounts) getestet sein:
> 1. **Automatischer Ergebnis-Abgleich** für beide Seiten über einen
>    Online-Speicher bzw. Accounts (Stufe „Accounts“ im Fahrplan): Duell
>    erscheint beim Gegner, Ergebnis kommt ohne Kopieren zurück, beide sehen
>    sofort „Beendet“ mit Richtigen und Zeiten je Runde.
> 2. **Push-Nachricht** bei neuer Herausforderung und bei Ergebnis.
> 3. **Universal Links (iOS) / App Links (Android)** über eine eigene Domain:
>    Einladungs-Links öffnen direkt die App, ohne App → Store-Seite.
> 4. **Fehlerfälle** sauber abgedeckt (offline, doppeltes Öffnen, App neu
>    installiert, Handywechsel) – nichts geht verloren, nichts zählt doppelt.
> 5. „Code einfügen“ nur noch als Notfall-Weg.
> 6. **Duell-Ablauf wie bei Quizduell (Florian, 05.10.2026):** Runden im
>    Wechsel – wer Runde 1 beginnt, spielt sie zuerst, der Gegner spielt
>    dieselbe Aufstellung nach und sieht danach beide Ergebnisse; Runde 2
>    beginnt der andere usw. Beginner einer Runde wählt aus 3 zufälligen
>    Vorschlägen den Wettbewerb/die Stufe (wie die Kategorie-Wahl).
>    Zwischenstand nach jeder Runde für BEIDE, Push „Du bist dran“, Frist
>    pro Zug (z. B. 48 h, sonst Sieg für den Gegner). Ersetzt dann das
>    heutige „erst alles A, dann alles B“ aus Prompt 25/26/29.
> Hochprofessionell und vollständig getestet umsetzen – dafür einen eigenen
> Plan mit Prompts schreiben, BEVOR Prompt 8 ausgeführt wird.

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

## Prompt 22 – Fehler aus dem Testlauf

```
Lies CLAUDE.md. Mehrere Korrekturen nach einem automatisierten Testlauf
(Stand nach Prompt 21) → Plan Mode, Plan zeigen, dann umsetzen. Jeder
Punkt ist im Code bzw. per Test bestätigt. An Token-Kosten, XP-Werten und
Spielregeln NICHTS ändern, außer wo unten ausdrücklich genannt.

1. Tages-Challenge: feste gemischte Reihenfolge statt Wochentags-Stufen
   Befund: getDailyChallenge() wählt nach WEEKDAY_DIFFICULTY aus Queues je
   Stufe. Der Tages-Pool ist verteilt 3/17/16/4/1 (Stufe 1–5) → Stufe 5
   (Sonntag) hat nur EINE Aufstellung und wiederholt sich jede Woche,
   Montag alle 3, Samstag alle 4 Wochen.
   Neu:
   - Keine Bindung an Wochentag oder Stufe mehr. Jeden Tag kommt die
     nächste Aufstellung aus DAILY_CHALLENGES in einer festen, gemischten
     Reihenfolge – für ALLE Spieler gleich (deterministisch, kein
     Math.random), damit das Teilen-Raster vergleichbar bleibt.
   - Keine Wiederholung, bis alle Aufstellungen des Pools einmal dran
     waren; dann beginnt eine neue Runde mit neuer Mischung. Die erste
     Aufstellung einer neuen Runde darf nicht die letzte der alten sein.
   - Stabil bei wachsendem Pool: optionales Feld since: "YYYY-MM-DD" je
     Tages-Eintrag (fehlt = DAILY_EPOCH). Ein Tag berücksichtigt nur
     Einträge mit since <= Tag. So ändern neue Aufstellungen niemals
     bereits vergangene Tage (Archiv, profile.daily bleiben korrekt).
   - Umsetzungsvorschlag: von Tag 1 an durchlaufen, Menge "used" je Runde
     führen, aus den verfügbaren unbenutzten Einträgen den mit dem
     kleinsten hashString(id + ":" + rundeNr) nehmen (mulberry32/
     hashString existieren). Ergebnis je dateKey cachen.
   - Ersetzt dailyQueueIndex/dailyQueueForDifficulty/WEEKDAY_DIFFICULTY.
     archivedDailyChallenges() nutzt dieselbe Funktion getDailyChallenge
     für jeden vergangenen Tag. Die Tages-Karte zeigt die Stufe der
     tatsächlichen Aufstellung (heute: WEEKDAY_DIFFICULTY in der
     Kartenlogik, ca. Zeile 2974).
   - Texte anpassen: Reiter MODI in So geht's ("Montag leicht, Sonntag am
     schwersten" → z. B. "Jeden Tag ein anderes Spiel, keine Wiederholung
     bis alle durch sind"), alle weiteren Fundstellen per grep.
   Test: 120 Tage ab DAILY_EPOCH simulieren und ausgeben – keine
   Wiederholung innerhalb einer Runde, Runde = Poolgröße, beim Rundenwechsel
   kein Doppel. Zusätzlich: einen Eintrag mit since in der Zukunft
   hinzufügen → alle vergangenen Tage bleiben identisch.

2. Hilfe-Buttons: erster Tipp geht verloren
   Befund: Ist ein Namensfeld aktiv und man tippt auf "Scout-Rad öffnen",
   "Aufdecken" oder "Korrigieren", passiert beim ersten Tipp nichts. Ursache:
   blur des Feldes → runFuzzyCheck() → renderPositionPanel() baut das Panel
   neu, der angetippte Button wird ersetzt, bevor click feuert (per Test für
   alle drei Buttons bestätigt; zweiter Tipp funktioniert).
   Fix: Panel-Buttons dürfen beim Antippen nicht ersetzt werden – z. B.
   pointerdown/mousedown auf den Panel-Buttons mit preventDefault (Feld
   behält den Fokus, Tastatur bleibt) und/oder renderPositionPanel im blur
   nur aufrufen, wenn sich der Zustand (near) wirklich geändert hat.
   Test: Feld fokussieren, Namen tippen, dann EIN Tipp auf jeden der drei
   Buttons (tap, nicht JS-click) → jeweils sofortige Wirkung.

3. Lange Namen werden abgeschnitten
   Befund: Bei 375/402/430 px Breite passen ca. 170–185 Namen nicht ins
   Feld (z. B. "Schweinsteiger", "Alexander-Arnold", Island 2016 fast
   komplett). applyNameFit() verkleinert nur ab 12 Zeichen pauschal.
   Fix: Schrift im Feld schrittweise verkleinern, bis scrollWidth <=
   clientWidth (Untergrenze ca. 8,5px), danach notfalls leicht engere
   Laufweite. Spielfeld und Felder NICHT verkleinern. Gilt für richtige,
   aufgedeckte, vorgegebene und nach dem Auswerten eingeblendete Namen.
   Test: alle Aufstellungen (Kampagne + Tag) bei 375×667, 402×874,
   430×932 mit allen Namen befüllen → 0 Felder mit scrollWidth >
   clientWidth.

4. Scout-Profil › Wissen: Stärke = Schwäche
   Befund: Hat man erst eine Wettbewerbs-Gruppe gespielt, steht sie
   gleichzeitig als "Stärke" und "Ausbaufähig" (z. B. Nationalmannschaften
   97 %). Fix: "Ausbaufähig" + Trainieren-Button nur, wenn mind. zwei
   Gruppen gespielt und die schwächste ≠ stärkste ist; sonst Hinweis
   "Spiel weitere Wettbewerbe, um Stärken und Schwächen zu sehen".

5. Tages-Archiv-Text
   Die Karte heißt "Verpasste Tages-Challenges nachspielen", enthält aber
   alle vergangenen (auch gespielte). Text ändern zu "Vergangene
   Tages-Challenges nachspielen".

6. Begriffe Achievement → Trophäe
   Toast "Achievement freigeschaltet" (showAchievementToast) und Quittung
   "Achievement: …" auf "Trophäe" umstellen – Anleitung und Profil sprechen
   nur von Trophäen. Interne Namen dürfen bleiben.

7. Schwierigkeits-Abzeichen
   renderDiffBadge zeigt im Spiel nur den Liga-Namen ("Bundesliga"), das
   Freispiel spricht von "Stufe 3". Abzeichen: "Stufe n · <Name>"
   (DIFF_LABEL selbst nicht ändern).

8. Scout-Rad-Fenster
   Nach einem Dreh steht im Fenster weiter "Noch keine Tipps für diese
   Position." – die Tipp-Chips im Fenster nach jedem Dreh aktualisieren.

9. Startguthaben
   Neue Profile starten mit 0 Token – im ersten Spiel steht bei jeder Hilfe
   "Zu wenig Token". Neu: ECONOMY.startTokens = 3, nur für NEU angelegte
   Profile (bestehende unverändert). Kurz im Reiter HILFEN erwähnen
   ("Zum Start: 3 🔍").

sw.js CACHE_NAME erhöhen. Zum Schluss alle Tests oben + ein kompletter
Durchlauf (Kampagne-Level, Tages-Challenge, Freispiel, Archiv) ohne
Konsolenfehler; Ergebnis kurz auflisten.
```

---

## Prompt 23 – Daten nachrecherchieren

```
Lies CLAUDE.md (Datengenauigkeit: nur mit verlässlicher Quelle, nie aus
dem Gedächtnis). Kleine Datenpflege in LINEUP_CHALLENGES → kurz Plan
zeigen, dann umsetzen; Hook-Ergebnis zeigen.

1. "ajax-eredivisie-1995" ist kein konkretes Spiel (comp "Eredivisie-
   Meisterschaft, Saison 1994/95", kein Datum) – verstößt gegen die Regel
   "echte Startelf einer bestimmten Partie" und fällt in der Wissens-
   Statistik aus der Jahrzehnt-Wertung. Ersetzen durch ein konkretes
   Ajax-Spiel derselben Ära und ähnlicher Schwierigkeit (z. B. ein
   Eredivisie-Spiel oder das CL-Finale 24.05.1995), recherchiert mit
   mindestens einer verlässlichen Quelle (Quelle im Commit nennen).
   Gleiche Stufe und Position im Kampagnenpfad beibehalten; id ändern,
   wenn sich das Spiel ändert, und profile-Daten zur alten id nicht
   brechen (alte Fortschritte dürfen verfallen, aber keine Fehler).
2. Für 6 Aufstellungen fehlt details (Rückennummer/Nationalität fürs
   Scout-Rad): cl-finale-istanbul-2005, schalke-meister-der-herzen-2001,
   el-clasico-2009, cl-finale-la-decima-2014, mancity-qpr-2012 und die
   neue Ajax-Aufstellung. Recherchieren und ergänzen (Format wie bei den
   anderen Einträgen); wo eine Angabe nicht sicher belegt ist, weglassen.
3. Bei Nationalmannschafts-Spielen keine nat-Angaben ergänzen (Scout-Rad
   blendet sie dort ohnehin aus).

sw.js CACHE_NAME erhöhen. Zum Schluss die Konsistenzprüfung zeigen.
```

---

## Prompt 24 – Tages-Challenge: Feinschliff

```
Lies CLAUDE.md. Zwei Änderungen an der Tages-Challenge (#dailyCard, Ticket
.t1 aus Prompt 16) → kurz Plan zeigen, dann umsetzen. Optik für Punkt 2
aus prototypes/teilen.html (Stub mit .done/.share-sm, Bild-Funktion draw).

1. Untere Einkerbung sitzt im gelösten Zustand zu hoch
   Befund (gemessen): .t1 hat feste height: 148px, die untere Einkerbung
   .notch.b hängt an dieser Höhe (bottom: -11px). Im GELÖSTEN Zustand ist
   der Inhalt von .main/.stub höher als 148px – das Mini-Raster hat bei
   Formationen mit 5 Reihen (4-2-3-1, 3-4-2-1, 4-1-4-1) 5×9px + 4×2px =
   53px. Dadurch wachsen .main und .stub auf ca. 152px (402px Breite) bzw.
   153,5px (430px), das Ticket wird unten länger, die Einkerbung bleibt bei
   148px stehen und sitzt sichtbar ca. 4–5px oberhalb der Unterkante. Bei
   375px tritt es nicht auf. Außerdem rückt das Raster dabei dicht an den
   Titel heran.
   Fix:
   - Gelöster Zustand muss in dieselben 148px passen wie der offene
     (Karte darf beim Lösen nicht springen): Mini-Raster kompakter, z. B.
     Kästchen 7px, Abstand 2px (5 Reihen = 43px), oder Raster-Höhe auf die
     Höhe der Zeile begrenzen und proportional skalieren.
   - Zusätzlich robust machen: .main und .stub dürfen nie höher als .t1
     werden (z. B. grid-template-rows: 100% bzw. height: 100% + min-height: 0
     und overflow: hidden), damit die Einkerbungen immer exakt auf Ober-
     und Unterkante sitzen – egal welcher Inhalt.
   - Offener Zustand optisch unverändert.
   Test: gelöster Zustand mit je einer 4- und einer 5-Reihen-Formation bei
   375×667, 402×874 und 430×932 – per getBoundingClientRect prüfen:
   Unterkante .main == Unterkante .stub == Unterkante .t1 und Mittelpunkt
   von .notch.b == Unterkante .t1 (±0,5px); Screenshots offen/gelöst
   nebeneinander.

2. Nach dem Spielen: "✓ Erledigt" + Teilen als Bild
   Befund: Teilen schickt heute nur Text (shareDailyResult). WhatsApp
   richtet jede Zeile links aus, die Formation aus Emoji-Kästchen fällt
   zusammen – mit Leerzeichen lässt sich das nicht zuverlässig zentrieren.
   a) Stub im gelösten Zustand: Statt des großen Buttons "TEILEN" steht
      der Status "✓ ERLEDIGT" (Anton, dunkelgrün auf Gold, grüner Haken-
      Kreis, kein Button). Darunter ein kleiner, dezenter Knopf
      "📤 Teilen" (Oswald 600, ca. 12,5px, dunkler Rand, leicht hell
      hinterlegt) – wie im Prototyp. Alles passt in die 148px aus Punkt 1.
   b) Teilen erzeugt ein Ergebnisbild (Canvas 1080×1350, PNG) im
      Starting-XI-Look wie im Prototyp: "TAGES-CHALLENGE · SPIELTAG n",
      "STARTING XI" (XI gold), langes Datum, große Trefferzahl "x/11",
      Tages-Sterne und 🔥-Serie, darunter das Spielfeld mit den 11
      Positionen der echten Formation (PITCH_LAYOUTS) als Kreise:
      grün = richtig, gold = mit Hilfe, grau = falsch, Kürzel im Kreis.
      Fuß: "SCHAFFST DU MEHR?" + Legende. KEINE Spielernamen, keine
      Partie/Mannschaft auf dem Bild (spoilerfrei für Freunde).
      Schriften vor dem Zeichnen laden (document.fonts.load für Anton und
      Oswald, lokale woff2), Titel per measureText mittig setzen.
   c) Daten: Für das Bild wird je Position das Ergebnis gebraucht. In
      evaluatePitch bei der Tages-Challenge zusätzlich
      profile.daily[dateKey].cells = { abbr: "g" | "y" | "x" } speichern.
      Für ältere Einträge ohne cells aus grid rekonstruieren (gleiche
      Zeilen-Gruppierung wie shareGridForMatch).
   d) Teilen: navigator.canShare({ files: [png] }) → navigator.share({
      files: [png], text: "Schaffst du mehr? ⚽ Starting XI · Spieltag n" }).
      Geht das nicht: bisheriges Text-Teilen bzw. Zwischenablage als
      Fallback. Abbrechen durch den Nutzer ist kein Fehler (kein Toast).
   Test: Bild für eine 4-3-3- und eine 4-2-3-1-Aufstellung erzeugen und als
   PNG ablegen/anzeigen; Stub-Screenshots gelöst bei 375/402/430; prüfen,
   dass auf dem Bild kein Spielername vorkommt.

sw.js CACHE_NAME erhöhen.
```

---

## Prompt 25 – Duell, Teil 1: Hosting, Links, Startseite, Duell-Bildschirme

```
Lies CLAUDE.md. Großes neues Feature "Duell gegen Freunde" → Plan Mode,
Plan zeigen und erst nach Freigabe umsetzen. Optik 1:1 aus
prototypes/duell.html (Bildschirme 0–3: Startseite, Übersicht, Neues Duell,
Einladung; CSS u. a. .board/.flip/.tk/.crest/.fr/.shelf/.fm/.lvl2/.rules2/
.fair/.inv/.startbtn). Prototyp nur lesen, nicht einbinden. Teil 2
(Spielablauf, Ergebnis, Belohnung) folgt in Prompt 26 – hier noch kein
Spielen, aber alle Daten und Links so anlegen, dass Prompt 26 darauf
aufbaut.

0. ZUERST prüfen: Wie ist die App erreichbar?
   Duelle laufen ohne Server über Links. Dafür braucht die App eine feste
   https-Adresse.
   - Prüfe git remote, ob GitHub Pages für das Repo aktiv ist (z. B. per
     curl auf https://<owner>.github.io/<repo>/startelf_check.html bzw. die
     in README/Settings genannte Adresse) und ob dort der aktuelle Stand
     ausgeliefert wird.
   - Ergebnis im Plan nennen. Ist Pages NICHT aktiv: anhalten und mir
     Schritt für Schritt erklären, wie ich es einschalte (Settings → Pages
     → Branch main, Ordner /root), dann weitermachen.
   - Adresse als Konstante APP_URL anlegen. Zur Laufzeit gilt: läuft die
     App über https, wird location.origin + location.pathname benutzt,
     sonst APP_URL (z. B. bei lokaler Datei).
   - Prüfe, dass sw.js Links mit #-Anhang normal ausliefert.

1. Datenmodell (in loadProfile mit Defaults, alte Profile migrieren)
   - profile.deviceId: einmalig zufällige ID.
   - profile.duelName: Anzeigename im Duell, beim ersten Duell einmal
     abfragen (max. 16 Zeichen, später im Scout-Profil änderbar).
   - profile.duels: { [duelId]: { role: "challenger"|"opponent",
     opponent: { name, deviceId, rank, level }, settings: { rounds: 1|3|5,
     seconds: 120|180|300, difficulty: 1–5|0 (gemischt) }, lineups: [ids],
     mine: [{ correct, seconds, left }] | [], theirs: [...] | null,
     status: "todo"|"waiting"|"done", created } }.
   - profile.duelStats: { wins, losses, draws, streak, bestStreak, sweeps,
     perOpponent: { [deviceId]: { name, w, l, d } } }.
   - profile.duelRecent: zuletzt in Duellen gespielte Aufstellungs-IDs
     (max. 40).

2. Aufstellungen fürs Duell
   - Pool: LINEUP_CHALLENGES + DAILY_CHALLENGES, gefiltert nach Stufe
     (bei "gemischt" alle).
   - Innerhalb eines Duells jede Aufstellung nur einmal; IDs aus
     profile.duelRecent zurückstellen (nur nehmen, wenn sonst zu wenig da
     sind), zufällig ziehen.

3. Links (ohne Server)
   - Herausforderung: <App-Adresse>#duel=<code>, Rückmeldung:
     <App-Adresse>#duelr=<code>. Immer # statt ?-Parameter.
   - code = base64url aus kompaktem JSON mit Versionsnummer und
     Prüfsumme. Inhalt Herausforderung: duelId, Absender (Name, deviceId,
     Rang, Level), settings, lineups, Ergebnisse des Absenders. Die
     Ergebnisse leicht verschleiern (z. B. XOR mit Schlüssel aus duelId),
     damit man sie nicht einfach aus dem Link lesen kann – im Code
     kommentieren, dass das kein echter Schutz ist.
   - Rückmeldung: duelId, Antwortender (Name, deviceId), seine Ergebnisse.
   - Beim App-Start (und bei hashchange) #duel / #duelr auswerten:
     #duel → Duell als "todo" anlegen (falls noch nicht vorhanden) und die
     Einladung öffnen; #duelr → passendes Duell finden, Ergebnis eintragen,
     Status "done" (Auswertung baut Prompt 26). Danach den # aus der
     Adresse entfernen (history.replaceState). Ungültiger oder eigener
     Link → freundlicher Hinweis, kein Absturz.
   - Teilen per navigator.share({ text, url }), sonst Zwischenablage.
     Text z. B. "⚔️ Lisa fordert dich bei Starting XI heraus – Best of 3,
     3 Min pro Aufstellung. Traust du dich?".
   - iPhone-Besonderheit: Links öffnen sich in Safari, NICHT in der
     installierten Home-Bildschirm-App, und beide haben getrennten
     Speicher. Deshalb zusätzlich: Wird ein Duell-Link im Browser (nicht
     standalone, matchMedia "(display-mode: standalone)") geöffnet, zeigt
     die Einladung zwei Wege: "Hier im Browser spielen" oder "In der App
     spielen" (Code kopieren). In der Duell-Übersicht gibt es dafür klein
     "Code einfügen" (Textfeld + Einfügen, akzeptiert ganzen Link oder
     nur den Code). Gleiches für Rückmeldungen.

4. Startseite
   - Die Kachel "Frei spielen" wird durch die Kachel "Duell" ersetzt
     (gleiches Raster wie Kampagne aus Prompt 18, grüner Rasen-Look wie im
     Prototyp): ⚔️, "Duell", Bildzeile = Wappen-du · Bilanz als
     Klappziffern (Siege : Niederlagen) · Wappen-?, Textzeile "Bilanz ·
     n Herausforderung(en)" bzw. "Bilanz" / ohne Duelle "Noch keine
     Duelle", Aktionsleiste "Freund herausfordern ›". Goldene Zahl oben
     rechts = Anzahl Duelle mit status "todo".
   - Frei spielen nur noch als kleine Textzeile unter den Kacheln:
     "🎲 Lieber allein trainieren? Frei spielen ›" (Oswald 400, gedimmt,
     "Frei spielen ›" gold, Oswald 600). Führt wie bisher zum
     Freispiel-Bildschirm.
   - Die Formkurve (profile.freeplayForm) nicht verlieren: klein oben auf
     dem Frei-spielen-Bildschirm anzeigen.
   - Startseite weiter ohne Scrollen auf 375×667 bis 430×932 (bei 375×667
     fehlen laut Prototyp ca. 17px → aus Abständen nehmen).

5. Neue Bildschirme (im Navigations-Stack aus Prompt 11b)
   - Übersicht "Deine Duelle": Anzeigetafel (Bilanz als Klappziffern,
     🔥-Siegesserie), großer grüner Knopf "⚔️ Neues Duell", "Offene
     Duelle" als Mini-Tickets (gold = du bist dran → Einladung/Spielen;
     dunkel = Gegner ist dran, mit "Erinnern" = Link erneut teilen),
     "Gegen deine Freunde" (Wappen, Name, Sieg-Balken, Stand), Regal mit
     den 4 Duell-Trophäen (Daten aus Prompt 26, bis dahin alle grau),
     klein "Code einfügen". Leerer Zustand freundlich erklären.
   - "Neues Duell": drei nummerierte Fragen – Wie viele Aufstellungen?
     (Einzel / Best of 3 / Best of 5, KEINE Ball-Symbole), Zeit pro
     Aufstellung (2 / 3 / 5 Min mit Stoppuhr-Ring), Schwierigkeit (Stufe
     1–5 oder Gemischt). Darunter Regeln in zwei Sätzen, Fair-Play-
     Schalter "Ich spiele fair", Knopf "Anpfiff & Link teilen" (erst aktiv
     mit Schalter). In Teil 1 legt der Knopf das Duell an (status "todo"
     für mich) – das Spielen selbst baut Prompt 26.
   - Einladung (Ticket-Optik): "<Name> fordert dich zum Duell", große
     Wappen + VS, goldener Abriss mit Format/Zeit/Stufe, Hinweis "hat schon
     gespielt – Ergebnisse siehst du nach deinem Spiel", eure Bilanz,
     Fair-Play-Schalter, "Annehmen & Anpfiff" und "Ablehnen".
   - Wappen: Schild-Form mit Anfangsbuchstaben, eigenes Wappen gold,
     Gegner blau.
   - Typografie laut CLAUDE.md, KEINE gesperrten Versalien-Überschriften
     (Prototyp: gemischte Schreibweise, Anton für Titel/Zahlen).

6. So geht's: Im Reiter MODI das Duell ergänzen (Spalte/Zeile in der
   Vergleichstabelle + ein Satz), Frei spielen bleibt erklärt.

sw.js CACHE_NAME erhöhen. Test: Startseite bei 375×667/402×874/430×932
ohne Scrollen; Duell anlegen → Link erzeugen → Link in einem zweiten
Browser-Profil öffnen → Einladung erscheint mit richtigen Daten; Code
einfügen funktioniert; ungültiger Link zeigt Hinweis; keine
Konsolenfehler. Hosting-Ergebnis aus Schritt 0 berichten.
```

---

## Prompt 26 – Duell, Teil 2: Spielen, Ergebnis, Belohnung

```
Lies CLAUDE.md. Fortsetzung von Prompt 25 → Plan Mode, Plan zeigen, dann
umsetzen. Optik aus prototypes/duell.html (Bildschirme 4–6: Walkout,
Spiel, Abpfiff; CSS u. a. .wr/.cd/.clock2/.series/.res2/.rr/.xp/.send2).

1. Spielablauf
   - Nach "Anpfiff & Link teilen" (Herausforderer) bzw. "Annehmen &
     Anpfiff" (Eingeladener) werden alle Runden nacheinander gespielt.
   - Vor jeder Runde der Walkout: Wettbewerb › Datum › Partie ›
     "Du stellst auf <Mannschaft>", dann 3-2-1-Anpfiff. Oben "Runde n von
     m · gegen <Name>", "Überspringen ›" jederzeit. KEIN Kontext-Satz.
     WICHTIG (Glitch aus dem Test): Die Partie steht fest auf zwei Zeilen
     (Heim / "gegen" Gast) und die Schriftgröße jeder Zeile wird vorher so
     berechnet, dass sie in eine Zeile passt (nowrap) – beim Verkleinern
     darf nichts umbrechen oder springen. Einmalige Animationen,
     prefers-reduced-motion beachten.
   - Spiel: bestehendes Spielfeld wiederverwenden, aber im Duell-Modus:
     keine Vorgaben, kein Scout-Rad, kein Aufdecken, kein Korrigieren
     (Aliase/Schreibvarianten aus Prompt 3 gelten weiter). Oben: eigener
     Stand x/11, Uhr als Klappziffern (Countdown der gewählten Zeit, ab
     0:30 rötlich, kein Blinken), Gegner "🔒 verdeckt", darunter "Runde n
     von m" mit Strichen. Unten "⏹ Abgeben – Zeit stoppen und werten".
   - Runde endet bei 11/11, Abgeben oder Zeitablauf. Gespeichert: correct,
     seconds (verbrauchte Zeit), left (wie oft die App während der Runde
     verlassen wurde, über visibilitychange).
   - Zwischen den Runden kurz "Runde n: x/11 in m:ss" + "Weiter zu Runde
     n+1 ›". Abbrechen mitten im Duell: Rückfrage; abgebrochene Runden
     zählen mit dem bis dahin erreichten Stand.

2. Auswertung
   - Runde: mehr Richtige gewinnt, sonst weniger Zeit, sonst
     unentschieden.
   - Duell: mehr gewonnene Runden; bei Gleichstand mehr Richtige
     insgesamt, dann weniger Gesamtzeit, sonst unentschieden.
   - Herausforderer: nach seinem Spiel status "waiting", Ergebnis erst
     nach Rückmelde-Link. Eingeladener: sieht sofort das Endergebnis und
     bekommt "📤 Ergebnis an <Name> senden" (#duelr-Link aus Prompt 25).
   - Abpfiff-Bildschirm wie im Prototyp: "Sieg!" / "Niederlage" /
     "Unentschieden", Stand der Runden als Klappziffern zwischen den
     Wappen, Begründungssatz, jede Runde als Zeile mit 👑 und Grund ("mehr
     Spieler gewusst" / "schneller"), XP-Kachel, neue Bilanz gegen den
     Gegner, "Ergebnis senden" bzw. "🔁 Revanche" (neues Duell mit
     gleichen Einstellungen gegen denselben Freund).
   - Fair Play: 🤝-Siegel je Spieler nur, wenn in keiner Runde die App
     verlassen wurde; sonst neutraler Hinweis "hat die App verlassen".

3. Belohnung (keine Token!)
   - XP_RULES.duelRoundXP = 15 je gespielter Aufstellung (direkt nach dem
     eigenen Spiel), XP_RULES.duelWinXP = 40 für den Duellsieg (sobald das
     Ergebnis feststeht). Über awardXP, ohne Serien-Bonus. Duelle geben
     keine Scout-Token und keine Sterne.
   - duelStats und perOpponent aktualisieren (Sieg/Niederlage/
     Unentschieden, Siegesserie, Sweeps), duelRecent fortschreiben.

4. Duell-Trophäen (neue Kategorie im Trophäenschrank + Regal in der
   Übersicht, ohne Token-Belohnung): "Erster Sieg" (1. Duellsieg),
   "Sweep" (Best of 3/5 ohne Rundenverlust gewonnen), "10 Siege",
   "5 Siege in Folge". Scout-Profil › Übersicht: Duell-Bilanz ergänzen.

sw.js CACHE_NAME erhöhen. Test mit zwei Browser-Profilen: Best of 3,
3 Min – A spielt (eine Runde mit Abgeben, eine per Zeitablauf mit kurz
gestellter Testzeit), Link → B spielt → B sieht Ergebnis → Rückmelde-Link
→ A sieht dasselbe Ergebnis; Bilanz, XP und Trophäen bei beiden korrekt;
Walkout bei 375/402/430 ohne Umbruch-Sprung (Screenshot-Serie); keine
Konsolenfehler.
```

---

## Prompt 27 – Duell-Einladung: Weg zum Anpfiff klarer machen

```
Lies CLAUDE.md. Kleine Korrektur an der Duell-Einladung (renderDuelInvite)
→ Änderung kurz beschreiben, dann umsetzen.

Befund (Praxistest: Kollege öffnet Duell-Link auf seinem Handy, sieht die
Einladung, kommt aber nicht ins Spiel; im Code bestätigt):
- Der Knopf "Hier im Browser spielen" (#duelPathBrowser) hat KEINEN
  Klick-Handler – Antippen bewirkt nichts, wirkt aber wie der Start-Knopf.
- "Annehmen & Anpfiff" ist grau, bis der Schalter "Ich spiele fair"
  angetippt wurde – das ist nirgends erklärt.
- Das eigene Wappen zeigt "D" (aus "Du") statt des eigenen Anfangs-
  buchstabens.

Fix:
1. Im Browser (nicht standalone) die Wahl klar machen:
   - "Hier im Browser spielen" wählt den Browser-Weg (invitePath =
     "browser", Knopf sichtbar aktiv), blendet den Hinweis-Kasten und den
     Code-Knopf aus und scrollt zum Fair-Play-Schalter.
   - "In der App spielen (Code kopieren)" bleibt wie bisher.
   - Solange kein Weg gewählt ist, steht "Hier im Browser spielen" als
     empfohlene Option vorausgewählt (Browser-Weg ist der Normalfall für
     Freunde ohne installierte App).
2. Fair-Play als klarer Schritt:
   - Über dem Schalter klein "Schritt 1: Bestätigen" bzw. am deaktivierten
     Knopf der Text "Erst „Ich spiele fair“ antippen" statt nur grau.
   - Tippt man auf den grauen Knopf, kurzer Hinweis (Toast) und der
     Schalter wird einmal dezent hervorgehoben (kein Blinken, einmalig).
3. Eigenes Wappen: Anfangsbuchstabe aus profile.duelName; ist noch kein
   Name gesetzt, "?" statt "D".
4. Danach wie gehabt: Name abfragen (falls nötig) → Walkout → Spiel.

sw.js CACHE_NAME erhöhen.
Test: Link in einem frischen Browser-Profil (ohne App, nicht standalone)
öffnen → mit höchstens 3 Taps (Browser-Weg ist vorgewählt, Fair-Play,
Annehmen) + Name im Spiel landen; grauen Knopf antippen zeigt Hinweis;
Screenshots bei 375/402.
```

---

> **Entscheidung 05.10.2026:** Das Link-Duell bleibt bis zum Store-Release
> wie es ist (nur Prompt 27 als kleiner Fix). Prompts 28 und 29 sind
> zurückgestellt: Ihre Inhalte (Ergebnis kommt an, beendete Duelle mit
> Richtigen/Zeiten, Duelle entfernen, Zwischenstand, Auflösung) gehen in
> die Planung „Online-Duell“ ein, die in den nächsten Tagen gründlich
> ausgearbeitet und erst zum Store-Release umgesetzt wird. Bis dahin Fokus
> auf die Offline-Modi.

## Prompt 28 – Duell: Ergebnis kommt sicher an, beendete Duelle, entfernen

```
Lies CLAUDE.md. Änderungen am Duell (Prompts 25–27) → Plan Mode, Plan
zeigen, dann umsetzen. Optik wie prototypes/duell.html.

Befund (Praxistest): Freund hat über den Link gespielt, beim Herausforderer
steht das Duell weiter unter "Offene Duelle" mit "<Name> ist dran". Ursache:
Ohne Server erfährt die App das Ergebnis NUR über den Rückmelde-Link
(#duelr). Der Freund muss ihn aktiv senden, und auf dem iPhone öffnet sich
der Link in Safari – die installierte Home-Bildschirm-App hat aber einen
getrennten Speicher, dort liegt das Duell. In Safari kommt dann "Zu dieser
Rückmeldung gibt es kein offenes Duell" bzw. es passiert nichts sichtbar.
Außerdem gibt es keine Liste beendeter Duelle – Ergebnisse sind nach dem
Abpfiff nicht mehr abrufbar.

1. Rückmeldung sicher machen
   - Eingeladener, nach dem letzten Spiel: Abpfiff zeigt als Hauptknopf
     "📤 Ergebnis an <Name> senden" mit Satz "Sonst sieht <Name> das
     Ergebnis nicht". Merken, ob gesendet wurde (resultSent); solange nicht,
     im Ticket des Duells "Ergebnis noch nicht gesendet ›".
   - Herausforderer, Ticket mit status "waiting": statt nur "<Name> ist
     dran" zusätzlich Knopf "Ergebnis eintragen" → öffnet direkt das
     Einfügen-Feld (ganzer Link oder Code, auch "📋 Aus Zwischenablage").
     Darunter klein: "Wenn <Name> gespielt hat, schickt er dir einen
     Ergebnis-Link. Tippe ihn lange an → Kopieren → hier einfügen."
   - Rückmelde-Link wird im Browser geöffnet (nicht standalone) und dort
     gibt es das Duell nicht: KEIN Fehler-Toast, sondern eine kleine
     Seite "Ergebnis von <Name>" mit den Zahlen (beide Spieler, soweit im
     Link) und dem Knopf "Code kopieren – dann in der App unter Duelle ›
     Ergebnis eintragen einfügen" (Code automatisch kopieren, wenn möglich).
   - Gleiche Rückmeldung zweimal eingefügt → kein Fehler, einfach das
     Ergebnis anzeigen (XP und Bilanz nicht doppelt zählen).

2. Beendete Duelle
   - In der Übersicht neuer Abschnitt "Beendete Duelle" (neueste zuerst,
     die letzten 10, Rest über "Alle anzeigen"): Mini-Ticket mit Wappen,
     "Du gegen <Name>", Format/Zeit/Stufe-Chips, Ergebnis als Klappziffern
     (z. B. 2 : 1) und Markierung Sieg (gold) / Niederlage (grau) /
     Unentschieden.
   - Antippen öffnet den Abpfiff-Bildschirm im Lese-Modus – für BEIDE
     Seiten gleich: pro Runde Aufstellung (Partie), eigene und gegnerische
     Richtige UND Zeit (m:ss), 👑 + Grund, Gesamt-Richtige und Gesamtzeit,
     Fair-Play-Siegel. Keine XP/Bilanz-Änderung beim erneuten Öffnen;
     Knöpfe "🔁 Revanche" und (Eingeladener, falls nicht gesendet)
     "Ergebnis senden".
   - Herausforderer-Duelle ohne Rückmeldung bleiben "offen" (mit
     "Ergebnis eintragen"), siehe auch Punkt 4.

3. Aufräumen: Übersicht bleibt übersichtlich (offene oben, beendete
   darunter, Freunde-Bilanz, Trophäen). Startseiten-Kachel: Zahl = Duelle,
   bei denen ich etwas tun muss (spielen ODER Ergebnis senden).

4. Duelle entfernen (Befund in der App: offene Duelle lassen sich gar
   nicht entfernen – nur eine Einladung über "Ablehnen"; ein selbst
   angelegtes, nie gespieltes Duell oder ein Duell, auf dessen Rückmeldung
   man nie mehr wartet, bleibt für immer unter "Offene Duelle")
   - Jedes Ticket (offen und beendet) bekommt rechts oben einen kleinen
     "⋯"-Knopf (Trefferfläche mind. 44px) → Aktionsblatt im App-Stil (KEIN
     confirm()/alert()). Optionen je nach Zustand:
     · Offen, ich bin dran (Einladung): "Ablehnen".
     · Offen, selbst angelegt und noch nicht gespielt: "Duell löschen".
     · Offen, Gegner ist dran: "Erinnern" (Link erneut teilen), "Ergebnis
       eintragen", "Duell zurückziehen" – mit Satz: "Dein Freund kann noch
       spielen, sein Ergebnis wird dann aber nicht mehr gezählt."
     · Beendet: "Ergebnis ansehen", "Revanche", "Aus Verlauf entfernen".
   - Bilanz, XP, Trophäen und duelStats bleiben beim Entfernen IMMER
     unverändert – entfernt wird nur der Eintrag aus der Liste. Ein
     zurückgezogenes/gelöschtes offenes Duell zählt nicht als Niederlage.
   - Nach dem Entfernen Toast "Duell entfernt · Rückgängig" (ca. 5 s,
     Rückgängig stellt den Eintrag exakt wieder her). Zurückziehen eines
     offenen Duells, bei dem der Gegner noch spielen könnte, vorher im
     Aktionsblatt bestätigen.
   - Kommt später doch eine Rückmeldung (#duelr) zu einem entfernten
     Duell: freundlicher Hinweis "Dieses Duell hast du entfernt", nichts
     zählen, kein Absturz (entfernte duelIds in profile.duelRemoved merken,
     max. 100).
   - Am Ende der Liste "Beendete Duelle": "Verlauf leeren" (mit Bestätigung
     im Aktionsblatt; Bilanz bleibt).
   - Automatisch: offene Duelle ohne Bewegung seit 14 Tagen als
     "abgelaufen" markieren (graues Ticket, Aktion "Entfernen"), nicht
     still löschen.

Hinweis für später (nicht in diesem Prompt): Wirklich automatisch für beide
Seiten wird das erst mit einem kleinen Online-Speicher bzw. Accounts
(siehe Fahrplan, Stufe Accounts) oder mit der Store-App (Links öffnen dann
direkt die App).

sw.js CACHE_NAME erhöhen. Test mit zwei Browser-Profilen: A fordert
heraus, B spielt → B sieht Ergebnis + Senden-Hinweis → Rückmelde-Link in
einem DRITTEN Profil ohne das Duell öffnen → Ergebnis-Seite mit Code
kopieren → Code bei A einfügen → bei A und B steht das Duell unter
"Beendete Duelle" mit identischen Zahlen (Richtige + Zeiten je Runde);
erneutes Öffnen/Einfügen zählt nichts doppelt. Entfernen: je ein offenes
(eigenes, ungespieltes), ein zurückgezogenes und ein beendetes Duell
entfernen → Liste aktualisiert, Bilanz/XP unverändert, Rückgängig stellt
wieder her, spätere Rückmeldung zum entfernten Duell zeigt nur den
Hinweis; keine Konsolenfehler.
```

---

## Prompt 29 – Duell: Zwischenstand nach jeder Runde (Best of 3/5)

```
Lies CLAUDE.md. Erweiterung des Duell-Spielablaufs (Prompt 26, Bildschirm
zwischen den Runden + Abpfiff) → kurz Plan zeigen, dann umsetzen. Optik in
der Sprache von prototypes/duell.html (Wappen, Klappziffern, Anzeigetafel).

Befund: Zwischen den Runden zeigt die App heute nur das eigene Ergebnis
("Runde 1: 9/11 in 2:14 · Noch 2 Aufstellungen"), keinen Spielstand. Ziel:
Man soll nach jeder Runde wissen, wie es steht.

Wichtig – zwei Seiten, weil nacheinander gespielt wird:
- Der EINGELADENE spielt als Zweiter, die Ergebnisse des Herausforderers
  stehen schon im Link. Er bekommt den echten Zwischenstand.
- Der HERAUSFORDERER spielt zuerst, der Gegner hat noch nicht gespielt –
  für ihn gibt es noch keinen Spielstand (das kommt erst mit Accounts).

1. Eingeladener – nach jeder Runde "Runden-Auflösung":
   - Anzeigetafel: Wappen Du · Klappziffern Spielstand (z. B. 1 : 0) ·
     Wappen Gegner, darüber "Nach Runde n von m".
   - Die Runde im Vergleich: "Du 9/11 · 2:14" gegen "<Name> 8/11 · 2:41",
     👑 beim Rundensieger + Grund ("mehr Spieler gewusst" / "schneller" /
     "unentschieden"). Aufdecken als kurze einmalige Animation (erst deine
     Zahl, dann die des Gegners, dann Krone + Spielstand) – kein Blinken,
     prefers-reduced-motion beachten.
   - Runden-Striche oben färben: gold = du, blau = Gegner, grau =
     unentschieden, leer = offen.
   - Ist das Duell vorzeitig entschieden (z. B. 2 : 0 im Best of 3, 3 : 0
     oder 3 : 1 im Best of 5): Banner "Entschieden!" und direkt zum
     Abpfiff – restliche Runden werden nicht gespielt (Wertung bleibt
     korrekt, weil nur bei Runden-Gleichstand die Summen zählen). XP nur
     für tatsächlich gespielte Aufstellungen.
   - Sonst "Weiter zu Runde n+1 ›".
2. Herausforderer – nach jeder Runde:
   - Eigenes Ergebnis groß ("Runde 1: 9/11 in 2:14"), Runden-Striche nur
     mit eigenen Zahlen, darunter: "<Name> spielt danach – den Spielstand
     siehst du, sobald das Ergebnis zurückkommt." Dann "Weiter ›".
3. Abpfiff (beide Seiten, auch beim späteren Öffnen über "Beendete
   Duelle" aus Prompt 28): beim ERSTEN Ansehen die Runden nacheinander
   auflösen (Runde 1 → Stand 1 : 0, Runde 2 → 1 : 1, Runde 3 → 2 : 1, je
   ca. 0,8 s, Überspringen per Tipp), danach die bekannte Gesamtansicht.
   Beim erneuten Öffnen sofort die Gesamtansicht.
4. Daten: Für die vorzeitige Entscheidung beim Eingeladenen speichern,
   wie viele Runden tatsächlich gespielt wurden; Rückmelde-Link (#duelr)
   und Auswertung beim Herausforderer müssen damit umgehen (fehlende
   Runden = nicht gespielt, nicht 0/11).

sw.js CACHE_NAME erhöhen. Test mit zwei Browser-Profilen, Best of 3 und
Best of 5: Herausforderer sieht nach jeder Runde nur sein Ergebnis +
Hinweis; Eingeladener sieht nach jeder Runde den richtigen Spielstand;
vorzeitige Entscheidung (2 : 0) beendet korrekt; Rückmeldung beim
Herausforderer zeigt dasselbe Ergebnis und dieselbe Auflösung; XP/Bilanz
stimmen; keine Konsolenfehler.
```

---

## Prompt 30 – Kampagne: direkt weiter zum nächsten Level + Level-Anzeige

```
Lies CLAUDE.md. Spielfluss in der Kampagne verbessern → kurz Plan zeigen,
dann umsetzen. Keine neuen Bildschirme, keine Änderung an Sternen, XP,
Vorgaben (Prompt 9) oder Freischaltlogik.

Befund (Praxistest + Code): Nach dem Auswerten eines Kampagnen-Levels
(Ergebnis-Block in evaluatePitch, currentLevelContext/hasNext) gibt es
bestanden nur "← Zurück zum Pfad", nach dem letzten Level der Welt
"🏆 Stufe geschafft! Zur Weltkarte", nicht bestanden "Zurück zum Pfad" +
"Nochmal versuchen". Man muss nach jedem Level zurück zum Pfad – das
bremst. Außerdem sieht man im Spiel nicht, im wievielten Level man ist
(renderDiffBadge zeigt nur die Stufe).

1. Knöpfe nach dem Auswerten (nur Kampagne), gleiche Zeile/Platz wie
   heute, links klein (btn-outline), rechts Hauptknopf (btn-gold, breiter):
   - Bestanden, es gibt ein nächstes Level in dieser Welt:
     links "‹ Pfad", rechts "Level n+1 ›" → startet direkt die Einleitung
     des nächsten Levels (currentLevelContext auf das nächste Level setzen,
     startMatch). Der Navigations-Stack bleibt sauber: "Zurück" aus dem
     neuen Level führt zum Pfad, nicht zum alten Ergebnis.
   - Wurde ein bereits bestandenes Level wiederholt: "Level n+1 ›" führt
     trotzdem zum direkt folgenden Level (ist es gesperrt, gibt es den
     Knopf nicht).
   - Bestanden, letztes Level der Welt: links "‹ Pfad", rechts
     "🏆 Welt geschafft! Weiter ›" → Weltkarte (neue Welt ist frei).
   - Nicht bestanden: links "‹ Pfad", rechts "Nochmal versuchen".
   - Freispiel und Tages-Challenge bleiben unverändert.

2. Level-Anzeige in Einleitung und Spielfeld (nur Kampagne)
   - Das Abzeichen wird zu "<Weltname> · Level n von N" (Farbe der Welt
     wie bisher). Darunter eine kleine Punktreihe der Welt: bestandene
     Level gold gefüllt, aktuelles Level größer/umrandet, offene als leere
     Kreise (Optik passend zur Welten-Kette der Kampagnen-Kachel).
   - Freispiel/Tages-Challenge/Duell: Abzeichen wie bisher
     ("Stufe n · Name").
   - Schriften laut CLAUDE.md (Anton für "Level n von N" nicht nötig –
     Oswald 600 reicht, keine gesperrten Versalien).

3. Platz: Einleitung und Spielfeld dürfen dadurch nicht höher werden als
   heute (Spielfeld nicht verkleinern); Ergebnis-Bereich bleibt ohne
   zusätzliches Scrollen.

sw.js CACHE_NAME erhöhen. Test: Level 1 bestehen → "Level 2 ›" startet
Level 2 direkt, Zurück führt zum Pfad; letztes Level einer Welt → Weltkarte
mit freigeschalteter Welt; nicht bestehen → Nochmal/Pfad; altes Level
wiederholen → Knopf zum Folgelevel; Abzeichen + Punktreihe stimmen mit dem
Pfad überein; Screenshots bei 375/402/430; keine Konsolenfehler.
```

---

## Merkzettel (Florian möchte daran erinnert werden)

- **Welt-geschafft-Animation** (05.10.2026, noch nicht entschieden): nach
  dem letzten Level einer Welt eine besondere Animation (≈ 5–7 s,
  überspringbar, einmalig, kein Blinken, reduced motion beachten). Ideen:
  A „Pokalübergabe“ (Pokal steigt auf, Gravur mit Weltname, Konfetti in
  Weltfarbe), B „Reise zur nächsten Welt“ (Ball/Maskottchen rollt auf der
  Weltkarte über den Pfad zum nächsten Stadion, Schloss bricht auf,
  Flutlichter gehen nacheinander an), C „Aufstieg“ (Tabelle, eigenes Team
  klettert auf Platz 1, Banner „Aufstieg in die Regionalliga!“), D
  „Tunnel in die neue Liga“ (Walkout-Stil, größeres Stadion, Name der
  neuen Welt). Entschieden: C + A → Prompt 31.
  Eigene Gestaltung, keine Figuren/Grafiken aus fremden Spielen.

## Prompt 31 – Kampagne: Animation „Welt geschafft“ (Aufstieg + Pokal)

```
Lies CLAUDE.md. Neue Feier-Animation beim Abschluss einer Kampagnen-Welt →
kurz Plan zeigen, dann umsetzen. Optik/Ablauf 1:1 aus
prototypes/welt-animation.html, maßgeblich ist NUR die Variante "C + A"
(Funktionen playC und playA, CSS .c-*/.a-*, Konfetti-Funktion). Prototyp nur
lesen, nicht einbinden. Voraussetzung: Prompt 30 (Knopf "🏆 Welt geschafft!
Weiter ›").

1. Wann
   - Genau einmal pro Welt: wenn durch das aktuelle Ergebnis zum ERSTEN
     Mal alle Level einer Welt bestanden sind (gleiche Bedingung wie die
     Trophäe "<Welt>-Pokal – Alle Level bestanden" aus CAMPAIGN_TROPHIES).
     Merken in profile.worldCelebrated[tier] (Migration in loadProfile),
     damit sie nie doppelt kommt.
   - Startet direkt nach "Auswerten", VOR Level-Up-Overlay und Trophäen-
     Toasts (die danach wie gewohnt folgen bzw. in einer Warteschlange
     laufen – nichts darf sich überlagern).
   - Vollbild-Overlay über dem Spielfeld, kein Navigations-Eintrag.

2. Ablauf C → A (ca. 10 s)
   C · Aufstieg: Kopf "<Weltname> · letzter Spieltag" / "Wer steigt auf?",
     Tabelle mit 8 Teams: 7 erfundene Teamnamen (Liste je Welt im Code,
     KEINE echten Vereine/Wappen) + eigenes Team (profile.duelName, sonst
     "Dein Team") startet auf Platz 8 und klettert Platz für Platz auf 1
     (Punkte zählen mit, grüner Pfeil ▲, Aufstiegszone links grün). Dann
     Banner "Aufstieg in die <nächste Welt>!" + "Welt n+1 ist
     freigeschaltet" + Konfetti in Gold und Weltfarbe (DIFF_COLOR).
     Letzte Welt (Weltklasse): Kopf "Weltklasse · letzter Spieltag",
     Banner "Du bist Weltklasse!" + "Alle Welten geschafft".
   A · Pokal: Abblenden, Flutlicht-Kegel, Pokal steigt auf und dreht sich
     einmal, "Welt geschafft!" ("geschafft" gold), Plakette
     "<Weltname>-Pokal" + "⭐ x / y · kommt in deinen Trophäenschrank"
     (x/y = Kampagnen-Sterne dieser Welt aus profile.campaign.stars). Auf
     dem Pokal-Schild "WELT n". Danach Knopf "Weiter ›" → schließt das
     Overlay, dann der Ergebnis-Bildschirm mit den Knöpfen aus Prompt 30.

3. Regeln
   - Überspringen: "Tippen zum Überspringen" unten; erster Tipp → Ende von
     C bzw. direkt zu A, zweiter Tipp → Endzustand von A mit "Weiter ›".
   - Nur einmalige Animationen, kein Blinken/Dauerschleife (CLAUDE.md);
     prefers-reduced-motion: direkt Endzustände ohne Bewegung.
   - Schriften laut CLAUDE.md (Anton für Titel/Zahlen, Oswald sonst).
   - Pokal als eigenes SVG wie im Prototyp, Konfetti als Canvas, nach
     Ende aufräumen (requestAnimationFrame stoppen, Canvas entfernen).
   - Bonus (falls einfach): Im Trophäenschrank Tipp auf einen gewonnenen
     <Welt>-Pokal → Animation erneut ansehen (nur A, ohne Belohnungen).

sw.js CACHE_NAME erhöhen. Test: Testprofil mit 9/10 bestandenen Leveln in
Welt 1 → letztes Level bestehen → C dann A laufen einmal, danach Ergebnis
mit "🏆 Welt geschafft! Weiter ›"; dasselbe Level erneut bestehen → keine
Animation; Überspringen mit 1 und 2 Tipps; Welt 5 zeigt "Du bist
Weltklasse!"; reduced motion; Screenshot-Serie bei 375/402/430; keine
Konsolenfehler.
```

---

## Prompt 32 – iPhone-Feinschliff: Hinweise unter der Kamera, Token im Spiel, Spielstand sichern

```
Lies CLAUDE.md. Drei Korrekturen nach Praxistest auf dem iPhone → kurz Plan
zeigen, dann umsetzen.

1. Hinweise (XP-Boni, Trophäen, Token …) verschwinden hinter der Kamera
   Befund: .toast-stack ist position: fixed; top: 16px. Die App läuft mit
   viewport-fit=cover und Statusleiste "black-translucent" – auf iPhones mit
   Dynamic Island/Notch liegen die Hinweise damit genau unter der Kamera und
   sind abgeschnitten.
   Fix: top: calc(env(safe-area-inset-top, 0px) + 10px) (bzw. max(16px, …)).
   Alle weiteren fixierten Elemente am oberen Rand prüfen (grep "position:
   fixed", Overlays, Bottom-Sheets oben, Konfetti ist egal) und genauso an
   die sichere Zone anpassen. Test per Screenshot mit simuliertem
   safe-area-inset-top von 59px (iPhone 16 Pro) – Hinweise vollständig
   sichtbar, nichts überlappt die Kopfzeile des Spielfelds unschön.

2. Scout-Token im Spiel sichtbar machen
   Befund: Auf dem Spielfeld sieht man nirgends, wie viele 🔍 man hat.
   Fix: In der Kopfzeile des Spielfelds (Zeile mit "← Abbrechen" und
   "ℹ️ Regeln") ein kleiner Token-Chip "🔍 n" im Stil des Chips der
   Scout-Ausweis-Kachel (Prompt 17), dezent, rechts neben bzw. vor
   "Regeln". Aktualisiert sich sofort bei Scout-Rad, Aufdecken und neuen
   Token. Nur in Kampagne, Freispiel und Tages-Challenge – im Duell NICHT
   (dort gibt es keine Hilfen). Kopfzeile darf nicht höher werden, Spielfeld
   nicht kleiner.

3. Spielstand geht verloren
   Befund (Kollege, iPhone): Nach dem Schließen der App ist der Spielstand
   weg. Der Code speichert korrekt in localStorage; saveProfile fängt
   Fehler aber still ab. Typische Ursachen auf dem iPhone: Privates Surfen
   (Speicher wird beim Schließen gelöscht), Öffnen in einem In-App-Browser
   (z. B. aus WhatsApp), "Alle Cookies blockieren" (localStorage wirft
   Fehler) oder Safari vs. Home-Bildschirm-App (getrennte Speicher).
   Fix:
   - Beim Start testen, ob localStorage wirklich schreib-/lesbar ist
     (Testwert schreiben, lesen, löschen). Wenn nicht, oder wenn
     saveProfile fehlschlägt: einmal pro Sitzung ein gut sichtbarer, aber
     ruhiger Hinweis (Bottom-Sheet, kein Blinken): "Dein Spielstand kann
     hier nicht gespeichert werden. Öffne Starting XI in Safari (nicht im
     privaten Modus) und füge es über Teilen → „Zum Home-Bildschirm“ hinzu."
   - navigator.storage.persist() anfragen, wenn verfügbar (verhindert
     automatisches Löschen durch den Browser), Ergebnis ignorieren, wenn
     nicht unterstützt.
   - Läuft die App im Browser (nicht standalone) und es gibt schon
     Fortschritt: einmalig dezenter Tipp "Tipp: Zum Home-Bildschirm
     hinzufügen, dann bleibt dein Spielstand sicher und die App startet im
     Vollbild." (schließbar, merken in profile).
   - Spielstand-Export/-Import (war für Prompt 8 geplant) JETZT
     vorziehen: Scout-Profil → "Spielstand sichern" (Code kopieren bzw. als
     Datei teilen) und "Spielstand laden" (Code einfügen, mit Bestätigung).
     Damit lässt sich ein Stand auch von Safari in die Home-Bildschirm-App
     umziehen.

sw.js CACHE_NAME erhöhen. Test: Toasts mit simulierter Safe-Area;
Token-Chip ändert sich beim Drehen/Aufdecken, im Duell unsichtbar;
localStorage gesperrt simulieren (setItem wirft) → Hinweis erscheint,
App läuft weiter; Export → neues Profil → Import stellt alles wieder her;
keine Konsolenfehler.
```

---

## Prompt 33 – Auswerten verrät die Lösung (Kampagne)

```
Lies CLAUDE.md. Spiellogik-Korrektur beim Auswerten → Plan Mode, Plan
zeigen, dann umsetzen.

Befund (Praxistest + Code): evaluatePitch() schreibt bei jeder falschen
oder leeren Position den richtigen Namen ins Feld (if (!isCorrect)
input.value = target). Wer in der Kampagne früh auf "Auswerten" drückt –
auch mit leeren Feldern –, sieht alle Lösungen, tippt bei "Nochmal
versuchen" einfach ab und besteht (7/11) bzw. holt sich ⭐⭐⭐. Das
untergräbt die Kampagne.

1. Kampagne – nicht bestanden (< PASS_THRESHOLD):
   - Richtige Positionen grün wie bisher. Falsche/leere Positionen rot bzw.
     leer markiert, aber OHNE Namen (Feld zeigt "?").
   - Hinweis im Ergebnis: "Die Lösung siehst du, sobald du das Level
     bestanden hast." + "Nochmal versuchen" (Prompt 30) / "‹ Pfad".
   - Beim erneuten Versuch bleiben die schon richtigen Namen NICHT stehen
     (Level startet normal mit den festen Vorgaben aus Prompt 9).

2. Kampagne – bestanden:
   - Fehlende Namen zunächst ebenfalls verdeckt ("?"). Darunter Knopf
     "👁 Lösung anzeigen". Antippen deckt alle fehlenden Namen auf (wie
     heute), ABER: für dieses Level gilt danach "Lösung angesehen" –
     die Kampagnen-Sterne dieses Levels sind auf dem aktuellen Stand
     eingefroren (kein weiterer Stern durch Wiederholen).
     Vor dem Aufdecken kurzer Hinweis im Aktionsblatt: "Wenn du die
     Lösung ansiehst, kannst du in diesem Level keine weiteren Sterne mehr
     holen." [Lösung anzeigen] [Lieber nochmal probieren]. Bei bereits
     ⭐⭐⭐ ohne Hinweis direkt aufdecken.
   - Speichern in profile.campaign.solutionSeen[levelId] (Migration).
   - Auf dem Pfad zeigt ein Level mit eingefrorenen Sternen ein kleines 👁.

3. Positions-XP fair halten (Kampagne + Freispiel): Positionen, deren
   Lösung angezeigt wurde, zählen später nicht mehr als "neu gelöst"
   (nur noch Trainings-XP). Merken je Aufstellung (z. B. in profile.best
   als seenAbbrs).

4. Unverändert: Tages-Challenge (nur 1 Versuch) und Freispiel (Training)
   zeigen nach dem Auswerten weiterhin sofort alle Lösungen. Duell
   unverändert.

5. Auswerten mit leeren Feldern (alle Modi außer Duell): Sind noch
   Positionen leer, vorher kurzes Aktionsblatt "Noch n Positionen leer.
   Trotzdem auswerten?" [Weiter tippen] [Auswerten] – kein confirm().

sw.js CACHE_NAME erhöhen. Test: Kampagnen-Level mit 3 Richtigen auswerten
→ keine Namen der übrigen 8 sichtbar, Retry startet leer; mit 8 bestehen →
"?" + Lösung anzeigen → Hinweis → aufdecken → Level 👁, Wiederholen gibt
keinen neuen Stern; ⭐⭐⭐ bestehen → Lösung direkt; Freispiel/Tag
unverändert; Leere-Felder-Hinweis erscheint; keine Konsolenfehler.
```

---

## Prompt 34 – Angefangene Aufstellungen merken und fortsetzen

```
Lies CLAUDE.md. Neues Verhalten beim Verlassen eines laufenden Spiels →
Plan Mode, Plan zeigen, dann umsetzen.

Befund (Praxistest): Wer eine Aufstellung anfängt und auf "← Abbrechen"/
Zurück geht (oder die App schließt), verliert alle Eingaben. Beim erneuten
Öffnen ist alles leer. Nebeneffekt heute: Wer Scout-Rad/Aufdecken benutzt
hat, verlässt das Level und startet neu, hat wieder "keine Hilfe benutzt"
→ ⭐⭐⭐ trotz Hilfe möglich.

1. Entwurf speichern (Kampagne, Freispiel, Tages-Challenge – NICHT Duell)
   - profile.drafts[matchId] = { entries: { abbr: { value, state } }
     (state: ok/near/revealed/korrigiert), hintsUsed, tokenRevealed,
     fuzzyCorrected, Scout-Rad-Tipps je Position, combo, updated }.
     Vorgaben (prefilled) nicht speichern – die ergeben sich aus Prompt 9.
   - Speichern bei jeder Änderung (entprellt), bei "Abbrechen", Zurück-
     Geste/popstate und bei visibilitychange/pagehide (App wird
     geschlossen).
   - Beim Auswerten wird der Entwurf gelöscht. Max. 20 Entwürfe, älteste
     zuerst verwerfen; Entwürfe älter als 30 Tage verwerfen.
   - Lösungen werden nie im Entwurf gespeichert (Prompt 33 beachten:
     verdeckte Namen bleiben verdeckt).

2. Fortsetzen
   - Startet man eine Aufstellung mit Entwurf, werden alle Eingaben,
     Zustände (grün/gold/aufgedeckt), Scout-Rad-Tipps und Hilfe-Markierungen
     wiederhergestellt; Kombo wie gespeichert. Kurzer Hinweis (Toast):
     "Weiter, wo du aufgehört hast".
   - Hilfe-Markierungen bleiben bis zum Auswerten bestehen – Verlassen und
     neu starten setzt sie NICHT mehr zurück (kein ⭐⭐⭐ nach Hilfe).
     Verbrauchte Token werden nicht erstattet.
   - Optional im Spiel klein "Felder leeren" (mit Bestätigung im
     Aktionsblatt): leert Eingaben, Hilfe-Markierungen bleiben.

3. Sichtbar machen
   - Kampagnen-Pfad: Level mit Entwurf bekommt ein kleines ✏️ und den
     Hinweis "angefangen". Die Kampagnen-Kachel "Weiter spielen" startet –
     wenn vorhanden – das angefangene Level der aktuellen Welt.
   - Tages-Karte: Ist die heutige Challenge angefangen, statt "STARTEN"
     "WEITER" (gleiche Optik).
   - Frei spielen: Gibt es einen Freispiel-Entwurf, oben eine kleine Karte
     "Angefangen: <Partie> · Weiterspielen ›" (neuester Entwurf, schließbar
     = Entwurf verwerfen mit Bestätigung).

sw.js CACHE_NAME erhöhen. Test: Kampagnen-Level, 4 Namen + 1 Scout-Rad-
Tipp eingeben, Abbrechen → Pfad zeigt ✏️ → Level öffnen → alles wieder da,
Hilfe zählt weiter (kein ⭐⭐⭐ möglich); App neu laden (pagehide) →
Entwurf bleibt; Auswerten löscht Entwurf; Tages-Karte zeigt WEITER;
Freispiel-Karte erscheint; Duell bleibt unverändert; keine
Konsolenfehler.
```

---

## Prompt 35 – Aufstellungen: nur Spiele ab 2006, mehr deutsche Top-Clubs

```
Lies CLAUDE.md (Datengenauigkeit: jede neue Aufstellung nur mit mindestens
einer verlässlichen Quelle, nie aus dem Gedächtnis; Quellen im Commit
nennen). Datenpflege in LINEUP_CHALLENGES und DAILY_CHALLENGES → Plan Mode:
erst die Ersatz-Liste (Spiel, Datum, Seite, Stufe, Quelle) zeigen und von
mir freigeben lassen, DANN eintragen. Hook-Ergebnis zeigen.

Regel (Florian, verbindlich): Es kommen nur Spiele ab dem 01.01.2006 in
die App. Bekanntheit geht vor: lieber Spiele großer Vereine und
Nationalteams, die Fans kennen.

1. Zu ersetzen (Stand Prompt 23, per Code geprüft)
   Kampagne – vor 2006:
   - Welt 2: manutd-treble-1999, arsenal-invincibles-2004
   - Welt 3: cl-finale-istanbul-2005
   - Welt 4: brasilien-wm-finale-1994, dortmund-meister-1996,
     schalke-meister-der-herzen-2001, werder-double-2004
   - Welt 5: barcelona-dreamteam-1994, deportivo-liga-2000,
     senegal-frankreich-2002
   Kampagne – zu unbekannt:
   - Welt 2: st-pauli-osnabrueck-2024 (2. Bundesliga, kaum bekannt)
   Tages-Pool – vor 2006:
   - cl-finale-istanbul-2005-milan, senegal-frankreich-2002-frankreich,
     cl-finale-porto-2004, em-finale-2004-griechenland

2. Ersatz – Schwerpunkt Deutschland
   - Welt 2 (Regionalliga) bekommt 3 neue Aufstellungen deutscher
     Top-Clubs / der Nationalmannschaft, ab 2006, bekannt aber nicht
     ganz leicht. Ideen zum Prüfen (nur nehmen, wenn sauber belegt):
     FC Bayern im CL-Finale 2013 oder 2020, Borussia Dortmund im
     DFB-Pokal-Finale 2012 oder CL-Finale 2013, Deutschland im
     WM-Halbfinale 2014 (7:1), Bayer Leverkusen in der Meistersaison
     2023/24 (nicht dieselbe Partie wie in Welt 1).
   - Welten 3–5: Ersatz in passender Schwierigkeit, bevorzugt deutsch
     bzw. bekannte europäische Top-Spiele ab 2006 (z. B. VfB Stuttgart
     Meister 2007, VfL Wolfsburg Meister 2009, Schalke 04 bei Inter 5:2
     im CL-Viertelfinale 2011, Werder Bremen im UEFA-Cup-Finale 2009) –
     Welt 5 darf „exotischer“ sein, aber ebenfalls ab 2006.
   - Tages-Pool: 4 Ersatz-Aufstellungen ab 2006, Stufen so wählen, dass
     der Pool ausgeglichener wird (heute 3/17/16/4/1 je Stufe →
     bevorzugt Stufe 1, 4, 5).
   - Anzahl je Welt bleibt gleich, Ausgewogenheit laut CLAUDE.md beachten
     (keine Kategorie dominiert; nach dem Tausch kurz die Verteilung je
     Welt nach Wettbewerb/Land ausgeben).
   - Jeder Eintrag vollständig (Pflichtfelder) inkl. details
     (Rückennummer, Nationalität – bei Nationalteams ohne nat) und einem
     kurzen context-Satz. Einheitlich side: "Aufstellung von <Team>".

3. Spielstände
   - Neue Einträge an derselben Stelle im Kampagnenpfad wie die alten.
     Alte ids sind weg: Fortschritt/Sterne zu diesen Leveln dürfen
     verfallen, aber nichts darf abstürzen (levelPassed/stars/best/drafts
     mit unbekannter id ignorieren). Damit niemand durch den Tausch
     zurückfällt: ein Level, dessen alte Aufstellung bestanden war, gilt
     auch mit der neuen als bestanden (Sterne neu sammeln).
   - Tages-Pool: neue Einträge mit since = heutiges Datum (Prompt 22), damit
     vergangene Tage/Archiv unverändert bleiben; die alten 4 Einträge im
     Archiv dürfen wegfallen.

4. CLAUDE.md ergänzen: unter "Datengenauigkeit" die Regel "Nur Spiele ab
   01.01.2006; Bekanntheit vor Exotik (Ausnahme: Welt 5 darf exotisch
   sein, aber auch ab 2006)".

sw.js CACHE_NAME erhöhen. Test: Konsistenz-Hook + Prüfskript: keine
Aufstellung (Kampagne + Tag) vor 2006, Anzahl je Welt unverändert, alle
Pflichtfelder, Formation passt, keine doppelten ids; altes Profil mit
bestandenem Level einer ersetzten Aufstellung lädt ohne Fehler und das
Level bleibt bestanden; keine Konsolenfehler.
```

---

## Fahrplan (Stand 04.10.2026)

1. **App fertig machen:** Feinschliff nach Beobachtungen, dann Prompt 8
   (Capacitor) → App Store / Play Store.
2. **Traffic aufbauen:** Store-Seite, Social Media (u. a. KI-unterstützte
   Kurzvideos), Fokus auf Wiederkehr (Tages-Challenge, Serie, Duell per Link).
3. **Erst dann Monetarisierung** (siehe Ideen-Speicher), schrittweise und
   gemessen – Spielspaß vor Umsatz.
4. **Accounts – PFLICHT vor dem Store-Release (siehe Hinweis bei Prompt 8):** eigene Konten über einen
   Online-Dienst (z. B. Firebase oder Supabase) mit „Mit Apple / Google
   anmelden“, einzigartigen @Usernames, Freundesliste, Speicherstand in der
   Cloud und Push bei neuen Herausforderungen. Bestehende Daten werden über
   profile.deviceId (aus Prompt 25) beim ersten Anmelden übernommen.
   Pflichten: Konto in der App löschbar (Apple), datenschutzfreundliche
   Login-Option, Username-Filter/Melden, Datenschutzerklärung/DSGVO.
   Alternative ohne eigenen Server: Game Center / Google Play Games
   (iPhone und Android getrennt).
   Ausführlich: docs/Starting-XI_Duell_Namen-und-Accounts.docx.
5. **Skalieren:** mehr Aufstellungen, Duell gegen Zufallsgegner, Ranking.

Leitplanken Social-Media-Videos: KI-Inhalte als solche kennzeichnen
(Plattformregeln), keine Deepfakes/Abbilder echter Spieler, keine
TV-Bilder, Vereinslogos oder Original-Trikots – stattdessen App-Aufnahmen
(Bildschirm), eigene Grafiken, KI-Stimme/-Animation ohne echte Personen.

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
- **Duell gegen Freunde** (Prototyp `prototypes/duell.html`): Stufe 1 „Duell per
  Link“ ohne Server (gleiche Aufstellung, nacheinander gespielt, Ergebnis des
  Gegners verdeckt bis zum eigenen Spiel), 3:00 Zeitlimit, Abgeben-Button, keine
  Hilfen, Wertung: mehr Richtige vor schnellerer Zeit. Walkout-Enthüllung nach
  dem Start (Wettbewerb › Datum › Partie › Mannschaft), Uhr erst ab Anpfiff, kein
  Kontext-Satz (könnte Spieler verraten). Fair-Play-Versprechen + Siegel
  (App-Wechsel erkennen). Später: Game Center/Play Games (nach Capacitor), dann
  ggf. Echtzeit gegen Zufallsgegner mit Backend. Offen: Platz auf der Startseite,
  Ranking (Liga-Ränge mit Auf-/Abstieg, Saisons), Best of 3, Bilanz je Freund,
  Pool-Größe (für Ranking mit Fremden mehrere hundert Aufstellungen nötig).
  Entscheidung 05.10.2026: Duell wird Hauptmodus neben der Kampagne –
  Startseite Variante A: Duell-Kachel statt Frei-spielen-Kachel, Frei spielen
  als schmale Leiste darunter (mit Mini-Formkurve). Später, mit genug Traffic,
  kann das Duell noch prominenter werden (z. B. breite Kachel). Umbau der
  Startseite erst zusammen mit dem Duell selbst.
  Festgelegt 05.10.2026 (Prototyp aktualisiert): Formate Einzelduell,
  Best of 3, Best of 5; Zeit pro Aufstellung 2/3/5 Min; Stufe 1–5 oder
  gemischt. Rundensieg: mehr Richtige, sonst schnellere Zeit; Duellsieg: mehr
  gewonnene Runden. Belohnung: XP je gespielter Aufstellung + Bonus für den
  Duellsieg, KEINE Token. Bilanz gesamt und pro Freund (Übersicht, Einladung,
  Scout-Profil). Duell-Trophäen (z. B. Erster Sieg, Sweep, 10 Siege, 5 Siege in
  Folge). Aufstellungen aus allen Pools (Kampagne + Tag), innerhalb eines Duells
  verschieden und nicht unmittelbar wiederholt (zuletzt in Duellen gespielte
  zurückstellen). Ohne Server: Ergebnis wird per Link zurückgeschickt.
  Überarbeitet 05.10.2026: Duell ersetzt die Frei-spielen-Kachel direkt;
  Frei spielen nur noch als kleine Textzeile unter den Kacheln ("Lieber allein
  trainieren? Frei spielen ›"). Optik ohne Versalien-Überschriften, in der
  Sprache der Tages-Karte (Anzeigetafel/Klappziffern, Tickets, Wappen).
  Walkout: Partie fest zweizeilig (Heim / gegen Gast), Schriftgröße je Zeile
  vorab einpassen – kein Umbruch-Wechsel beim Verkleinern (Glitch-Fix).
- **Monetarisierung** (Prototyp `prototypes/werbung.html`, erst nach Capacitor
  und mit echten Nutzerzahlen): freiwillige Belohnungs-Werbung „Video ansehen →
  +1 🔍“ (max. 3/Tag), Einmalkauf „Werbefrei“ ohne Spielvorteil, später
  kosmetische Extras. Nie Werbung automatisch, vor/während eines Spiels oder im
  Duell. Vorher klären: Gewerbe/Steuern, Impressum/Datenschutz, DSGVO-
  Einwilligung + Apple-Tracking-Abfrage, jugendgerechte Werbe-Einstellungen,
  Nebentätigkeit beim Arbeitgeber.
  Idee „Festgebissen“-Moment: Wer an einer Position hängt (z. B. 2 Fehlversuche
  oder ca. 45 s ohne Fortschritt), sieht im Positions-Panel dezent „Hängst du
  fest? 🎬 Gratis-Dreh am Scout-Rad“ – kein Pop-up. Zählt wie ein normaler
  Hinweis (kein ⭐⭐⭐, Kombo endet, weniger XP). Vorschlag: Video gibt nur
  Scout-Rad-Drehs, Aufdecken bleibt Token-only (Token behalten ihren Wert);
  Tageslimit gemeinsam mit den Token-Videos; nie im Duell; Tages-Challenge
  markiert es im Teilen-Raster als Hilfe. Schwierigkeit NICHT künstlich
  erhöhen, um Videos zu verkaufen.
