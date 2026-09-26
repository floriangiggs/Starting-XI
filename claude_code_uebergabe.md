# Starting XI — Übergabe an Claude Code

Stand: 26.09.2026. Diese Datei beschreibt, wo das Projekt steht und wie es
weitergeht. Die konkreten Arbeitsaufträge stehen in
**`prompts_naechste_schritte.md`**.

---

## 1. Loslegen auf dem Mac

1. Claude-Desktop-App öffnen → Tab **„Code“** → **„Local“**.
2. Den Projektordner `Starting-XI` auswählen (der lokale Klon dieses Repos).
3. Als Erstes eingeben:
   > Hol den aktuellen Stand von GitHub (git pull) und lies CLAUDE.md,
   > claude_code_uebergabe.md und prompts_naechste_schritte.md. Fass mir
   > kurz zusammen, was ansteht – noch nichts ändern.
4. Danach die Prompts aus `prompts_naechste_schritte.md` **einzeln und in
   Reihenfolge** einfügen.

Hinweis: Der Hook `.claude/hooks/check-lineups.ps1` braucht PowerShell
(`pwsh`) auf dem Mac.

---

## 2. Wo wir aktuell stehen

- **1 Datei**, `startelf_check.html`, eigenständig (kein Server), ca. 2.070 Zeilen
- **Spielprinzip**: echte historische Startelfs auf einem Spielfeld erraten
- **50 Aufstellungen**, genau 10 pro Schwierigkeitsstufe (Kreisliga bis
  Weltklasse). Ziel 50–70 → Untergrenze erreicht.
- **Level-System**: XP, Ränge, Achievements, Scout-Token + Hinweis-Punkte
- **Kampagnen-Modus** (Weltkarte + Level-Pfad) und **Freispiel-Modus**
- Speicherung lokal in `localStorage` (Key `anstoss_profile`)
- **PWA fertig**: `manifest.json`, `sw.js`, Icons (Commit `ffb697b`)

### Bekannte Probleme (Prompts 1–4 beheben sie)
- iPhone zoomt beim Antippen der Namensfelder (Schrift < 16 px)
- Namensfelder überlappen sich bei allen Formationen
- Namen wie „Fabián Ruiz“, „Lautaro Martínez“, „D. Silva“ müssen exakt so
  getippt werden; isländische Sonderzeichen (ð, þ, æ) sind nicht eingebbar
- Service Worker liefert HTML aus dem Cache → Updates nur mit neuer
  `CACHE_NAME`-Version sichtbar

---

## 3. Beschlossene Neuerungen

- **Positions-Panel** unter dem Spielfeld statt Buttons in jedem Feld
- **Namensvarianten/Aliase**: die Position entscheidet bei Mehrdeutigkeit
- **„Fast richtig“** bei Tippfehlern mit Button „Korrigieren“ (10 statt 15 XP,
  blockiert „Perfekt“); Umlaute (ue/ü) zählen als exakt richtig
- **Eine Währung** (🔍 Scout-Token) statt zwei; transparente Token-Quittung
- **Scout-Rad**: Anfangsbuchstabe 30 · Rückennummer 30 · Nationalität 30
  (nicht bei Nationalteams) · ganzer Name 10 (Jackpot). Optik/Animation:
  `prototypes/scout-rad.html`
- Rückennummer/Nationalität werden mit Quellen recherchiert (Feld `details`,
  plus `source` pro Aufstellung)

---

## 4. Das Ziel: App-Store-Launch

1. ~~PWA-Umbau~~ ✅
2. Korrekturen + neue Features (Prompts 1–6)
3. PWA-Nacharbeit: Fonts lokal (DSGVO), Update-Strategie (Prompt 7)
4. Capacitor-Vorbereitung (Prompt 8), dann Android und iOS (Xcode auf dem Mac)
5. Store-Accounts selbst anlegen: Apple Developer Program 99 $/Jahr,
   Google Play Console 25 $ einmalig
6. Store-Einreichung: Datenschutzerklärung, Screenshots, Beschreibung

Parallel: Inhalte ausbauen (siehe Ideen-Speicher in
`prompts_naechste_schritte.md`).
