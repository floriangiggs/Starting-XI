// Duell-Tests (Prompt 39): Link-Codec (v1/v2), Benutzername, Runden-Maske, Auswertung, Aufräumen/Löschen (Bilanz bleibt).
// Aufruf: node tools/test-duell.mjs [startelf_check.html]
// Die Funktionen werden unverändert aus der App geladen (vm), es gibt keine zweite Kopie der Logik.
import fs from "fs";
import vm from "vm";

const file = process.argv[2] || new URL("../startelf_check.html", import.meta.url).pathname;
const html = fs.readFileSync(file, "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));

const grabFn = (name) => {
  const i = script.indexOf("function " + name + "(");
  if (i < 0) throw new Error("Funktion nicht gefunden: " + name);
  return script.slice(i, script.indexOf("\n}\n", i) + 2);
};
// Konstante: Zeilen sammeln, bis die Anweisung syntaktisch vollständig ist
const grabConst = (name) => {
  const i = script.indexOf("const " + name + " = ");
  if (i < 0) throw new Error("Konstante nicht gefunden: " + name);
  let acc = "";
  for (const line of script.slice(i).split("\n")) {
    acc += line + "\n";
    try { new vm.Script(acc); return acc; } catch (e) { /* weiter */ }
  }
  throw new Error("Konstante unvollständig: " + name);
};

const ctx = { console, TextEncoder, TextDecoder, btoa, atob };
vm.createContext(ctx);
vm.runInContext([
  grabConst("PITCH_LAYOUTS"), grabFn("hashString"), grabFn("mulberry32"),
  grabFn("b64uEncode"), grabFn("b64uDecode"), grabConst("DUEL_CODE_VERSION"), grabConst("DUEL_TIMES"), grabConst("DUEL_SECONDS"), grabConst("DUEL_HANDLE_RE"),
  grabFn("duelHandleFromName"), grabFn("duelKeyStream"), grabFn("duelRoundToken"), grabFn("obfuscateResults"), grabFn("parseDuelRound"), grabFn("deobfuscateResults"),
  grabFn("encodeDuelCode"), grabFn("decodeDuelCode"), grabFn("extractDuelCode"), grabFn("duelOutcome"), grabFn("duelRoundExtras"),
  grabConst("DUEL_EXPIRE_MS"), grabConst("duelActivity"), grabConst("duelExpired"), grabFn("duelRemember"), grabFn("duelDelete"), grabFn("duelUndelete"), grabFn("duelMaintenance"),
  grabFn("applyDuelStats"), grabConst("RANK_RENAME"), grabConst("rankLabel"), grabFn("handleDuelInput"),
  "let duelRun = null; const saveProfile = () => {}; const dailyMatchById = () => ({ formation: '4-3-3' }); const evaluateDuel = () => true;",
  "let profile = { deviceId: 'meinegeraet', duels: {}, duelsDeleted: [], duelStats: { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, sweeps: 0, perOpponent: {}, form: [] } };",
].join("\n"), ctx);
const run = (code) => vm.runInContext(code, ctx);

let fails = 0, total = 0;
function check(label, cond, extra = "") {
  total++;
  if (!cond) { fails++; console.log(`FALSCH ${label}${extra ? ": " + extra : ""}`); }
}
const eq = (label, a, b) => check(label, JSON.stringify(a) === JSON.stringify(b), `${JSON.stringify(a)} statt ${JSON.stringify(b)}`);
ctx.__ = null;
const call = (expr, vars = {}) => { Object.assign(ctx, vars); return run(expr); };

// ---- Benutzername ----
eq("Handle Lisa Müller", call("duelHandleFromName('Lisa Müller')"), "lisa.mueller");
eq("Handle Flo", call("duelHandleFromName('Flo')"), "flo");
eq("Handle kurz", call("duelHandleFromName('Al')"), "al.xi");
eq("Handle Sonderzeichen", call("duelHandleFromName('  Ünal  Çelik!! ')"), "uenal.celik");
eq("Handle lang", call("duelHandleFromName('Maximilian Mustermann-Schmidt')").length <= 20, true);
for (const n of ["Lisa", "Flo", "Jo", "A", "X Y", "😀😀", "Ärger Übel"]) check(`Handle gültig für "${n}"`, call(`DUEL_HANDLE_RE.test(duelHandleFromName(${JSON.stringify(n)}))`));

// ---- Zeiten ----
eq("Zeiten", call("DUEL_SECONDS"), [60, 120, 180, 300]);

// ---- Codec Rundreise ----
const layout = call("PITCH_LAYOUTS['4-3-3'].map(p => p.abbr)");
const solvedA = { TW: 4, ST: 31, LA: 58 }; // Stichprobe: 3 gelöste Positionen
const exA = call("duelRoundExtras({ formation: '4-3-3' }, __s)", { __s: solvedA });
let expMask = 0; layout.forEach((a, i) => { if (a in solvedA) expMask |= 1 << i; });
eq("Maske von Hand", exA.mask, expMask);
eq("Maske Bit TW (0)", (exA.mask & 1) === 1, layout[0] === "TW");
eq("solvedAt Reihenfolge", exA.solvedAt, layout.map((a) => (a in solvedA ? solvedA[a] : null)));
const none = call("duelRoundExtras({ formation: '4-3-3' }, {})");
eq("leere Runde", [none.mask, none.solvedAt.every((x) => x === null)], [0, true]);

const rounds5 = [0, 1, 2, 3, 4].map((k) => ({ correct: 3 + k, seconds: 60 + k * 7, left: k % 2, ...call("duelRoundExtras({ formation: '4-3-3' }, __s)", { __s: { TW: k, ST: 10 + k } }) }));
const base = { id: "abcdef12", name: "Lisa", handle: "lisa.kickt", deviceId: "dev123", rank: "Stammspieler", level: 14, rounds: 5, seconds: 60, difficulty: 3, lineups: ["a", "b", "c", "d", "e"], results: rounds5 };
const code2 = call("encodeDuelCode('c', __p)", { __p: base });
const d2 = call("decodeDuelCode(__c)", { __c: code2 });
check("v2 ohne Fehler", !d2.error, JSON.stringify(d2.error));
eq("v2 Handle", d2.handle, "lisa.kickt");
eq("v2 60 Sekunden", d2.seconds, 60);
eq("v2 Runden (mask/solvedAt)", d2.results, rounds5);
eq("v2 Kopf", [d2.kind, d2.id, d2.name, d2.deviceId, d2.rank, d2.level, d2.rounds, d2.difficulty], ["c", "abcdef12", "Lisa", "dev123", "Stammspieler", 14, 5, 3]);
// Rückmeldung ohne Einstellungen, ohne Handle
const code2r = call("encodeDuelCode('r', __p)", { __p: { id: "abcdef12", name: "Tim", deviceId: "dev9", rank: "Profi", level: 3, results: rounds5.slice(0, 1) } });
const d2r = call("decodeDuelCode(__c)", { __c: code2r });
check("v2 Rückmeldung", !d2r.error && d2r.kind === "r" && d2r.handle === "" && d2r.results.length === 1);
// Runde ohne mask/solvedAt (alte Daten) übersteht die Rundreise
const oldRound = call("decodeDuelCode(__c)", { __c: call("encodeDuelCode('c', __p)", { __p: { ...base, rounds: 1, lineups: ["a"], results: [{ correct: 7, seconds: 100, left: 0 }] } }) });
eq("Runde ohne mask", oldRound.results, [{ correct: 7, seconds: 100, left: 0 }]);

// ---- Version 1 (alter Link) ----
function legacyCode(kind, p, v1seconds) {
  const next = call("duelKeyStream('" + p.id + "')");
  const s = (p.results || []).map((r) => [r.correct, r.seconds, r.left].join(".")).join("-");
  const hex = [...s].map((c) => (c.charCodeAt(0) ^ next()).toString(16).padStart(2, "0")).join("");
  const arr = [1, kind, p.id, p.name, p.deviceId, p.rank, p.level, p.rounds || 0, p.seconds || 0, p.difficulty || 0, p.lineups || [], hex];
  return call("b64uEncode(JSON.stringify([...__a, hashString(JSON.stringify(__a)).toString(36)]))", { __a: arr });
}
for (const sec of [120, 180, 300]) {
  const v1 = call("decodeDuelCode(__c)", { __c: legacyCode("c", { id: "0123abcd", name: "Alt", deviceId: "d1", rank: "Neuling", level: 2, rounds: 3, seconds: sec, difficulty: 2, lineups: ["x", "y", "z"], results: [{ correct: 5, seconds: 90, left: 0 }, { correct: 6, seconds: 100, left: 1 }, { correct: 4, seconds: 120, left: 0 }] }) });
  check(`v1-Link (${sec} s) lesbar`, !v1.error && v1.handle === "" && v1.seconds === sec && v1.results.length === 3 && v1.results[1].correct === 6 && v1.results[1].mask === undefined, JSON.stringify(v1));
}
const v1r = call("decodeDuelCode(__c)", { __c: legacyCode("r", { id: "0123abcd", name: "AltR", deviceId: "d2", rank: "Profi", level: 9, results: [{ correct: 8, seconds: 77, left: 0 }] }) });
check("v1-Rückmeldung lesbar", !v1r.error && v1r.kind === "r" && v1r.results[0].seconds === 77);

// ---- Fehlerfälle ----
const tamper = code2.slice(0, -4) + (code2.slice(-4) === "AAAA" ? "BBBB" : "AAAA");
check("Prüfsumme/Format bei Manipulation", ["checksum", "format"].includes(call("decodeDuelCode(__c)", { __c: tamper }).error));
const encRaw = (arr) => call("b64uEncode(JSON.stringify([...__a, hashString(JSON.stringify(__a)).toString(36)]))", { __a: arr });
const v2arr = (over = {}) => {
  const p = { id: "abcdef12", name: "X", handle: "", deviceId: "d", rank: "R", level: 1, rounds: 1, seconds: 60, difficulty: 1, lineups: ["a"], hex: "", ...over };
  return [2, "c", p.id, p.name, p.handle, p.deviceId, p.rank, p.level, p.rounds, p.seconds, p.difficulty, p.lineups, p.hex];
};
eq("Version 3 -> version", call("decodeDuelCode(__c)", { __c: encRaw([3, ...v2arr().slice(1)]) }).error, "version");
eq("90 Sekunden -> format", call("decodeDuelCode(__c)", { __c: encRaw(v2arr({ seconds: 90 })) }).error, "format");
eq("Format 2 Runden -> format", call("decodeDuelCode(__c)", { __c: encRaw(v2arr({ rounds: 2 })) }).error, "format");
check("unbrauchbarer Handle wird verworfen, nicht abgelehnt", call("decodeDuelCode(__c)", { __c: encRaw(v2arr({ handle: "<b>böse</b>" })) }).handle === "");
const obf = (s) => { const next = call("duelKeyStream('abcdef12')"); return [...s].map((c) => (c.charCodeAt(0) ^ next()).toString(16).padStart(2, "0")).join(""); };
eq("Maske zu groß -> format", call("decodeDuelCode(__c)", { __c: encRaw(v2arr({ hex: obf("5.60.0.zzz.n") })) }).error, "format");
eq("solvedAt falsche Länge -> format", call("decodeDuelCode(__c)", { __c: encRaw(v2arr({ hex: obf("5.60.0.1.1_2_3") })) }).error, "format");
eq("Rundenzeile ok", call("decodeDuelCode(__c)", { __c: encRaw(v2arr({ hex: obf("5.60.0.7.1_2_3_x_x_x_x_x_x_x_x") })) }).results[0].solvedAt.slice(0, 4), [1, 2, 3, null]);

// ---- Auswertung (unverändert) ----
const out = call("duelOutcome(__m, __t)", { __m: [{ correct: 7, seconds: 100 }, { correct: 5, seconds: 90 }], __t: [{ correct: 7, seconds: 93 }, { correct: 6, seconds: 100 }] });
eq("Runden", out.rounds.map((r) => r.w + ":" + r.by), ["op:time", "op:correct"]);
eq("Duell", [out.mw, out.ow, out.outcome], [0, 2, "loss"]);

// ---- Abgelaufen / Löschen / Aufräumen: Bilanz bleibt ----
const DAY = 86400000, NOW = Date.now();
const stats = () => JSON.stringify(call("profile.duelStats"));
call("profile.duelStats = { wins: 5, losses: 3, draws: 1, streak: 2, bestStreak: 4, sweeps: 1, perOpponent: { x: { name: 'Lisa', w: 3, l: 1, d: 0 } }, form: ['w', 'l', 'w', 'w', 'd'] }");
const before = stats();
call("profile.duels = { a: { status: 'todo', created: __n - 20 * __D, updated: __n - 13 * __D, mine: [], settings: { rounds: 1 } }, b: { status: 'waiting', created: __n - 40 * __D, updated: __n - 15 * __D }, c: { status: 'todo', created: __n - 50 * __D, updated: __n - 43 * __D }, d: { status: 'todo', created: __n - 90 * __D, updated: __n - 45 * __D }, e: { status: 'done', created: __n - 200 * __D, finished: __n - 100 * __D, result: {} } }; profile.duelsDeleted = [];", { __n: NOW, __D: DAY });
check("13 Tage nicht abgelaufen", !call("duelExpired(profile.duels.a, __n)", { __n: NOW }));
check("15 Tage abgelaufen", call("duelExpired(profile.duels.b, __n)", { __n: NOW }));
check("beendetes Duell nie abgelaufen", !call("duelExpired(profile.duels.e, __n)", { __n: NOW }));
call("duelMaintenance(__n)", { __n: NOW });
check("43 Tage bleibt, 45 Tage weg", call("'c' in profile.duels && !('d' in profile.duels)"));
check("gelöschte ID gemerkt", call("profile.duelsDeleted.includes('d')"));
check("Bilanz nach Aufräumen gleich", stats() === before);
const entry = call("duelDelete('b')");
check("duelDelete liefert Eintrag", entry && entry.id === "b" && !call("'b' in profile.duels") && call("profile.duelsDeleted.includes('b')"));
check("Bilanz nach Löschen gleich", stats() === before);
call("duelUndelete(__e)", { __e: entry });
check("Rückgängig stellt her", call("'b' in profile.duels && !profile.duelsDeleted.includes('b')") && stats() === before);
call("duelRun = { id: 'b' }");
check("laufendes Duell nicht löschbar", call("duelDelete('b')") === null && call("'b' in profile.duels"));
call("duelRun = null");
// Historie: 35 beendete Duelle -> nur die neuesten 30 bleiben, Bilanz unberührt
call("profile.duels = {}; for (let i = 0; i < 35; i++) profile.duels['h' + i] = { status: 'done', created: __n - i * 1000, finished: __n - i * 1000, result: {} }; profile.duelsDeleted = [];", { __n: NOW });
call("duelMaintenance(__n)", { __n: NOW });
check("30 beendete Duelle bleiben", call("Object.keys(profile.duels).length") === 30 && call("'h0' in profile.duels && 'h29' in profile.duels && !('h30' in profile.duels)"));
check("Bilanz nach Historie-Kürzung gleich", stats() === before);
// Liste gelöschter IDs: höchstens 200
call("profile.duelsDeleted = []; for (let i = 0; i < 230; i++) duelRemember('id' + i);");
check("gelöschte IDs max. 200", call("profile.duelsDeleted.length") === 200 && call("profile.duelsDeleted[199]") === "id229" && !call("profile.duelsDeleted.includes('id0')"));

// ---- Link zu gelöschtem Duell wird ignoriert ----
call("profile.duels = {}; profile.duelsDeleted = ['abcdef12'];");
eq("gelöschtes Duell -> deleted", call("handleDuelInput(__c)", { __c: code2 }).error, "deleted");
call("profile.duelsDeleted = [];");
check("normaler Link wird angelegt", call("handleDuelInput(__c)", { __c: code2 }).ok === true && call("profile.duels['abcdef12'].opponent.handle") === "lisa.kickt" && call("profile.duels['abcdef12'].updated") > 0);

// ---- Form der Bilanz ----
call("profile.duelStats.form = []; applyDuelStats({ settings: { rounds: 3 }, opponent: null }, { outcome: 'win', mw: 2 }); applyDuelStats({ settings: { rounds: 3 }, opponent: null }, { outcome: 'loss', mw: 0 });");
eq("Form", call("profile.duelStats.form"), ["w", "l"]);

console.log(fails ? `\n${fails} von ${total} Prüfungen FEHLGESCHLAGEN` : `OK - ${total} Duell-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
