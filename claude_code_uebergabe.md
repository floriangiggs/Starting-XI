# Starting XI — Übergabe an Claude Code

Diese Datei ist der Übergabe-Zettel für zuhause. Leg sie zusammen mit
`startelf_check.html` in einen Ordner, öffne den mit Claude Code, und du bist
sofort da weiter, wo wir hier aufgehört haben.

---

## 1. Claude Code installieren (falls noch nicht geschehen)

1. Gehe auf **claude.com/download** und lade die Desktop-App für dein System
   (Mac oder Windows) herunter. Auf Linux läuft's stattdessen über die
   Kommandozeile (CLI) — falls das dein Fall ist, sag Bescheid, dann erklär
   ich den Weg extra.
2. App installieren, öffnen, mit deinem Anthropic-Account einloggen.
3. Oben in der App auf den Tab **"Code"** klicken.
   - Falls du zum Upgrade aufgefordert wirst: Claude Code braucht ein
     bezahltes Abo (Pro, Max, Team oder Enterprise) — reines kostenloses
     Konto reicht nicht.
4. Im Code-Tab: **"Local"** wählen, um direkt mit den Dateien auf deinem
   Rechner zu arbeiten (empfohlen für unseren Fall).
   - Unter Windows muss dafür **Git** installiert sein
     ([git-scm.com/downloads/win](https://git-scm.com/downloads/win)) — auf
     dem Mac ist Git in der Regel schon vorinstalliert.
5. Ordner mit den beiden Dateien auswählen, Modell aussuchen (Sonnet reicht
   für unseren Fall völlig), und loslegen.

---

## 2. Wo wir aktuell stehen

- **1 Datei**, `startelf_check.html`, komplett eigenständig (kein Server
  nötig), ca. 1.780 Zeilen (~1.460 JS, ~245 CSS)
- **Spielprinzip**: echte historische Fußball-Aufstellungen erraten, auf
  einem visuellen Spielfeld mit Positions-Feldern
- **38 Aufstellungen** über 11 Kategorien, Ziel: 50-70
- **Komplettes Level-System**: XP, Level, Ränge (Kreisliga bis Weltklasse),
  Achievements, Scout-Token-Ökonomie fürs Hinweis-System
- **Kampagnen-Modus**: Stadion-Weltkarte + geschlängelter Level-Pfad pro
  Welt, mit sauber abgeleiteter (nicht mehr speicherbarer, damit nicht mehr
  veraltbarer) Freischalt-Logik
- **Freispiel-Modus**: Liga-/Schwierigkeits-Filter, alles mehrfach wählbar
- Alles lokal in `localStorage` gespeichert, kein Backend

**Was schon stabil ist:** Die Kernmechanik ist mehrfach isoliert getestet
und ausgereift. Zwei Freischalt-Bugs wurden nicht nur gepatcht, sondern
strukturell behoben (Freischalt-Status wird jetzt live aus der
Erfolgshistorie berechnet statt separat gespeichert).

**Was noch fehlt:** echter Gerätetest (bisher nur simulierte Logiktests),
mehr Inhalt, und die komplette Store-Verpackung (siehe unten).

---

## 3. Das Ziel: App-Store-Launch

Reihenfolge, die sich anbietet:

1. **PWA-Umbau** — `manifest.json`, Service Worker, Icons in allen Größen,
   Offline-Fähigkeit. Erster Schritt, komplett ohne Store-Accounts machbar.
2. **Android über Capacitor** — verpackt den bestehenden Web-Code in eine
   echte Android-App. Läuft auf jedem Rechner mit Android Studio/SDK.
3. **iOS über Capacitor + Xcode** — braucht zwingend einen Mac (Apple-Vorgabe,
   keine Umgehung möglich). Ein MacBook Air reicht dafür locker.
4. **Store-Accounts anlegen** (musst du selbst machen, Identitätsprüfung):
   - Apple Developer Program: 99 $/Jahr
   - Google Play Console: 25 $ einmalig
5. **Store-Einreichung vorbereiten**: Datenschutzerklärung, Screenshots,
   App-Beschreibung — Claude Code kann die Inhalte dafür bauen, hochladen
   musst du selbst über App Store Connect / Play Console.

Parallel dazu: **Content weiter Richtung 50-70 Aufstellungen ausbauen.**

---

## 4. Vorschlag für deinen ersten Prompt in Claude Code

Kannst du so oder so ähnlich direkt reinkopieren:

> Hier ist der aktuelle Stand meines Fußball-Aufstellungsspiels
> (`startelf_check.html`). Ich will das Schritt für Schritt zu einer
> App-Store-fähigen App ausbauen. Fang bitte mit dem PWA-Umbau an
> (manifest.json, Service Worker, Icons), erklär mir dabei kurz, was du
> tust, und frag nach, bevor du größere strukturelle Änderungen machst.
> Später geht's dann um Android/iOS-Verpackung über Capacitor.

---

## 5. Kleiner Reminder für dich selbst

Wenn optisches Feintuning ("gefällt mir noch nicht ganz") ansteht: in
Claude Code siehst du die Änderungen direkt im echten Browser/Vorschau,
nicht nur als Beschreibung wie hier im Chat — das macht diese Art von
Iteration spürbar schneller.
