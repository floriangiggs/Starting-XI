// Duell-Auswahl-Tests (Prompt 60): Kategorien-Zuordnung, pickDuelRounds (Team-/Stufen-/Kategorie-/30-Tage-Regeln), duelCategoryOffers.
// Aufruf: node tools/test-duell-auswahl.mjs [startelf_check.html]
// Die Funktionen werden unveraendert aus der App geladen (vm), es gibt keine zweite Kopie der Logik.
import fs from "fs";
import vm from "vm";

const file = process.argv[2] || new URL("../startelf_check.html", import.meta.url).pathname;
const html = fs.readFileSync(file, "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
const grabFn = (name) => { const i = script.indexOf("function " + name + "("); if (i < 0) throw new Error("Funktion nicht gefunden: " + name); return script.slice(i, script.indexOf("\n}\n", i) + 2); };
const grabConst = (name) => {
  const i = script.indexOf("const " + name + " = "); if (i < 0) throw new Error("Konstante nicht gefunden: " + name);
  let acc = ""; for (const line of script.slice(i).split("\n")) { acc += line + "\n"; try { new vm.Script(acc); return acc; } catch (e) { /* weiter */ } }
  throw new Error("Konstante unvollstaendig: " + name);
};
const ctx = { console, profile: { duels: {} } };
vm.createContext(ctx);
vm.runInContext([grabConst("DUEL_CATEGORIES"), "const DUEL_LEAGUE_CAT = {}; DUEL_CATEGORIES.forEach(c => (c.leagues || []).forEach(l => { DUEL_LEAGUE_CAT[l] = c.id; }));",
  grabFn("duelCategoriesOf"), grabConst("DUEL_NO_REPEAT_DAYS"), grabFn("duelOpponentRecentIds"), grabConst("TEAM_KEY_ALIAS"), grabFn("matchTeamKeys"),
  grabFn("pickDuelRounds"), grabFn("duelCategoryOffers")].join("\n"), ctx);

let ok = 0, bad = 0;
const t = (name, cond, extra = "") => { if (cond) ok++; else { bad++; console.log("FEHLER: " + name + (extra ? " - " + extra : "")); } };
const run = (code) => vm.runInContext(code, ctx);
ctx.rngSeed = 1;
run("let _s = 1; function seeded(seed) { _s = seed; return () => { _s = (_s * 1664525 + 1013904223) % 4294967296; return _s / 4294967296; }; }");

// --- Kategorien-Zuordnung ---
const cats = (m) => run("duelCategoriesOf(" + JSON.stringify(m) + ")");
t("12 Kategorien", run("DUEL_CATEGORIES.length") === 12);
t("Champions League", cats({ league: "Champions League" }).join() === "cl");
t("WM + Confed Cup", cats({ league: "Confed Cup" }).join() === "wm" && cats({ league: "Weltmeisterschaft" }).join() === "wm");
t("EM + Nations League", cats({ league: "Nations League" }).join() === "em");
t("Europa + Conference League", cats({ league: "Conference League" }).join() === "el");
t("Bundesliga/DFB-Pokal = Deutschland", cats({ league: "Bundesliga / DFB-Pokal" }).join() === "de");
t("Niederlande & Portugal", ["Eredivisie", "Liga Portugal", "KNVB-Pokal", "Taça de Portugal"].every((l) => cats({ league: l }).join() === "nlpt"));
t("Frankreich", cats({ league: "Ligue 1" }).join() === "fr" && cats({ league: "Coupe de France" }).join() === "fr");
t("highlight zusaetzlich", cats({ league: "Premier League", special: "highlight" }).join() === "en,highlight");
t("nostalgie nur Nostalgie", cats({ league: "Champions League", special: "nostalgie" }).join() === "nostalgie");
t("unbekannte Liga = keine Wettbewerbs-Kategorie", cats({ league: "Fantasieliga" }).length === 0);
t("hoechstens 2 Kategorien", cats({ league: "Serie A", special: "highlight" }).length <= 2);

// --- Testpool ---
const TEAMS = ["Bayern", "Dortmund", "Real Madrid", "Barcelona", "Juventus", "Inter", "Liverpool", "Arsenal", "PSG", "Ajax", "Benfica", "Porto", "Leverkusen", "Chelsea", "Milan", "Atletico"];
const LEAGUES = ["Champions League", "Europa League", "Weltmeisterschaft", "Europameisterschaft", "Bundesliga", "Premier League", "LaLiga", "Serie A", "Ligue 1", "Eredivisie"];
let n = 0;
const mk = (a, b, league, difficulty, extra = {}) => ({ id: "t" + (++n), teams: `${a} gegen ${b} 1:0`, league, difficulty, ...extra });
const pool = [];
for (let i = 0; i < 90; i++) {
  const a = TEAMS[i % TEAMS.length], b = TEAMS[(i * 7 + 3) % TEAMS.length];
  if (a === b) continue;
  const d = [1, 2, 3, 4, 5, 2, 3, 1, 4][i % 9];
  pool.push(mk(a, b, LEAGUES[i % LEAGUES.length], d, i % 11 === 0 ? { special: "highlight" } : i % 13 === 0 ? { special: "nostalgie", league: "Champions League" } : {}));
}
const byId = new Map(pool.map((m) => [m.id, m]));
const pick = (opts, seed) => { ctx._opts = { pool, rounds: 5, ...opts }; return run(`pickDuelRounds({ ..._opts, rng: seeded(${seed}) })`); };
const teamsOf = (id) => run("matchTeamKeys(" + JSON.stringify(byId.get(id)) + ")");

// --- pickDuelRounds: Zufallslaeufe ---
let teamViol = 0, firstHard = 0, hardViol = 0, dup = 0, short = 0, catRepeat = 0, total = 0;
for (let s = 1; s <= 400; s++) {
  const rounds = [3, 5, 7][s % 3];
  const ids = pick({ rounds }, s); total++;
  if (ids.length !== rounds) short++;
  if (new Set(ids).size !== ids.length) dup++;
  for (let i = 1; i < ids.length; i++) if (teamsOf(ids[i]).some((x) => teamsOf(ids[i - 1]).includes(x))) teamViol++;
  if (byId.get(ids[0]).difficulty >= 4) firstHard++;
  for (let i = 0; i + 2 < ids.length + 0; i++) if (ids.slice(i, i + 3).filter((id) => byId.get(id).difficulty >= 4).length > 1) hardViol++;
  const cs = ids.map((id) => cats(byId.get(id))[0]);
  if (rounds <= 5 && new Set(cs).size < Math.min(rounds, 8) - 1) catRepeat++;
}
t("immer volle Rundenzahl", short === 0, short + " Laeufe zu kurz");
t("keine doppelte Aufstellung im Duell", dup === 0);
t("keine Mannschaft in zwei Runden hintereinander (400 Laeufe)", teamViol === 0, teamViol + " Verstoesse");
t("Runde 1 nie Stufe 4-5 (Mix)", firstHard === 0, firstHard + " Verstoesse");
t("hoechstens 1 knifflige je 3 Runden (Mix)", hardViol === 0, hardViol + " Verstoesse");
t("Kategorien ueberwiegend verschieden", catRepeat === 0, catRepeat + " Laeufe mit vielen Wiederholungen");

// ausdrueckliche Stufe bleibt massgeblich
for (const d of [1, 3, 5]) { const ids = pick({ difficulty: d, rounds: 4 }, 7 + d); t(`Stufe ${d} gefiltert`, ids.length > 0 && ids.every((id) => byId.get(id).difficulty === d)); }

// --- recentIds / 30 Tage ---
{
  const first = pick({ rounds: 5 }, 42), second = pick({ rounds: 5, recentIds: first }, 42);
  t("duelRecent wird gemieden, wenn genug da sind", second.every((id) => !first.includes(id)));
  const opp = pick({ rounds: 5, opponentIds: first }, 42);
  t("Aufstellungen der letzten 30 Tage gegen denselben Gegner werden gemieden", opp.every((id) => !first.includes(id)));
  const now = Date.now(), DAY = 86400000;
  ctx._duels = { a: { opponent: { deviceId: "X" }, created: now - 5 * DAY, lineups: ["t1", "t2"] }, b: { opponent: { deviceId: "X" }, created: now - 40 * DAY, lineups: ["t3"] }, c: { opponent: { deviceId: "Y" }, created: now - 1 * DAY, lineups: ["t4"] } };
  const got = run("duelOpponentRecentIds('X', Date.now(), _duels)");
  t("30-Tage-Fenster: nur juengere Duelle desselben Gegners", got.join() === "t1,t2", got.join());
  t("ohne Gegner-ID keine Sperre", run("duelOpponentRecentIds(null, Date.now(), _duels)").length === 0);
}

// --- Lockerung bei kleinem Pool (nie ein Fehler) ---
{
  const small = pool.slice(0, 4); ctx._small = small;
  const ids = run("pickDuelRounds({ pool: _small, rounds: 5, recentIds: _small.map(m => m.id), opponentIds: _small.map(m => m.id), rng: seeded(3) })");
  t("kleiner Pool: liefert alle vorhandenen, ohne Fehler", ids.length === 4 && new Set(ids).size === 4, ids.length + " statt 4");
  const leer = run("pickDuelRounds({ pool: [], rounds: 5 })");
  t("leerer Pool: leere Liste", Array.isArray(leer) && leer.length === 0);
  const nurHart = pool.filter((m) => m.difficulty >= 4).slice(0, 5); ctx._hard = nurHart;
  const h = run("pickDuelRounds({ pool: _hard, rounds: 5, rng: seeded(5) })");
  t("nur knifflige Aufstellungen: Regeln werden gelockert statt Abbruch", h.length === nurHart.length);
}

// --- duelCategoryOffers ---
{
  let distinct = 0, pause = 0, len = 0;
  for (let s = 1; s <= 300; s++) {
    const hist = ["cl", "de", "en", "it", "fr"].slice(0, s % 6);
    ctx._hist = hist;
    const o = run(`duelCategoryOffers(_hist, seeded(${s}))`);
    if (o.length !== 3) len++;
    if (new Set(o).size !== 3) distinct++;
    if (o.some((c) => hist.slice(-2).includes(c))) pause++;
  }
  t("immer 3 Angebote", len === 0);
  t("3 verschiedene Kategorien", distinct === 0);
  t("Kategorie erst wieder, wenn 2 andere dran waren", pause === 0, pause + " Verstoesse");
  ctx._h2 = ["cl", "de"];
  const few = run("duelCategoryOffers(_h2, seeded(1), ['cl','de','en','it'])");
  t("zu wenig Kategorien: Pause wird gelockert", few.length === 3 && new Set(few).size === 3);
}

console.log(`${ok} Pruefungen OK` + (bad ? `, ${bad} FEHLER` : ""));
process.exit(bad ? 1 : 0);
