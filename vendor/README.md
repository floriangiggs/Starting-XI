# vendor/

Fremdbibliotheken, die lokal mitgeliefert werden (kein CDN, damit die App offline und ohne Fremdserver startet).

| Datei | Quelle | Version |
|---|---|---|
| `supabase-js-2.118.0.umd.js` | npm `@supabase/supabase-js`, `dist/umd/supabase.js` (MIT-Lizenz) | 2.118.0 |

Aktualisieren: `npm install --save-dev @supabase/supabase-js@<neu>`, Datei kopieren, Versionsnummer im Dateinamen, in `sw.js` (APP_SHELL) und in `startelf_check.html` (`ONLINE_CFG.lib`) anpassen, `CACHE_NAME` erhoehen.
