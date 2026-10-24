// Prüfskript für LINEUP_CHALLENGES (Kampagne), DAILY_CHALLENGES (Tages-Pool) - Prompt 35 - und DUEL_POOL (Duell/Frei spielen) - Prompt 60.
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
const DUELP = grabConst("DUEL_POOL"); // Duell-Pool (Prompt 60): darf leer sein
const DCATS = grabConst("DUEL_CATEGORIES");
const LAYOUTS = grabConst("PITCH_LAYOUTS", "{", "}");
const NAT = grabConst("NAT_NAMES", "{", "}");
const errors = [], notes = [], warns = [];
const warn = (m) => warns.push(m);
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
// Duell-Pool-Zusatzregeln (Prompt 60): Nostalgie nur Legenden (Stufe <= 3, anchors >= 4), knifflige (4-5) brauchen 2-3 anchors aus der Elf, Wettbewerb in einer Duell-Kategorie
function checkDuelExtras(w, m) {
  const startNorm = Object.values(m.players || {}).map((n) => norm(n));
  const inElf = (a) => { const t = norm(a); return startNorm.some((n) => n === t || n.endsWith(" " + t) || n.split(" ").includes(t)); };
  if (m.anchors !== undefined && !Array.isArray(m.anchors)) err(`${w}: anchors ist kein Array`);
  const an = Array.isArray(m.anchors) ? m.anchors : [];
  for (const a of an) if (!inElf(a)) err(`${w}: anchor "${a}" steht nicht in der Elf`);
  if (m.special === "nostalgie") {
    if (m.difficulty > 3) err(`${w}: nostalgie nur bis difficulty 3 (ist ${m.difficulty})`);
    if (an.length < 4) err(`${w}: nostalgie braucht anchors mit mind. 4 Weltstars/Legenden (hat ${an.length})`);
  } else if (m.difficulty >= 4 && (an.length < 2 || an.length > 3)) err(`${w}: Stufe ${m.difficulty} braucht anchors mit 2-3 bekannten Spielern (hat ${an.length})`);
  if (m.special !== "nostalgie" && !DCATS.some((c) => (c.leagues || []).includes(m.league))) err(`${w}: league "${m.league}" gehört zu keiner Duell-Kategorie`);
}
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

for (const [label, arr] of [["Kampagne", LINEUPS], ["Tag", DAILY], ["Duell", DUELP]]) {
  const ids = new Set(), games = new Set();
  for (const m of arr) {
    const w = `${label}:${m.id}`;
    for (const f of ["id", "comp", "league", "teams", "side", "context", "formation", "difficulty", "players"]) if (m[f] === undefined || m[f] === "") err(`${w}: Pflichtfeld ${f} fehlt`);
    if (ids.has(m.id)) err(`${w}: doppelte id`); ids.add(m.id);
    const gk = m.comp + "|" + m.teams + "|" + m.side; if (games.has(gk)) err(`${w}: doppelte Partie/Seite`); games.add(gk);
    const d = dateOf(m);
    if (!d) err(`${w}: kein Datum (dd.mm.yyyy) in comp`);
    else if (label !== "Duell") { if (d < "2008-01-01") err(`${w}: Spiel vor 2008 (${d})`); }
    else { // Duell-Pool (Prompt 60): ab 2000; 2000-2007 nur als nostalgie; nostalgie nur vor 2008
      if (d < "2000-01-01") err(`${w}: Spiel vor 2000 (${d})`);
      else if (d < "2008-01-01" && m.special !== "nostalgie") err(`${w}: Spiel ${d} (vor 2008) ohne special "nostalgie"`);
      if (m.special === "nostalgie" && d >= "2008-01-01") err(`${w}: special "nostalgie" mit Datum ${d} (ab 2008)`);
    }
    if (m.special !== undefined && !["nostalgie", "highlight"].includes(m.special)) err(`${w}: special "${m.special}" unbekannt (nostalgie | highlight)`);
    if (m.special === "nostalgie" && label !== "Duell") err(`${w}: nostalgie nur im Duell-Pool`);
    if (label === "Duell") checkDuelExtras(w, m);
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
    if (label === "Tag" || label === "Duell") {
      if (m.pairedWith && !LINEUPS.some((x) => x.id === m.pairedWith) && !DAILY.some((x) => x.id === m.pairedWith) && !DUELP.some((x) => x.id === m.pairedWith)) err(`${w}: pairedWith ${m.pairedWith} unbekannt`);
    }
  }
}
// Kampagne + Tag zusammen: Partie+Seite nur einmal
const all = [...LINEUPS, ...DAILY, ...DUELP];
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

// Bonus-Level (Prompt 48): stehen je Welt immer hinter allen Pflicht-Level (Freischaltung/Pokale zaehlen nur die Pflicht-Level)
for (let t = 1; t <= 5; t++) {
  const w = worlds[t - 1], firstBonus = w.findIndex((m) => m.bonus);
  if (firstBonus >= 0 && w.slice(firstBonus).some((m) => !m.bonus)) err(`Welt ${t}: Bonus-Level stehen nicht am Ende der Welt`);
  if (w.length && w.every((m) => m.bonus)) err(`Welt ${t}: nur Bonus-Level, keine Pflicht-Level`);
}
for (const m of DAILY) if (m.bonus) err(`Tag:${m.id}: bonus gilt nur fuer Kampagne`);

// Kategorien: jeder league-Wert muss in LEAGUE_GROUPS (Wissen) UND FREEPLAY_GROUPS (Frei spielen) vorkommen
const LGROUPS = grabConst("LEAGUE_GROUPS", "{", "}");
const FGROUPS = grabConst("FREEPLAY_GROUPS");
const inL = new Set(Object.values(LGROUPS).flat()), inF = new Set(FGROUPS.flatMap((g) => g.chips.flatMap((c) => c.leagues)));
for (const lg of new Set([...LINEUPS, ...DAILY].map((m) => m.league))) {
  if (!inL.has(lg)) err(`league "${lg}" fehlt in LEAGUE_GROUPS (Wissen)`);
  if (!inF.has(lg)) err(`league "${lg}" fehlt in FREEPLAY_GROUPS (Frei spielen)`);
}
for (const lg of new Set(DUELP.filter((m) => m.special !== "nostalgie").map((m) => m.league))) if (!inF.has(lg)) err(`Duell: league "${lg}" fehlt in FREEPLAY_GROUPS (Frei spielen)`);
const catOf = (m) => (Object.entries(LGROUPS).find(([, v]) => v.includes(m.league)) || ["?"])[0];

// Duell-Pool (Prompt 60): Kategorien-Zuordnung und Balance. Zaehlt nur, wenn der Pool Eintraege hat; Spiele aller drei Pools zaehlen, jede Partie einmal.
{
  const cc = vm.createContext({});
  vm.runInContext(`const DUEL_CATEGORIES = ${JSON.stringify(DCATS)}; const DUEL_LEAGUE_CAT = {}; DUEL_CATEGORIES.forEach(c => (c.leagues || []).forEach(l => { DUEL_LEAGUE_CAT[l] = c.id; })); ${grabFn("duelCategoriesOf")}`, cc);
  const catsOf = (m) => cc.duelCategoriesOf(m);
  const gameKey = (m) => (dateOf(m) || m.comp) + "|" + m.teams.replace(/\s+\d+:\d+.*$/, "");
  const sideKey = (m) => keys({ teams: m.side.replace(/^Aufstellung (von|des|der)\s+/i, "") })[0];
  // keine Partie doppelt (ueber alle drei Pools), ausser sie ist bewusst als zweite Seite verknuepft (pairedWith) - K/T-Spiegel sind schon verknuepft
  const byGame = new Map();
  for (const m of all) { const k = gameKey(m); if (!byGame.has(k)) byGame.set(k, []); byGame.get(k).push(m); }
  for (const [k, arr] of byGame) for (const m of arr) if (DUELP.includes(m) && arr.length > 1 && !m.pairedWith) err(`Duell:${m.id}: Partie doppelt (${arr.filter((x) => x !== m).map((x) => x.id).join(", ")}) - zweite Seite mit pairedWith markieren`);
  // Kategorien: Spiele (je Partie einmal, Kategorien aller Seiten vereint)
  const catGames = new Map(DCATS.map((c) => [c.id, []]));
  for (const [k, arr] of byGame) { const cats = new Set(arr.flatMap(catsOf)); for (const c of cats) catGames.get(c).push(arr[0]); }
  const poolCats = new Set(DUELP.flatMap(catsOf));
  notes.push(`Duell-Pool: ${DUELP.length} Aufstellungen (Ziel 200); Zaehlung je Kategorie (alle Pools, je Partie einmal):`);
  for (const c of DCATS) { const n = catGames.get(c.id).length, np = DUELP.filter((m) => catsOf(m).includes(c.id)).length; notes.push(`  ${c.label.padEnd(24)} ${String(n).padStart(3)} Partien (davon Duell-Pool ${np})${n < 20 && poolCats.has(c.id) ? "  <- unter Ziel 20" : ""}`); if (n < 20 && poolCats.has(c.id)) warn(`Kategorie ${c.label}: nur ${n} Partien (Ziel >= 20)`); }
  // Ausnahmen der Beteiligungs-Grenze (Prompt 60): Kategorie -> [Mannschaft (Regex auf den normalisierten Schluessel), Obergrenze %]
  const CAP = { es: [[/real madrid/, 60], [/barcelona/, 60], [/atletico/, 60]], it: [[/juventus/, 45], [/inter/, 45], [/mailand|milan/, 45]],
    en: [[/manchester city/, 40], [/liverpool/, 40], [/manchester united/, 40], [/arsenal/, 40], [/chelsea/, 40]], fr: [[/paris saint|psg/, 82]], nlpt: [[/ajax/, 45], [/benfica/, 45], [/porto/, 45]] };
  const capFor = (cid, key) => { const e = (CAP[cid] || []).find(([re]) => re.test(key)); return e ? e[1] : 30; };
  for (const c of DCATS) {
    if (!poolCats.has(c.id)) continue;
    const games = catGames.get(c.id), N = games.length, part = new Map();
    for (const g of games) for (const t of new Set(keys(g))) part.set(t, (part.get(t) || 0) + 1);
    const top = [...part.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    notes.push(`  Top-5-Beteiligung ${c.label}: ${top.map(([t, n]) => `${t} ${n} (${Math.round(n / N * 100)} %)`).join(" · ")}`);
    for (const [t, n] of part) { const pct = n / N * 100, cap = capFor(c.id, t); if (pct > cap) err(`Beteiligung ${c.label}: ${t} ${n} von ${N} Partien (${pct.toFixed(0)} % > ${cap} %)`); else if (pct > 25) warn(`Beteiligung ${c.label}: ${t} ${n} von ${N} Partien (${pct.toFixed(0)} %, Grenze ${cap} %)`); }
    const sides = new Set(games.map((g) => sideKey(g)));
    if (sides.size < 6) err(`Kategorie ${c.label}: nur ${sides.size} verschiedene gefragte Mannschaften (mind. 6)`);
    const mine = DUELP.filter((m) => catsOf(m).includes(c.id)).slice(0, 20), sc = new Map();
    for (const m of mine) sc.set(sideKey(m), (sc.get(sideKey(m)) || 0) + 1);
    // Mannschaften mit Beteiligungs-Ausnahme (CAP, z. B. Real/Barça/Atlético in Spanien) sind von dieser Reihenfolge-Regel ausgenommen: sie stellen dort bewusst den Großteil der Partien
    for (const [t, n] of sc) if (n > 2 && capFor(c.id, t) <= 30) err(`Kategorie ${c.label}: unter den ersten 20 steht ${t} ${n}-mal als gefragte Seite (max. 2)`);
    const lv = { leicht: games.filter((g) => g.difficulty <= 2).length, mittel: games.filter((g) => g.difficulty === 3).length, knifflig: games.filter((g) => g.difficulty >= 4).length };
    const pc = (n) => Math.round(n / N * 100);
    notes.push(`  Mix ${c.label}: leicht ${pc(lv.leicht)} % · mittel ${pc(lv.mittel)} % · knifflig ${pc(lv.knifflig)} %  (Ziel 40/40/20)`);
    if (Math.abs(pc(lv.leicht) - 40) > 15 || Math.abs(pc(lv.mittel) - 40) > 15 || Math.abs(pc(lv.knifflig) - 20) > 15) warn(`Mix ${c.label}: ${pc(lv.leicht)}/${pc(lv.mittel)}/${pc(lv.knifflig)} % weicht deutlich vom Ziel 40/40/20 ab`);
  }
  const sideCnt = new Map(); for (const m of DUELP) sideCnt.set(sideKey(m), (sideCnt.get(sideKey(m)) || 0) + 1);
  // Ausnahme Frankreich (Prompt 61f): PSG darf bis zu 14-mal gefragt werden, alle anderen max. 8
  for (const [t, n] of sideCnt) { const mx = /paris saint|psg/.test(t) ? 14 : 8; if (n > mx) err(`Duell-Pool: ${t} ${n}-mal als gefragte Mannschaft (max. ${mx})`); }
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
notes.push(`Kategorien (Wissen) Kampagne: ${JSON.stringify(cnt(LINEUPS, catOf))}`);
notes.push(`Kategorien (Wissen) Tag: ${JSON.stringify(cnt(DAILY, catOf))}`);
notes.push(`Kategorien (Wissen) gesamt: ${JSON.stringify(cnt(all, catOf))}`);
notes.push(`Bonus-Level je Welt: ${JSON.stringify(worlds.map((w) => w.filter((m) => m.bonus).length))} (Pflicht-Level: ${JSON.stringify(worlds.map((w) => w.filter((m) => !m.bonus).length))})`);
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
if (warns.length) console.log("\nHINWEISE (gelb, kein Fehler) (" + warns.length + "):\n" + warns.map((e) => " - " + e).join("\n"));
if (hints.length) console.log("\nNAMENSHINWEISE (" + hints.length + ", nur Meldungen):\n" + hints.map((e) => " - " + e).join("\n"));
if (errors.length) { console.log("\nFEHLER (" + errors.length + "):\n" + errors.map((e) => " - " + e).join("\n")); process.exit(1); }
console.log("\nOK - keine Fehler");
