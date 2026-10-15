// Prüfskript für LINEUP_CHALLENGES (Kampagne) und DAILY_CHALLENGES (Tages-Pool) - Prompt 35.
// Aufruf: node tools/check-lineup-pools.mjs [startelf_check.html]
// Prüft: Datum >= 2008, Pflichtfelder, Formation/Positionen, details/nat, doppelte ids/Partien, Namen-Eindeutigkeit,
// kein Team in zwei aufeinanderfolgenden Kampagnen-Levels (inkl. Weltwechsel) und simuliert 120 Tage Tages-Challenge.
import fs from "fs";
import vm from "vm";

const file = process.argv.slice(2).find((a) => !a.startsWith("--")) || new URL("../startelf_check.html", import.meta.url).pathname;
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
const hints = [];
const hint = (m) => hints.push(m);

const yearOf = (m) => { const r = m.comp.match(/\d{4}/g); return +r[r.length - 1]; };
const dateOf = (m) => { const r = m.comp.match(/(\d{2})\.(\d{2})\.(\d{4})/); return r ? `${r[3]}-${r[2]}-${r[1]}` : null; };
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[-'’`]/g, " ").replace(/\s+/g, " ").trim();


// Ersatzbank (Prompt 37): bench: [{ name, nr, pos, in?, inExtra?, for? }], benchSource
function checkBench(w, m, abbrs, startNames) {
  if (!Array.isArray(m.bench) || !m.bench.length) { err(`${w}: bench ist leer/kein Array (Feld weglassen, wenn nicht vollständig)`); return; }
  if (!m.benchSource || (Array.isArray(m.benchSource) && !m.benchSource.length)) err(`${w}: benchSource fehlt`);
  const POS = ["TW", "ABW", "MIT", "ANG"];
  const names = new Set(), nrs = new Set();
  for (const b of m.bench) {
    if (!b.name) { err(`${w}: Bankspieler ohne name`); continue; }
    const nn = norm(b.name);
    if (names.has(nn)) err(`${w}: Bankspieler doppelt: ${b.name}`); names.add(nn);
    if (startNames.includes(nn)) err(`${w}: Bankspieler ${b.name} steht auch in players`);
    if (typeof b.nr !== "number" || b.nr < 1 || b.nr > 99) err(`${w}: Bank ${b.name}: nr ungültig`);
    else { if (nrs.has(b.nr)) err(`${w}: Bank ${b.name}: Rückennummer ${b.nr} doppelt`); nrs.add(b.nr); }
    if (m.details && Object.values(m.details).some((dd) => dd && dd.nr === b.nr)) err(`${w}: Bank ${b.name}: Rückennummer ${b.nr} auch bei einem Startspieler`);
    if (!POS.includes(b.pos)) err(`${w}: Bank ${b.name}: pos ${b.pos} ungültig`);
    if (b.in !== undefined && b.in !== null) {
      if (typeof b.in !== "number" || b.in < 1 || b.in > 120) err(`${w}: Bank ${b.name}: Minute ${b.in} unplausibel`);
      if (b.inExtra !== undefined && (![45, 90, 105, 120].includes(b.in) || typeof b.inExtra !== "number" || b.inExtra < 1 || b.inExtra > 15)) err(`${w}: Bank ${b.name}: inExtra nur bei 45/90/105/120 und 1-15`);
      if (!b.for) err(`${w}: Bank ${b.name}: eingewechselt, aber ohne for`);
    } else if (b.for || b.inExtra || b.concussion) err(`${w}: Bank ${b.name}: for/inExtra/concussion ohne Minute`);
  }
  const benchNames = new Map(m.bench.map((b) => [norm(b.name), b]));
  for (const b of m.bench) {
    if (!b.for) continue;
    const ok = abbrs.includes(b.for) || (benchNames.has(norm(b.for)) && norm(b.for) !== norm(b.name));
    if (!ok) err(`${w}: Bank ${b.name}: for "${b.for}" verweist auf nichts`);
  }
  // Wechselkontingent: bis Mai 2020 3 (+1 in der Verlängerung), danach 5 (+1)
  const used = m.bench.filter((b) => b.in && !b.concussion).length, // concussion: true = Gehirnerschütterungs-Wechsel, zählt nicht
     d = dateOf(m) || "9999";
  const limit = (d >= "2020-05-01" ? 5 : 3) + (/n\.V\./.test(m.teams) ? 1 : 0);
  if (used > limit) err(`${w}: ${used} Einwechslungen, erlaubt wären ${limit}`);
}


// Namenshinweise (Prompt 38, Teil 2 D) - nur Meldungen, nichts wird geändert:
// 1) Startelf mit doppeltem Nachnamen, bei dem mindestens eine Anzeige weder Vorname noch Initial hat
// 2) Startelf-Nachname ohne Initial/Vorname, der auch auf der Bank derselben Seite steht
// 3) mehrteiliger Name "Vorname Nachname" ohne Nachnamen-Alias (Vorsätze und Ausnahmen ausgenommen)
const NAME_EXCEPTIONS = new Set(["Heuer Fernandes", "João Mário", "Kim Min-Jae", "Arévalo Ríos", "Filipe Luís"]); // bewusst so (Florian) bzw. Familienname vorn
const PARTICLE = /^(de|van|von|di|da|dos|del|della|le|la|lo|el|al|mac|mc|ter|ben|bin|du|dal)$/i;
const isInitialForm = (n) => /^[A-Za-zÀ-ÿ]\.\s+\S/.test(n);
const surnameOf = (n) => n.replace(/^[A-Za-zÀ-ÿ]\.\s+/, "").trim().split(/\s+/).slice(-1)[0];
function checkNameHints(w, m) {
  const ent = Object.entries(m.players);
  const groups = {};
  for (const [a, n] of ent) (groups[norm(surnameOf(n))] ||= []).push([a, n]);
  for (const g of Object.values(groups)) {
    if (g.length > 1 && g.some(([, n]) => n.trim().split(/\s+/).length === 1)) hint(`${w}: gleicher Nachname in der Startelf ohne eindeutige Anzeige: ${g.map(([a, n]) => a + ":" + n).join(" | ")}`);
  }
  if (Array.isArray(m.bench)) {
    for (const [a, n] of ent) {
      if (n.trim().split(/\s+/).length > 1) continue; // Vorname/Initial vorhanden
      const twins = m.bench.filter((b) => norm(surnameOf(b.name)) === norm(n));
      if (twins.length) hint(`${w}: Startelf ${a}:"${n}" hat denselben Nachnamen wie Bank ${twins.map((b) => b.name).join(", ")} - Startelf mit Initial anzeigen`);
    }
  }
  for (const [a, n] of ent) {
    const words = n.trim().split(/\s+/);
    if (words.length < 2 || isInitialForm(n) || NAME_EXCEPTIONS.has(n)) continue;
    if (words.slice(0, -1).some((x) => PARTICLE.test(x)) || PARTICLE.test(words[0])) continue; // Namen mit Vorsatz bleiben wie sie sind
    const al = (m.aliases && m.aliases[a]) || [];
    if (!al.some((x) => norm(x) === norm(words[words.length - 1]))) hint(`${w}: ${a}:"${n}" hat keinen Nachnamen-Alias "${words[words.length - 1]}"`);
  }
}

// Spoilerfreie Vorschau-Texte (Prompt 41): teaser darf KEINEN Namen eines Spielers der gefragten Seite enthalten
// (Startelf, Bank, Aliasse). Geprueft wird wortweise (Woerter >= 4 Zeichen aus Anzeigename, Alias, Bankname;
// Treffer bei Gleichheit oder Genitiv-s). Ausnahme nur, wenn ein Name zugleich Vereins-/Ortsname ist - hier einzeln begruendet.
const TEASER_OK = {
  // id: ["wort", ...]   // Begruendung
};
const TEASER_MAX = 210; // Zeichen; Vorschau-Zettel zeigt den Text immer komplett (Schrift passt sich an)
function nameTokens(m) {
  const toks = new Map();
  const add = (full, who) => { for (const t of norm(full).split(" ")) if (t.length >= 4 && !PARTICLE.test(t)) toks.set(t, who); };
  for (const [a, n] of Object.entries(m.players)) { add(n, `${a}:${n}`); for (const x of (m.aliases && m.aliases[a]) || []) add(x, `${a}:${n}`); }
  for (const b of m.bench || []) add(b.name, `Bank:${b.name}`);
  return toks;
}
function spoilerHits(text, m) {
  const toks = nameTokens(m), ok = new Set((TEASER_OK[m.id] || []).map(norm));
  const hits = [];
  for (const w of norm(text).split(" ")) {
    const t = toks.has(w) ? w : w.endsWith("s") && toks.has(w.slice(0, -1)) ? w.slice(0, -1) : null;
    if (t && !ok.has(t)) hits.push(`${t} (${toks.get(t)})`);
  }
  return [...new Set(hits)];
}
const spoilerRows = [];
function checkTeaser(w, m, field) {
  const t = m[field];
  if (typeof t !== "string" || !t.trim()) { err(`${w}: Pflichtfeld ${field} fehlt`); return; }
  if (field === "teaser") {
    if (t.length > TEASER_MAX) err(`${w}: teaser ${t.length} Zeichen (max ${TEASER_MAX})`);
    if ((t.match(/(?<!\d)[.!?]\s+(?=[A-ZÄÖÜ„"])/g) || []).length > 1) err(`${w}: teaser hat mehr als 2 Saetze`);
  }
  const h = spoilerHits(t, m);
  if (h.length) { spoilerRows.push([m.id, h.join(", ")]); err(`${w}: ${field} nennt Spieler der gefragten Seite: ${h.join(", ")}`); }
}

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
    if (m.bench !== undefined) checkBench(w, m, abbrs, names);
    checkNameHints(w, m);
    checkTeaser(w, m, process.argv.includes("--context") ? "context" : "teaser"); // --context: zeigt die Treffer des alten Textes (Vorher-Stand)
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
notes.push(`Ersatzbank: Kampagne ${LINEUPS.filter((m) => m.bench).length} von ${LINEUPS.length}, Tages-Pool ${DAILY.filter((m) => m.bench).length} von ${DAILY.length} Aufstellungen mit Bank`);
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
if (spoilerRows.length) console.log("\nSPOILER-TREFFER (" + spoilerRows.length + " Einträge):\n" + spoilerRows.map(([id, h]) => "  " + id.padEnd(38) + h).join("\n"));
if (hints.length) console.log("\nNAMENSHINWEISE (" + hints.length + ", nur Meldungen):\n" + hints.map((e) => " - " + e).join("\n"));
if (errors.length) { console.log("\nFEHLER (" + errors.length + "):\n" + errors.map((e) => " - " + e).join("\n")); process.exit(1); }
console.log("\nOK - keine Fehler");
