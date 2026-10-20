// Abpfiff-Bildschirm (Prompt 54 Paket B): Sieg / Niederlage / Remis / Warten (Herausforderer + Eingeladener), Layout ohne Ueberlauf.
// Aufruf: node tools/test-duell-abpfiff.mjs [--shots <ordner>]
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const html = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "startelf_check.html");
const shots = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra ? ": " + extra : ""}`); } };
const R = (c, s) => ({ correct: c, seconds: s, left: 0 });
const CASES = [
  ["sieg", "challenger", [R(9, 90), R(8, 100), R(7, 110)], [R(7, 90), R(6, 100), R(7, 120)], /Sieg!/],
  ["niederlage", "opponent", [R(5, 90), R(6, 100), R(7, 110)], [R(8, 90), R(9, 100), R(7, 100)], /Niederlage/],
  ["remis", "opponent", [R(7, 90), R(7, 100)], [R(7, 90), R(7, 100)], /Remis/, 2],
  ["warten", "challenger", [R(6, 80), R(7, 100), R(8, 110)], null, /Gespielt!/],
  ["warten_eingeladen", "opponent", [R(6, 80), R(7, 100), R(8, 110)], null, /Gespielt!/],
];
for (const [w, h] of [[393, 852], [375, 667]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("file://" + html); await page.waitForTimeout(6500);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [name, role, mine, theirs, word, rounds] of CASES) {
    const info = await page.evaluate(({ role, mine, theirs, rounds }) => {
      profile.duelName = "Anna"; profile.duelHandle = "anna"; saveProfile(profile);
      const id = createDuel({ rounds: rounds || 3, seconds: 120, difficulty: 0 }), d = profile.duels[id];
      d.opponent = { name: "Lisa", deviceId: "lisa1", handle: "lisa", rank: "Profiliga", level: 14 };
      d.role = role; d.mine = mine; d.theirs = theirs; d.playedRounds = mine.length; d.status = theirs ? "todo" : "waiting";
      if (theirs) evaluateDuel(id);
      activeResultId = id; navStack.length = 0; navigate("start");
      return id;
    }, { role: role === "opponent" ? "opponent" : "challenger", mine, theirs, rounds });
    await page.waitForTimeout(500); await page.evaluate(() => navigate("duelresult")); await page.waitForTimeout(600);
    const s = await page.evaluate(() => {
      const root = document.getElementById("duelResultView"), scr = document.getElementById("screen-duelresult"), body = root.querySelector(".du-body");
      const cta = root.querySelector(".du-cta"), over = root.querySelector("#duelResOver, #duelResRematch");
      return { big: (root.querySelector(".du-big") || {}).textContent, rr: root.querySelectorAll(".du-rr").length, crowns: root.querySelectorAll(".du-rr svg.crown").length,
        locks: root.querySelectorAll(".du-rr .lockv").length, chips: root.querySelectorAll(".du-chip").length, zettel: !!root.querySelector(".du-zettel"),
        score: [...root.querySelectorAll(".du-sb .t b")].map(b => b.textContent).join(":"), cta: cta && cta.textContent.trim(), second: over && over.textContent.trim(),
        topTitle: (root.querySelector(".du-h1") || {}).textContent, xp: (root.querySelector(".du-xp b") || {}).textContent,
        emoji: /[\u{1F300}-\u{1FAFF}☀-➿]/u.test(root.innerText), overflowX: document.documentElement.scrollWidth > innerWidth + 1,
        bodyScroll: body.scrollHeight > body.clientHeight + 1, ctaBottomOk: cta ? (cta.getBoundingClientRect().bottom <= innerHeight + 1 || body.scrollHeight > body.clientHeight) : true,
        screen: navStack[navStack.length - 1], boardIn: (() => { const b = root.querySelector(".du-board").getBoundingClientRect(); return (b.left >= 0 && b.right <= innerWidth) || [Math.round(b.left), Math.round(b.right), innerWidth]; })(), sl: scr.scrollLeft + body.scrollLeft + root.scrollLeft, font: getComputedStyle(root.querySelector(".du-big")).fontFamily.slice(0, 5) };
    });
    const tag = `${name} ${w}x${h}`;
    check(`${tag}: Wort`, word.test(s.big || ""), s.big); check(`${tag}: Titel Abpfiff`, s.topTitle === "Abpfiff");
    check(`${tag}: Runden-Karten`, s.rr === (rounds || 3), String(s.rr)); check(`${tag}: Anton für das Wort`, /Anton/.test(s.font), s.font);
    check(`${tag}: kein Emoji`, !s.emoji); check(`${tag}: kein Seiten-Überlauf`, !s.overflowX); check(`${tag}: Screen`, s.screen === "duelresult"); check(`${tag}: Tafel im Bild, nicht seitlich verschoben`, s.boardIn === true && s.sl === 0, JSON.stringify([s.boardIn, s.sl]));
    if (!theirs) { check(`${tag}: Zettel + verdeckt`, s.zettel && s.locks === (rounds || 3) && s.score === "?:?" && s.chips === 0, JSON.stringify(s)); check(`${tag}: Link/Ergebnis senden`, /Link teilen|Ergebnis senden/.test(s.cta || ""), s.cta); check(`${tag}: Zur Übersicht`, s.second === "Zur Übersicht"); }
    else { check(`${tag}: Fair-Play-Chips`, s.chips === 2 && !s.zettel && s.locks === 0, JSON.stringify(s)); check(`${tag}: Revanche`, /Revanche/.test(s.second || ""), s.second); }
    if (name === "sieg") check(`${tag}: Krone(n) bei Sieg`, s.crowns >= 2, String(s.crowns));
    if (name === "remis") check(`${tag}: Remis 0 Kronen? (gleiche Werte)`, s.crowns === 0, String(s.crowns));
    check(`${tag}: XP-Zeile`, /\+\d+ XP/.test(s.xp || ""), s.xp);
    if (shots) await page.screenshot({ path: path.join(shots, `abpfiff_${name}_${w}.png`) });
    if (name === "sieg") { // Knoepfe funktionieren
      await page.click("#duelResBack"); await page.waitForTimeout(400);
      check(`${tag}: Zurück -> Duelle`, (await page.evaluate(() => navStack[navStack.length - 1])) === "duels");
    }
  }
  check(`Konsolenfehler ${w}x${h}`, !errs.length, errs.join("|"));
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} von ${total} FALSCH` : `OK - ${total} Abpfiff-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
