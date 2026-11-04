// Baut den Ordner www/ fuer Capacitor (iOS-/Android-App) aus den Web-Dateien im Projektstamm.
// Quelle der Wahrheit bleibt startelf_check.html; www/ ist generiert und wird nicht eingecheckt.
//   node tools/build-www.mjs            -> kopiert und gibt die Dateiliste aus
// Gebuendelt wird nur, was die App zur Laufzeit braucht (siehe Liste unten). Nicht dabei: sw.js, manifest.json,
// 404.html, index.html (Weiterleitung), docs, social, prototypes, supabase, tools, node_modules.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "www");

// Ordner, die vollstaendig (rekursiv, mit Filter) uebernommen werden.
const DIRS = {
  fonts: (f) => /\.woff2$/.test(f),
  vendor: (f) => /\.js$/.test(f),
  icons: (f) => /\.png$/.test(f) && f !== "icon-1024.png", // 1024er gehoert in die Xcode-Assets, nicht ins Web-Bundle
};

export function buildWww({ quiet = false } = {}) {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  // Hauptdatei: kommt als index.html ins Bundle. Der Manifest-Link entfaellt (in der App ohne Funktion, sonst 404 im Log).
  let html = readFileSync(join(ROOT, "startelf_check.html"), "utf8");
  const before = html.length;
  html = html.replace(/<link rel="manifest"[^>]*>\s*\n?/, "");
  if (html.length === before) throw new Error("build-www: <link rel=\"manifest\"> nicht gefunden - HTML geaendert?");
  writeFileSync(join(OUT, "index.html"), html);

  for (const [dir, accept] of Object.entries(DIRS)) {
    mkdirSync(join(OUT, dir), { recursive: true });
    for (const f of readdirSync(join(ROOT, dir))) {
      const src = join(ROOT, dir, f);
      if (statSync(src).isFile() && accept(f)) cpSync(src, join(OUT, dir, f));
    }
  }

  const files = [];
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      statSync(p).isDirectory() ? walk(p) : files.push(relative(OUT, p));
    }
  })(OUT);
  if (!quiet) {
    const bytes = files.reduce((n, f) => n + statSync(join(OUT, f)).size, 0);
    console.log(`www/ gebaut: ${files.length} Dateien, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
    for (const f of files.sort()) console.log("  " + f);
  }
  return files.sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) buildWww();
