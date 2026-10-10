// Prüfskript für LINEUP_CHALLENGES (Kampagne) und DAILY_CHALLENGES (Tages-Pool) - Prompt 35.
// Aufruf: node tools/check-lineup-pools.mjs [startelf_check.html]
// Prüft: Datum >= 2008, Pflichtfelder, Formation/Positionen, details/nat, doppelte ids/Partien, Namen-Eindeutigkeit,
// kein Team in zwei aufeinanderfolgenden Kampagnen-Levels (inkl. Weltwechsel) und simuliert 120 Tage Tages-Challenge.
import fs from "fs";
import vm from "vm";

const file = process.argv[2] || new URL("../startelf_check.html", import.meta.url).pathname;
const html = fs.readFileSync(file, "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));

function balanced(text, open, close, from) {
  let d = 0, k = from;
  for (; k < text.length; k++) {
    const c = text[k];
    if (c === open) d++;
    else if (c === close) { d--; if (d === 0) break; }
    else if (c === '"' || c === "'" || c === "`") { const q = c; k++; while (text[k] !== q) { if (text[k] === "\\") k++; k++; } }
    else if (c === "/" && text[k + 1] === "/") { while (text[k] !== "\n") k++; }
    else if (c === "/" && text[k + 1] === "*") { k = text.indexOf("*/", k) + 1; }
  }
  return k;
}
function grabConst(name, open = "[", close = "]") {
  const i = script.indexOf("const " + name + " = ");
  const j = script.indexOf(open, i);
  return vm.runInNewContext("(" + script.slice(j, balanced(script, open, close, j) + 1) + ")");
}
function grabFn(name) {
  const i = script.indexOf("function " + name + "(");
  const j = script.indexOf("{", i);
  return script.slice(i, balanced(script, "{", "}", j) + 1);
}

const LINEUPS = grabConst("LINEUP_CHALLENGES");
const DAILY = grabConst("DAILY_CHALLENGES");
const LAYOUTS = grabConst("PITCH_LAYOUTS", "{", "}");
const NAT = grabConst("NAT_NAMES", "{", "}");
const errors = [], notes = [];
const err = (m) => errors.push(m);

const yearOf = (m) => { const r = m.comp.match(/\d{4}/g); return +r[r.length - 1]; };
const dateOf = (m) => { const r = m.comp.match(/(\d{2})\.(\d{2})\.(\d{4})/); return r ? `${r[3]}-${r[2]}-${r[1]}` : null; };
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[-'’`]/g, " ").replace(/\s+/g, " ").trim();

for (const [label, arr] of [["Kampagne", LINEUPS], ["Tag", DAILY]]) {
  const ids = new Set(), games = new Set();
  for (const m of arr) {
    const w = `${label}:${m.id}`;
    for (const f of ["id", "comp", "league", "teams", "side", "context", "formation", "difficulty", "players"]) if (m[f] === undefined || m[f] === "") err(`${w}: Pflichtfeld ${f} fehlt`);
    if (ids.has(m.id)) err(`${w}: doppelte id`); ids.add(m.id);
    const gk = m.comp + "|" + m.teams + "|" + m.side; if (games.has(gk)) err(`${w}: doppelte Partie/Seite`); games.add(gk);
    const d = dateOf(m); if (!d) err(`${w}: kein Datum (dd.mm.yyyy) in comp`); else if (d < "2008-01-01") err(`${w}: Spiel vor 2008 (${d})`);
    const lay = LAYOUTS[m.formation]; if (!lay) { err(`${w}: Formation ${m.formation} unbekannt`); continue; }
    const abbrs = lay.map((p) => p.abbr);
    for (const a of abbrs) if (!m.players[a]) err(`${w}: Position ${a} ohne Spieler`);
    for (const a of Object.keys(m.players)) if (!abbrs.includes(a)) err(`${w}: Position ${a} nicht in ${m.formation}`);
    if (m.details) {
      for (const a of abbrs) { const dd = m.details[a]; if (!dd || typeof dd.nr !== "number") err(`${w}: details.${a}.nr fehlt`); else if (dd.nat && !NAT[dd.nat]) err(`${w}: nat ${dd.nat} nicht in NAT_NAMES`); }
      const nrs = abbrs.map((a) => m.details[a] && m.details[a].nr); if (new Set(nrs).size !== nrs.length) err(`${w}: doppelte Rückennummer`);
    } else err(`${w}: details fehlt`);
    const names = abbrs.map((a) => norm(m.players[a])); if (new Set(names).size !== names.length) err(`${w}: doppelter Spielername`);
    if (!/^Aufstellung (von|des|der) /.test(m.side)) err(`${w}: side ungewöhnlich: ${m.side}`);
    if (label === "Tag") {
      if (m.pairedWith && !LINEUPS.some((x) => x.id === m.pairedWith) && !DAILY.some((x) => x.id === m.pairedWith)) err(`${w}: pairedWith ${m.pairedWith} unbekannt`);
    }
  }
}
// Kampagne + Tag zusammen: Partie+Seite nur einmal
const all = [...LINEUPS, ...DAILY];
const seen = new Map();
for (const m of all) { const k = m.comp + "|" + m.teams + "|" + m.side; if (seen.has(k)) err(`Partie+Seite doppelt: ${m.id} / ${seen.get(k)}`); seen.set(k, m.id); }

// Teams / Reihenfolge
const ctx = vm.createContext({});
vm.runInContext(`const TEAM_KEY_ALIAS = ${JSON.stringify(grabConst("TEAM_KEY_ALIAS", "{", "}"))}; ${grabFn("matchTeamKeys")}`, ctx);
const keys = (m) => ctx.matchTeamKeys(m);
const worlds = [1, 2, 3, 4, 5].map((t) => LINEUPS.filter((m) => m.difficulty === t));
const counts = worlds.map((w) => w.length);
const order = worlds.flat();
for (let i = 1; i < order.length; i++) {
  const shared = keys(order[i - 1]).filter((k) => keys(order[i]).includes(k));
  if (shared.length) err(`Kampagne: Team ${shared.join(",")} direkt hintereinander: ${order[i - 1].id} -> ${order[i].id}`);
}

// Verteilung
const cnt = (a, f) => Object.fromEntries(Object.entries(a.reduce((o, x) => { const k = f(x); o[k] = (o[k] || 0) + 1; return o; }, {})).sort());
notes.push(`Kampagne: ${LINEUPS.length} Aufstellungen, je Welt ${counts.join("/")}`);
notes.push(`Tages-Pool: ${DAILY.length} Aufstellungen, je Stufe ${JSON.stringify(cnt(DAILY, (m) => m.difficulty))}`);
notes.push(`Jahre Kampagne: ${JSON.stringify(cnt(LINEUPS, yearOf))}`);
notes.push(`Jahre Tag: ${JSON.stringify(cnt(DAILY, yearOf))}`);
notes.push(`Jahre gesamt: ${JSON.stringify(cnt(all, yearOf))}`);
notes.push(`Wettbewerb Kampagne: ${JSON.stringify(cnt(LINEUPS, (m) => m.league))}`);
notes.push(`Wettbewerb Tag: ${JSON.stringify(cnt(DAILY, (m) => m.league))}`);
for (let t = 1; t <= 5; t++) notes.push(`  Welt ${t}: ${JSON.stringify(cnt(worlds[t - 1], (m) => m.league))}`);
const since2015 = all.filter((m) => yearOf(m) >= 2015).length;
notes.push(`ab 2015: ${since2015} von ${all.length}`);

// 120 Tage Tages-Challenge simulieren (Original-Funktionen aus der HTML)
const sim = vm.createContext({ DAILY_CHALLENGES: DAILY, LINEUP_CHALLENGES: LINEUPS });
const epoch = script.match(/const DAILY_EPOCH = "([^"]+)"/)[1];
vm.runInContext([
  `const DAILY_EPOCH = ${JSON.stringify(epoch)};`,
  `const TEAM_KEY_ALIAS = ${JSON.stringify(grabConst("TEAM_KEY_ALIAS", "{", "}"))};`,
  grabFn("hashString"), grabFn("localDateKey"), grabFn("dayNumber"), grabFn("dailyDateKeyForDay"), grabFn("matchTeamKeys"), grabFn("resetDailySchedule"), grabFn("dailyScheduleExtend"), grabFn("getDailyChallenge"),
  `let dailySchedule = { entries: [], round: 1, used: new Set(), lastId: null, lastTeams: new Set() };`
].join("\n"), sim);
const days = [];
for (let n = 1; n <= 120; n++) days.push(sim.getDailyChallenge(sim.dailyDateKeyForDay(n)));
let teamRepeat = 0, firstRepeat = null, seenIds = new Set();
for (let i = 0; i < days.length; i++) {
  if (i > 0 && keys(days[i]).some((k) => keys(days[i - 1]).includes(k))) { teamRepeat++; err(`Tag ${i + 1}: Team vom Vortag (${days[i - 1].id} -> ${days[i].id})`); }
  if (firstRepeat === null && seenIds.has(days[i].id)) firstRepeat = i + 1;
  seenIds.add(days[i].id);
}
notes.push(`120 Tage simuliert: erste Wiederholung an Tag ${firstRepeat} (Pool ${DAILY.length}), Team-Wiederholungen von Tag zu Tag: ${teamRepeat}`);
notes.push(`  Stufen der ersten 45 Tage: ${JSON.stringify(cnt(days.slice(0, 45), (m) => m.difficulty))}`);

console.log(notes.join("\n"));
if (errors.length) { console.log("\nFEHLER (" + errors.length + "):\n" + errors.map((e) => " - " + e).join("\n")); process.exit(1); }
console.log("\nOK - keine Fehler");
