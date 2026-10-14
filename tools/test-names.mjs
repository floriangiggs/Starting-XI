// Namenstests (Prompt 38): prüft isAcceptedFor()/isNearFor() gegen die echten Daten aus startelf_check.html.
// Aufruf: node tools/test-names.mjs [startelf_check.html]
// Lädt die Funktionen unverändert aus der App (vm), es gibt keine zweite Kopie der Logik.
import fs from "fs";
import vm from "vm";

const file = process.argv[2] || new URL("../startelf_check.html", import.meta.url).pathname;
const html = fs.readFileSync(file, "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));

// Funktionen und Konstanten stehen in der App auf oberster Ebene: Ende = erste Zeile, die mit "}" bzw. "];"/"};" beginnt.
// (Eine Klammerzählung scheitert an Regex-Literalen wie /['’`]/ in normalizeName.)
const grabFn = (name) => {
  const i = script.indexOf("function " + name + "(");
  if (i < 0) throw new Error("Funktion nicht gefunden: " + name);
  return script.slice(i, script.indexOf("\n}\n", i) + 2);
};
const grabConst = (name) => {
  const i = script.indexOf("const " + name + " = ");
  if (i < 0) throw new Error("Konstante nicht gefunden: " + name);
  const m = /\n[\]}];/.exec(script.slice(i));
  const single = script.indexOf(";\n", i), multi = m ? i + m.index + 3 : Infinity;
  const nl = script.indexOf("\n", i); // einzeilige Konstante?
  const line = script.slice(i, nl);
  return /;\s*$/.test(line) || /;\s*\/\//.test(line) ? line : script.slice(i, Math.min(multi, single < 0 ? Infinity : multi));
};

const ctx = {};
vm.createContext(ctx);
vm.runInContext([
  grabConst("SPECIAL_CHAR_MAP"),
  grabFn("normalizeName"), grabFn("foldUmlautDigraphs"), grabFn("acceptedNames"), grabFn("isAcceptedFor"),
  grabFn("damerauLevenshtein"), grabConst("FUZZY"), grabFn("isNearFor"),
  grabConst("LINEUP_CHALLENGES"), grabConst("DAILY_CHALLENGES"),
].join("\n"), ctx);
const run = (code) => vm.runInContext(code, ctx);
const ALL = run("[...LINEUP_CHALLENGES, ...DAILY_CHALLENGES]");
const byId = (id) => ALL.find((m) => m.id === id);

let fails = 0, total = 0;
function acc(id, abbr, typed, expected) {
  total++;
  const m = byId(id);
  if (!m) { fails++; console.log(`FEHLT  ${id}`); return; }
  ctx.__m = m;
  const got = run(`isAcceptedFor(__m, ${JSON.stringify(abbr)}, ${JSON.stringify(typed)})`);
  if (got !== expected) { fails++; console.log(`FALSCH ${id} ${abbr} "${typed}": ${got} statt ${expected}`); }
}
function near(id, abbr, typed, expected) {
  total++;
  const m = byId(id);
  ctx.__m = m;
  const got = run(`isNearFor(__m, ${JSON.stringify(abbr)}, ${JSON.stringify(typed)})`);
  if (got !== expected) { fails++; console.log(`FALSCH (nah) ${id} ${abbr} "${typed}": ${got} statt ${expected}`); }
}

// ---- Teil 1: Martínez je Position ----
const KOL = "argentinien-kolumbien-2024", COPA = "argentinien-brasilien-copa-2021", WM22 = "wm-finale-2022";
acc(KOL, "TW", "Martinez", true);
acc(KOL, "LIV", "Martinez", true);
acc(KOL, "RIV", "Martinez", false); // dort Romero
acc(KOL, "ST", "Martinez", false);  // dort Álvarez
acc(COPA, "TW", "Martinez", true);
acc(COPA, "LST", "Martinez", true);
acc(COPA, "RST", "Martinez", false); // dort Messi
acc(COPA, "LIV", "Martinez", false); // dort Otamendi
acc(WM22, "TW", "Martinez", true);
acc(WM22, "ST", "Martinez", false);  // dort Álvarez
for (const t of ["Martínez", "martinez", "MARTINEZ", "E. Martinez", "Emiliano Martinez", "Emiliano", "Dibu", "dibu martinez"]) acc(KOL, "TW", t, true);
for (const t of ["Martínez", "martinez", "MARTINEZ", "Lisandro Martinez", "lisandro", "L. Martinez"]) acc(KOL, "LIV", t, true);
for (const t of ["Martínez", "martinez", "Lautaro Martinez", "lautaro", "L. Martinez"]) acc(COPA, "LST", t, true);
// Vornamen dürfen nicht auf die falsche Martínez-Position passen
acc(KOL, "TW", "Lisandro", false);
acc(KOL, "LIV", "Emiliano", false);
acc(COPA, "TW", "Lautaro", false);
acc(COPA, "LST", "Emiliano", false);
// "Fast richtig" biegt Martinez nicht auf eine falsche Position um
near(KOL, "RIV", "Martinez", false);
near(KOL, "ST", "Martinez", false);
near(COPA, "RST", "Martinez", false);

console.log(fails ? `\n${fails} von ${total} Prüfungen FEHLGESCHLAGEN` : `OK - ${total} Namensprüfungen bestanden`);
process.exit(fails ? 1 : 0);
