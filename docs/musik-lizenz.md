# Musik: Herkunft und Lizenz

Stand: 05.11.2026.

## Hintergrundmusik in der App
- Datei: `audio/hintergrund.m4a` (87 s, nahtlose Schleife, AAC 96 kbps, ca. 1 MB). Quelle: `Hintergrundmusik.wav`, 90 s, mit **ElevenLabs Music**
  erzeugt (Starter-Abo), Ende taktgenau (80 BPM, 3-s-Takte) in den Anfang übergeblendet.
- Einbau: `startelf_check.html`, Block „Hintergrundmusik“ (Web-Audio-Schleife auf dem Ton-Kontext, Stummschalter wirkt, Schalter Profil → Ton → Musik,
  Lautstärke = Ton-Lautstärke × 0,22, im Duell während einer Runde × 0,45, nicht im Hintergrund). Bundle: `tools/build-www.mjs` (`audio/`), Service Worker v90.

## Lizenz (geprüft am 05.11.2026 auf elevenlabs.io/music-terms, „Last updated: 09 October 2026“)
- Starter/Creator/Pro u. a.: „All online and offline commercial use permitted, except film, TV, radio, and Studio Games.“
- „Studio Game“ = Videospiel/interaktives Angebot für die Öffentlichkeit, durch Verkauf, Werbung oder Monetarisierung vermarktet,
  **ausgenommen „Indie Game“**: Spiel mit weniger als 500.000 $ Umsatz seit Erstveröffentlichung UND Herausgeber mit weniger als 1.000.000 $
  Spielumsatz im letzten Geschäftsjahr (netto nach Plattformgebühren und Rückerstattungen). Wird die Grenze überschritten: 60 Tage, um einen passenden Plan zu holen oder die Musik zu ersetzen (§ 4.7).
- **Starter, Creator, Pro nur für Einzelpersonen.** Bei Betrieb über eine Firma: Scale (unter 10 Mitarbeiter) prüfen. Hängt an der offenen Frage Gewerbe/Händlerstatus.
- Preisseite Starter: „Kommerzielle Lizenz für Sprache und Musik“ (Screenshot von Florian vom 05.11.2026).
- Empfehlung: Screenshot der Bedingungen mit Datum aufheben; optional schriftliche Bestätigung vom Support (team@elevenlabs.io) zur Nutzung in einer Quiz-App.
- Hinweis: Die Reels (Online-Werbung) sind ausdrücklich abgedeckt; KI-Kennzeichnung in den Beschreibungen (siehe `social/reel-01/out/beschreibung.md`).

## Weitere Musik
- Reels: `social/aufnahme/musik/` (nicht im Repo): `stadion-a`, `stadion-ruhig`, `stadion-treibend`, `logo-sting` u. a., alle ElevenLabs Music.

## Antwort ElevenLabs Support (05.11.2026)
- Starter: kommerzielle Nutzung erlaubt, außer Film, TV, Radio und „Studio Games“ (dafür Enterprise Music). Indie-Spiele sind keine Studio Games.
- Ob eine Quiz-App unter „Studio Game“ fällt, bestätigt der Support nicht („Rechtsauslegung, keine Rechtsberatung“); verbindliche Auskunft nur durch eine Rechtsberatung.
- Der Support nennt keine Grenzwerte für Indie-Spiele; die Bedingungen enthalten sie aber (Abschn. 4.8(c), erneut geprüft am 05.11.2026): unter 500.000 $ Spielumsatz seit Erstveröffentlichung und Herausgeber unter 1.000.000 $ im letzten Geschäftsjahr.
- Einschätzung: Startelo XI ist bei kleinem Umsatz ein Indie-Spiel und damit kein Studio Game. Restrisiko bleibt. Die Datei kann jederzeit ausgetauscht werden.
- Zu beachten: Starter nur für Einzelpersonen; bei Gewerbe/Firma auf Scale prüfen.
