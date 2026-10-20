// Duell-Ablauf im Browser (Prompt 54): Best of 3 als Herausforderer und als Eingeladener durchspielen.
// Prüft: Rundenende (Review) bleibt stehen, verpasste Namen sichtbar (Kreide, kein Rot), Gegner-Ergebnis nur als Eingeladener,
// Krone beim richtigen Rundensieger (inkl. Gleichstand -> Zeit), "Weiter" startet den Walkout, letzte Runde -> Abpfiff,
// Reload im Review verliert nichts und zählt nichts doppelt, XP nur einmal.
// Aufruf: node tools/test-duell-flow.mjs [--shots <ordner>]
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

async function open(w = 393, h = 852) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("file://" + html); await page.waitForTimeout(6500);
  return { ctx, page, errs };
}
// eine Runde spielen: n richtige Namen eintippen, dann abgeben
async function playRound(page, n) {
  await page.evaluate(() => startDuelRound()); await page.waitForTimeout(700);
  const done = await page.evaluate((n) => {
    const r = duelRun, d = profile.duels[r.id], m = dailyMatchById(d.lineups[r.round]);
    const inputs = [...document.querySelectorAll("#duelPlayView .pos-input")].slice(0, n);
    inputs.forEach((i) => { i.value = m.players[i.dataset.abbr]; i.dispatchEvent(new Event("input", { bubbles: true })); });
    return document.querySelectorAll("#duelPlayView .pos-input.ok").length;
  }, n);
  await page.evaluate(() => document.getElementById("duelGive") && document.getElementById("duelGive").click());
  await page.waitForTimeout(500);
  return done;
}
const state = (page) => page.evaluate(() => { const r = duelRun, d = r ? profile.duels[r.id] : null; return { phase: r && r.phase, round: r && r.round, mine: d && d.mine.length, active: d && d.active, xp: profile.totalXP, next: !!document.getElementById("duelNext"), nextTxt: (document.getElementById("duelNext") || {}).textContent, miss: document.querySelectorAll("#duelPlayView .pos-input.miss").length, ok: document.querySelectorAll("#duelPlayView .pos-input.ok").length, stamp: !!document.querySelector(".du-stamp"), hidden: !!document.querySelector(".du-rp.du-hid"), rps: document.querySelectorAll(".du-rp").length, winL: !!document.querySelector(".du-rp:first-child.win"), winR: !!document.querySelector(".du-rp:last-child.win"), mid: (document.querySelector(".du-mid") || {}).innerText, redMiss: (() => { const e = document.querySelector("#duelPlayView .pos-input.miss"); return e ? getComputedStyle(e).backgroundColor + "|" + getComputedStyle(e).borderColor : ""; })(), between: !!document.querySelector(".between") }; });

for (const role of ["challenger", "invited"]) {
  const { ctx, page, errs } = await open();
  await page.evaluate((role) => {
    window.DUEL_TEST_SECONDS = 120; profile.duelName = "Anna"; profile.duelHandle = "anna"; saveProfile(profile);
    const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }), d = profile.duels[id];
    d.opponent = { name: "Lisa", deviceId: "lisa1", handle: "lisa", rank: "Profiliga", level: 14 };
    if (role === "invited") { d.role = "opponent"; d.status = "todo"; d.theirs = [{ correct: 7, seconds: 80, left: 0 }, { correct: 8, seconds: 111, left: 0 }, { correct: 5, seconds: 120, left: 0 }]; }
    window.__id = id; startDuelRun(id);
  }, role);
  await page.waitForTimeout(800);
  const xp0 = (await state(page)).xp;
  // Runde 1: 6 richtig (Lisa 7) -> Lisa gewinnt Runde 1
  let n = await playRound(page, 6); let s = await state(page);
  check(`${role}: Review nach Runde 1`, s.phase === "review" && s.next && s.stamp && s.mine === 1 && s.active === null, JSON.stringify(s));
  check(`${role}: verpasste Namen sichtbar`, s.miss === 11 - n && s.ok === n, `${s.miss}/${s.ok}`);
  check(`${role}: kein Rot bei verpassten Namen`, !/(193, 57, 43|224, 112, 95)/.test(s.redMiss), s.redMiss);
  check(`${role}: keine blaue Zwischenkarte`, !s.between);
  if (role === "invited") { check("invited: Gegner-Ergebnis sichtbar (2 Karten, nicht verdeckt)", s.rps === 2 && !s.hidden, `${s.rps}/${s.hidden}`); check("invited: Krone beim Gegner (7 > 6)", s.winR && !s.winL); check("invited: Stand 0:1", /0:1/.test(s.mid || ""), s.mid); }
  else check("challenger: Gegner verdeckt", s.hidden && !s.winL && !s.winR);
  if (shots) await page.screenshot({ path: path.join(shots, `review_${role}_r1.png`) });
  await page.waitForTimeout(3000); const s2 = await state(page);
  check(`${role}: Review bleibt nach 3 s stehen`, s2.phase === "review" && s2.next);
  // Reload im Review: nichts verloren, nichts doppelt
  const before = await page.evaluate(() => JSON.stringify(profile.duels[window.__id].mine));
  await page.reload(); await page.waitForTimeout(6500);
  const after = await page.evaluate(() => ({ mine: JSON.stringify(profile.duels[Object.keys(profile.duels)[0]].mine), active: profile.duels[Object.keys(profile.duels)[0]].active, played: profile.duels[Object.keys(profile.duels)[0]].playedRounds }));
  check(`${role}: Reload im Review behält die gespielte Runde`, after.mine === before && after.active === null && after.played === 1, JSON.stringify(after));
  await page.evaluate(() => { window.DUEL_TEST_SECONDS = 120; startDuelRun(Object.keys(profile.duels)[0]); }); await page.waitForTimeout(800);
  s = await state(page);
  check(`${role}: nach Reload geht es mit Runde 2 (Walkout) weiter`, s.phase === "walkout" && s.round === 1 && s.mine === 1, JSON.stringify(s));
  // Runde 2: 9 richtig (Lisa 8) -> ich gewinne
  await playRound(page, 9); s = await state(page);
  if (role === "invited") { check("invited: Krone links (9 > 8)", s.winL && !s.winR); check("invited: Stand 1:1", /1:1/.test(s.mid || ""), s.mid); }
  check(`${role}: "Weiter zu Runde 3"`, /Runde 3/.test(s.nextTxt || ""), s.nextTxt);
  await page.evaluate(() => document.getElementById("duelNext").click()); await page.waitForTimeout(500); s = await state(page);
  check(`${role}: Weiter startet Walkout Runde 3`, s.phase === "walkout" && s.round === 2, JSON.stringify(s));
  // Runde 3: 5 richtig, Gleichstand bei Lisa (5) -> Zeit entscheidet: Lisa 120 s, ich schneller
  await playRound(page, 5); s = await state(page);
  if (role === "invited") check("invited: Gleichstand -> schnellere Zeit gewinnt (Krone links)", s.winL && !s.winR, JSON.stringify([s.winL, s.winR]));
  check(`${role}: letzte Runde -> "Zum Abpfiff"`, /Abpfiff/.test(s.nextTxt || ""), s.nextTxt);
  if (shots) await page.screenshot({ path: path.join(shots, `review_${role}_letzte.png`) });
  const xpBefore = (await state(page)).xp;
  // Reload in der letzten Review, dann weiter: Abpfiff genau einmal, XP einmal
  await page.reload(); await page.waitForTimeout(6500);
  await page.evaluate(() => startDuelRun(Object.keys(profile.duels)[0])); await page.waitForTimeout(900);
  const fin = await page.evaluate(() => { const d = profile.duels[Object.keys(profile.duels)[0]]; return { screen: navStack[navStack.length - 1], rounds: d.xp && d.xp.rounds, win: d.xp && d.xp.win, status: d.status, played: d.playedRounds, mine: d.mine.length }; });
  check(`${role}: nach Reload in der letzten Review kommt der Abpfiff`, fin.screen === "duelresult" && fin.mine === 3, JSON.stringify(fin));
  check(`${role}: XP für 3 Runden genau einmal`, fin.rounds === 45 && fin.played === 3, JSON.stringify(fin));
  const again = await page.evaluate(() => { startDuelRun(Object.keys(profile.duels)[0]); const d = profile.duels[Object.keys(profile.duels)[0]]; return d.xp.rounds; });
  check(`${role}: erneutes Öffnen vergibt nichts doppelt`, again === 45, String(again));
  check(`${role}: keine Konsolenfehler`, errs.length === 0, errs.slice(0, 2).join(" | "));
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} von ${total} Prüfungen fehlgeschlagen` : `OK - ${total} Duell-Ablauf-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
