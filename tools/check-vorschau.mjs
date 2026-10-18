// Prüft die Vorschau "Taktiktafel" (Prompt 41, ab Prompt 53 in allen Modi: Kampagne, Tages-Challenge, Frei spielen, Tages-Archiv) für ALLE Aufstellungen bei mehreren Bildschirmgrößen:
// kein Überlappen (Teams / Anzeigetafel / Aufstellen / Zettel / Magnete / Leiste / Knopf), nichts außerhalb des Bildschirms,
// Texte vollständig (Teams, Datum, Kopfzeile, Mannschaft, Zettel), kein Scrollen.
// Aufruf: node tools/check-vorschau.mjs [--shots <ordner>]   (Playwright aus node_modules)
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const html = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "startelf_check.html");
const shots = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
const SIZES = [[360, 667], [360, 780], [375, 667], [375, 812], [402, 874], [393, 852], [430, 932]];
const MODES = [["campaign", "LINEUP_CHALLENGES"], ["free", "LINEUP_CHALLENGES"], ["daily", "DAILY_CHALLENGES"], ["archive", "DAILY_CHALLENGES"]];
const browser = await chromium.launch();
let issues = 0, checked = 0, minPitch = Infinity, minNote = 99;
const ov = (a, b, pad = 0) => a.left < b.right - pad && b.left < a.right - pad && a.top < b.bottom - pad && b.top < a.bottom - pad;

for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("file://" + html);
  await page.waitForTimeout(6500); // Ladebildschirm
  for (const [mode, listName] of MODES) {
  const total = await page.evaluate((n) => window.eval(n).length, listName);
  for (let i = 0; i < total; i++) {
    const r = await page.evaluate(([i, mode, listName]) => {
      const m = window.eval(listName)[i], tier = m.difficulty, matches = getMatchesByTier(tier);
      currentLevelContext = mode === "campaign" ? { tier, index: matches.findIndex((x) => x.id === m.id), m } : null;
      currentDailyChallenge = mode === "daily" ? { dateKey: localDateKey(), id: m.id } : null; freeplaySource = mode === "archive" ? "archive" : "filter";
      profile.drafts = {}; profile.streak = { current: i % 3 ? 7 : 0, best: 9, lastDayKey: localDateKey() }; profile.freeplayForm = i % 4 ? [9, 11, 6, 10, 11] : [];
      document.querySelectorAll(".screen").forEach((s) => { s.hidden = true; });
      document.getElementById("screen-game").hidden = false; navStack = ["start", mode === "free" || mode === "archive" ? "freeplay" : "start", "game"];
      startMatch(m);
      const root = document.getElementById("lvRoot"); lvFit(root, true);
      const R = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; };
      const q = (s) => root.querySelector(s);
      const mags = [...root.querySelectorAll(".lv-mag")].map((e) => [e.textContent, R(e)]);
      const sg = document.getElementById("screen-game");
      return {
        id: m.id, tier,
        top: R(q(".lv-top")), kick: R(q("#lvKick")), comp: R(q("#lvComp")), teams: R(q("#lvTeams")), score: R(q(".lv-score")), wanted: R(q("#lvWanted")), note: R(q("#lvNote")),
        pitch: R(q("#lvPitch")), tray: R(q(".lv-tray")), bottom: R(q(".lv-bottom")), frame: R(q("#lvFrame")), mags,
        noteFs: parseFloat(getComputedStyle(q("#lvNote")).fontSize), noteTextOk: q("#lvNote").getBoundingClientRect().height >= q("#lvNote").scrollHeight - 1,
        teamsOk: q("#lvTeams").scrollWidth <= q("#lvTeams").clientWidth + 1, wantedOk: q("#lvWanted b").scrollWidth <= q("#lvWanted").clientWidth + 1,
        kickOk: q("#lvKick .t").scrollWidth <= q("#lvKick .t").clientWidth + 1,
        dateOk: q("#lvComp .d").getBoundingClientRect().right <= q("#lvComp").getBoundingClientRect().right + 1,
        nameCut: q("#lvComp .n").scrollWidth > q("#lvComp .n").clientWidth + 1,
        scroll: sg.scrollHeight > sg.clientHeight + 1 || document.documentElement.scrollHeight > innerHeight + 1,
        pitchH: q("#lvPitch").clientHeight,
        trayOk: [...root.querySelectorAll(".lv-tray > *")].every((e) => e.scrollWidth <= e.clientWidth + 1),
        kickRight: [...q("#lvKick").children].every((e) => R(e).right <= R(q("#lvKick")).right + 1),
        spoiler: (() => { const txt = root.innerText, pub = (m.teams + " " + m.side + " " + m.comp).toLowerCase(); const bad = []; if (m.context && m.context !== m.teaser && txt.includes(m.context)) bad.push("context"); Object.values(m.players).forEach((n) => { if (n.length > 3 && !pub.includes(n.toLowerCase()) && new RegExp("(^|[^\\p{L}])" + n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^\\p{L}]|$)", "u").test(txt.toLowerCase())) bad.push(n); }); return bad; })()
      };
    }, [i, mode, listName]);
    checked++;
    const bad = [];
    if (!r.trayOk) bad.push("Holzleiste läuft über"); if (!r.kickRight) bad.push("Kopfzeile: Element ragt heraus"); if (r.spoiler.length) bad.push("Spoiler: " + r.spoiler.join(","));
    const P = (n, a, b, pad) => { if (ov(a, b, pad)) bad.push(`${n} überlappen`); };
    P("Teams/Anzeigetafel", r.teams, r.score); P("Aufstellen/Zettel", r.wanted, r.note, 3);
    P("Anzeigetafel/Zettel", r.score, r.note); P("Kopf/Teams", r.comp, r.teams);
    for (const [ab, mg] of r.mags) { if (ov(mg, r.note)) bad.push(`Magnet ${ab} unter Zettel`); if (mg.left < r.frame.left || mg.right > r.frame.right || mg.bottom > r.frame.bottom) bad.push(`Magnet ${ab} außerhalb Tafel`); }
    for (let a = 0; a < r.mags.length; a++) for (let b = a + 1; b < r.mags.length; b++) if (ov(r.mags[a][1], r.mags[b][1], 1)) bad.push(`Magnete ${r.mags[a][0]}/${r.mags[b][0]} überlappen`);
    if (r.bottom.bottom > h + 0.5 || r.top.top < -0.5) bad.push("Knopf/Kopfzeile außerhalb des Bildschirms");
    if (ov(r.tray, r.bottom)) bad.push("Leiste/Knopf überlappen");
    if (r.note.bottom > r.frame.bottom + 4) bad.push("Zettel ragt unten aus der Tafel");
    if (!r.teamsOk) bad.push("Teamname abgeschnitten"); if (!r.wantedOk) bad.push("Mannschaft abgeschnitten"); if (!r.kickOk) bad.push("Kopfzeile abgeschnitten");
    if (!r.dateOk) bad.push("Datum abgeschnitten"); if (!r.noteTextOk) bad.push("Zettel-Text abgeschnitten");
    if (r.scroll) bad.push("Bildschirm scrollt"); if (r.pitchH < 110) bad.push(`Spielfeld nur ${r.pitchH}px`);
    minPitch = Math.min(minPitch, r.pitchH); minNote = Math.min(minNote, r.noteFs);
    if (bad.length) { issues += bad.length; console.log(`${w}x${h} [${mode}] ${r.id}: ${[...new Set(bad)].join("; ")}`); }
  }
  }
  if (errs.length) { issues += errs.length; console.log(`${w}x${h} Konsolenfehler: ${errs.slice(0, 3).join(" | ")}`); }
  if (shots) {
    fs.mkdirSync(shots, { recursive: true });
    for (const idx of [0, 14, 30, 44, 56]) {
      await page.evaluate((i) => { const m = LINEUP_CHALLENGES[i]; currentLevelContext = { tier: m.difficulty, index: getMatchesByTier(m.difficulty).findIndex((x) => x.id === m.id), m }; startMatch(m); lvFit(document.getElementById("lvRoot"), true); }, idx);
      await page.screenshot({ path: path.join(shots, `vorschau_${w}x${h}_${idx}.png`) });
    }
  }
  await ctx.close();
}
await browser.close();
console.log(`${checked} Prüfungen (${checked / SIZES.length} Aufstellungen x Modi, ${SIZES.length} Größen), kleinstes Spielfeld ${minPitch}px, kleinste Zettel-Schrift ${minNote.toFixed(1)}px`);
console.log(issues ? `\n${issues} PROBLEM(E)` : "OK - keine Überlappungen/Abschneidungen");
process.exit(issues ? 1 : 0);
