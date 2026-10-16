// Test fuer levelProgress() (Prompt 49): Anzeige "Noch x XP bis Level n+1" muss zu levelFromXP passen.
// Aufruf: node tools/test-xp.mjs
import fs from "fs";
import vm from "vm";
const file = new URL("../startelf_check.html", import.meta.url).pathname;
const html = fs.readFileSync(file, "utf8");
const grab = (name) => { const i = html.indexOf("function " + name + "("); let d = 0, k = html.indexOf("{", i); for (; k < html.length; k++) { if (html[k] === "{") d++; else if (html[k] === "}") { d--; if (d === 0) break; } } return html.slice(i, k + 1); };
const ctx = {}; vm.createContext(ctx);
vm.runInContext(["xpForLevel", "levelFromXP", "levelProgress"].map(grab).join("\n"), ctx);
let fails = 0; const rows = [];
const check = (xp) => {
  const r = ctx.levelProgress(xp), ok = r.level === ctx.levelFromXP(xp) && r.pct >= 0 && r.pct < 1 && r.remaining > 0 && r.remaining === r.next - xp && r.base <= xp && xp < r.next && r.intoLevel + r.remaining === r.needed;
  if (!ok) { fails++; console.log("FEHLER bei", xp, r); }
  return r;
};
for (const xp of [0, 1, 224, 225, 226, 449, 450, 1000, 5000]) { const r = check(xp); rows.push(`${String(xp).padStart(5)} XP -> Level ${String(r.level).padStart(2)}  ${r.intoLevel}/${r.needed}  noch ${r.remaining}  ${(r.pct * 100).toFixed(1)} %`); }
for (let L = 1; L <= 35; L++) { const from = L === 1 ? 0 : ctx.xpForLevel(L); const to = ctx.xpForLevel(L + 1); for (const xp of [from, from + 1, to - 1]) { const r = check(xp); if (r.level !== L) { fails++; console.log("Level falsch", L, xp, r.level); } } if (check(to).level !== L + 1) { fails++; console.log("Uebergang falsch", L); } }
console.log(rows.join("\n"));
console.log(fails ? `FEHLER - ${fails} Pruefungen fehlgeschlagen` : "OK - levelProgress passt zu levelFromXP (Level 1-35, Uebergaenge)");
process.exit(fails ? 1 : 0);
