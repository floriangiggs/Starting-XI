// Erzeugt supabase/seed.sql aus der App (Prompt K1): Aufstellungs-Katalog (nur IDs + Merkmale), Tages-Plan fuer ~400 Tage,
// Namensregeln (reservierte Woerter, gesperrte Woerter, bekannte Spielernamen). Die Loesungen selbst bleiben in der App.
// Aufruf: node tools/gen-supabase-seed.mjs   (Playwright laedt die App und fragt die echten Daten/Funktionen ab)
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = path.join(root, "startelf_check.html");
const browser = await chromium.launch();
const page = await (await browser.newContext({ serviceWorkers: "block" })).newPage();
await page.goto("file://" + html); await page.waitForTimeout(4000);
const data = await page.evaluate(() => {
  const all = [...LINEUP_CHALLENGES, ...DAILY_CHALLENGES];
  const year = (m) => { const x = (m.comp.match(/\d{1,2}\.\d{1,2}\.(\d{4})/) || m.comp.match(/(\d{4})/) || [])[1]; return x ? +x : null; };
  const catalog = all.map((m) => ({ id: m.id, difficulty: m.difficulty, league: m.league, year: year(m) }));
  const players = new Set(); all.forEach((m) => Object.values(m.players).forEach((n) => players.add(n)));
  const days = []; const start = new Date(DAILY_EPOCH + "T12:00:00");
  for (let i = 0; i < 400; i++) { const d = new Date(start.getTime() + i * 86400000), key = localDateKey(d); days.push([key, getDailyChallenge(key).id]); }
  return { catalog, players: [...players], days, epoch: DAILY_EPOCH };
});
await browser.close();

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const flat = (s) => s.replace(/ø/g, "o").replace(/đ/g, "d").replace(/ł/g, "l").replace(/æ/g, "ae").replace(/ð/g, "d").replace(/þ/g, "th").replace(/ß/g, "ss").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const persons = new Set();
for (const n of data.players) { const f = flat(n); if (f.length >= 4) persons.add(f); const last = flat(n.trim().split(/\s+/).slice(-1)[0] || ""); if (last.length >= 4) persons.add(last); }
// Reservierte Namen (exakt, normalisiert) und gesperrte Woerter (Teilstring, normalisiert). Liste bewusst kurz - im Betrieb erweitern.
const reserved = ["admin", "administrator", "support", "startingxi", "starting", "xi", "system", "moderator", "mod", "team", "official", "offiziell", "kabine", "gast", "spieler", "anonym", "null", "undefined", "root", "info", "hilfe", "help", "service", "starting11", "startelf", "fifa", "uefa", "dfb", "bundesliga"];
const blocked = ["nazi", "hitler", "heilhitler", "fick", "fuck", "nigg", "hure", "nutte", "schlampe", "wichs", "porn", "vergewalt", "kanake", "spast", "adolf", "sieg heil".replace(" ", ""), "arschloch", "bitch", "cunt"];
let sql = `-- ERZEUGT von tools/gen-supabase-seed.mjs - nicht von Hand aendern (App-Stand: ${data.catalog.length} Aufstellungen, ${data.days.length} Tage ab ${data.epoch})\n`;
sql += "insert into public.lineup_catalog (id, difficulty, league, year) values\n" + data.catalog.map((c) => `  (${q(c.id)}, ${c.difficulty}, ${q(c.league)}, ${c.year === null ? "null" : c.year})`).join(",\n") + "\non conflict (id) do update set difficulty = excluded.difficulty, league = excluded.league, year = excluded.year;\n\n";
sql += "insert into public.daily_lineups (day, lineup_id) values\n" + data.days.map(([d, id]) => `  (${q(d)}, ${q(id)})`).join(",\n") + "\non conflict (day) do update set lineup_id = excluded.lineup_id;\n\n";
sql += "insert into public.name_rules (kind, word) values\n" + [...reserved.map((w) => ["reserved", w]), ...blocked.map((w) => ["blocked", w]), ...[...persons].sort().map((w) => ["person", w])].map(([k, w]) => `  (${q(k)}, ${q(w)})`).join(",\n") + "\non conflict do nothing;\n";
fs.writeFileSync(path.join(root, "supabase", "seed.sql"), sql);
console.log(`supabase/seed.sql: ${data.catalog.length} Aufstellungen, ${data.days.length} Tage, ${persons.size} Personennamen`);
