# startelf_check.html – Projekt-Hausregeln

## Projektbeschreibung

Eigenständige HTML/CSS/JS-App ohne Server (`startelf_check.html`). Spieler
sehen ein echtes historisches Fußballspiel und müssen die komplette Startelf
auf einem visuellen Spielfeld an die richtige Position setzen.

## Datengenauigkeit hat oberste Priorität

- Neue Aufstellungen (in `LINEUP_CHALLENGES`) dürfen **nur** mit mindestens
  einer verlässlichen Quelle hinzugefügt werden (z. B. kicker.de,
  fussballdaten.de, sport.de, weltfussball.de, offizielle Vereins-/
  Verbandsseiten).
- Nie raten oder Aufstellungen aus Trainingsdaten "erinnern" – im Zweifel
  recherchieren oder den Eintrag weglassen.

## Pflichtfelder pro Aufstellung

Jeder Eintrag in `LINEUP_CHALLENGES` braucht:

- `id` – eindeutig
- `comp` – Wettbewerb + Datum
- `league`
- `teams`
- `side` – welches Team wird abgefragt
- `context` – kurzer Hintergrund
- `formation` – muss zu einem Eintrag in `PITCH_LAYOUTS` passen
- `difficulty` – 1–5
- `players` – Objekt mit Positions-Kürzel als Key, Nachname als Value

## Schwierigkeitsstufen (Liga-Schema)

| Stufe | Liga | Charakter |
|---|---|---|
| 1 | Kreisliga | leicht / aktuell / star-besetzt |
| 2 | Regionalliga | |
| 3 | Bundesliga | |
| 4 | Champions League | |
| 5 | Weltklasse | exotisch / obskur |

Ziel: möglichst 9+ Aufstellungen pro Stufe, ausgewogen über alle Ligen/
Wettbewerbe verteilt (keine Kategorie soll stark dominieren).

## Design / Corporate Identity

- Basis: dunkles Ink-Blau
- Spielfeld-Elemente: Pitch-Grün
- Akzentfarbe: Gold
- Rot nur für Fehler-/Warnzustände
- Schriften – die App darf nie "maschinell" wirken:
  - `Anton`: große Überschriften und hervorgehobene Zahlen (Timer, Scores,
    Serien-Zähler, Rang-/Weltnamen)
  - `Oswald`: alles andere – Fließtext, Buttons, Labels, Kicker, kleine
    Beschriftungen. Kleine Labels in Oswald 500/600, Großbuchstaben mit
    höchstens leichtem Letter-Spacing (max. 0.12em); Nebentexte in Oswald 300.
  - `JetBrains Mono`: nur sparsam für kleine tabellarische Zahlen, bei denen
    Ziffern exakt untereinander stehen müssen. NIE für Texte, Labels, Kicker
    oder Buttons.
- Keine Blink-/Dauer-Animationen an Text oder Zahlen.
- Optische Referenzen für neue Features liegen in `prototypes/` – Optik von
  dort übernehmen statt neu zu erfinden.

## Workflow

- Vor jeder größeren strukturellen Änderung: kurz Plan Mode nutzen und den
  Plan zeigen, bevor losgelegt wird.
- Nach jeder Änderung an `LINEUP_CHALLENGES` oder `PITCH_LAYOUTS`:
  Konsistenz prüfen (der Hook `.claude/hooks/check-lineups.ps1` läuft
  automatisch nach jedem Edit/Write auf dieser Datei) und das Ergebnis
  zeigen.
