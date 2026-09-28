// Berechnet aus LINEUP_CHALLENGES die maximal erreichbaren "Inhalts-XP" (alle
// Aufstellungen mit ⭐⭐⭐, realistische Kombo) und zeigt eine Tabelle
// Level -> benoetigte XP fuer verschiedene Kurven-Konstanten (Prompt 11).
// Aufruf: node tools/xp-sim.mjs
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "..", "startelf_check.html");
const html = readFileSync(htmlPath, "utf8");

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const script = scriptMatch[1];

const lineupMatch = script.match(/const LINEUP_CHALLENGES = (\[[\s\S]*?\n\]);/);
const xpRulesMatch = script.match(/const XP_RULES = (\{[\s\S]*?\n\};)/);
if (!lineupMatch || !xpRulesMatch) {
  console.error("Konnte LINEUP_CHALLENGES oder XP_RULES nicht aus startelf_check.html extrahieren.");
  process.exit(1);
}
const LINEUP_CHALLENGES = eval(lineupMatch[1]);
const XP_RULES = eval("(" + xpRulesMatch[1].slice(0, -1) + ")");

const POSITIONS_PER_LINEUP = 11; // alle PITCH_LAYOUTS-Formationen haben exakt 11 Positionen

function comboSumFor(base, step, cap, n) {
  let sum = 0;
  for (let k = 1; k <= n; k++) sum += Math.min(base + step * (k - 1), cap);
  return sum;
}

const comboSum = comboSumFor(XP_RULES.positionBase, XP_RULES.positionComboStep, XP_RULES.positionComboCap, POSITIONS_PER_LINEUP);
const starSum = XP_RULES.starBonus[1] + XP_RULES.starBonus[2] + XP_RULES.starBonus[3];
const perLineup = comboSum + starSum + XP_RULES.firstPlayXP;
const numLineups = LINEUP_CHALLENGES.length;
const maxXP = perLineup * numLineups;

console.log(`Aufstellungen: ${numLineups}`);
console.log(`Positions-XP pro Aufstellung (Kombo 1..${POSITIONS_PER_LINEUP}, Basis ${XP_RULES.positionBase}, +${XP_RULES.positionComboStep}/Stufe, Deckel ${XP_RULES.positionComboCap}): ${comboSum}`);
console.log(`Sternen-Boni pro Aufstellung (⭐${XP_RULES.starBonus[1]} + ⭐⭐${XP_RULES.starBonus[2]} + ⭐⭐⭐${XP_RULES.starBonus[3]}): ${starSum}`);
console.log(`Erstversuch-Bonus pro Aufstellung: ${XP_RULES.firstPlayXP}`);
console.log(`=> Max. XP pro Aufstellung: ${perLineup}`);
console.log(`=> Max. Inhalts-XP gesamt (alle ${numLineups} Aufstellungen ⭐⭐⭐): ${maxXP}\n`);

function xpForLevel(a, n) { return a * n * (n + 1) / 2; }
function levelFromXP(a, totalXP) {
  let level = 1;
  while (xpForLevel(a, level + 1) <= totalXP) level++;
  return level;
}

console.log("Kurven-Varianten xpForLevel(n) = a * n * (n+1) / 2:");
console.log("a".padEnd(6) + "Level bei maxXP".padEnd(18) + "xpForLevel(25)".padEnd(16) + "xpForLevel(30)");
[60, 65, 70, 75, 80, 85, 90, 100].forEach(a => {
  const lvl = levelFromXP(a, maxXP);
  console.log(
    String(a).padEnd(6) +
    String(lvl).padEnd(18) +
    String(xpForLevel(a, 25)).padEnd(16) +
    String(xpForLevel(a, 30))
  );
});

const CHOSEN_A = 75; // siehe Plan/Kommentar bei xpForLevel() in startelf_check.html
console.log(`\nGewaehlte Konstante a = ${CHOSEN_A} - Level-Tabelle:`);
console.log("Level".padEnd(8) + "benoetigte Gesamt-XP");
for (let l = 1; l <= 30; l++) {
  console.log(String(l).padEnd(8) + xpForLevel(CHOSEN_A, l));
}
const gapToLevel30 = xpForLevel(CHOSEN_A, 30) - maxXP;
console.log(`\nLuecke von maxXP bis Level 30: ${gapToLevel30} XP (~${Math.round(gapToLevel30 / 60)} XP/Tag ueber 60 Tage)`);
