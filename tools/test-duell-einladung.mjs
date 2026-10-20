// Einladung (Prompt 54 Paket C): Taktiktafel-Optik, Fair-Play-Schalter, Anpfiff-Knopf, Browser-/App-Weg, Ablehnen, Layout 393x852 + 375x667.
// Aufruf: node tools/test-duell-einladung.mjs [--shots <ordner>]
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
for (const [w, h] of [[393, 852], [375, 667]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("file://" + html); await page.waitForTimeout(6500);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const open = (played) => page.evaluate((played) => {
    profile.duelName = "Anna"; profile.duelHandle = "anna"; saveProfile(profile);
    const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }), d = profile.duels[id];
    d.role = "opponent"; d.opponent = { name: "Maximilian Kauf", deviceId: "m1", handle: "max.kaufmann", rank: "Profiliga", level: 14 };
    if (played) d.theirs = [{ correct: 7, seconds: 80, left: 0 }, { correct: 8, seconds: 90, left: 0 }, { correct: 6, seconds: 100, left: 0 }];
    profile.duelStats.perOpponent.m1 = { name: "Maximilian Kauf", w: 2, l: 1, d: 0 };
    activeInviteId = id; inviteFair = false; invitePath = "browser"; navStack.length = 0; navigate("start"); return id;
  }, played);
  const probe = () => page.evaluate(() => {
    const r = document.getElementById("duelInviteView"), cta = r.querySelector("#duelAccept"), fair = r.querySelector("#duelInvFair"), body = r.querySelector(".du-body");
    return { title: (r.querySelector(".du-h1") || {}).textContent, mags: r.querySelectorAll(".du-vs .du-mag").length, vs: (r.querySelector(".du-vs .m") || {}).textContent, facts: r.querySelectorAll(".du-facts div").length,
      zettel: (r.querySelector(".du-zettel") || {}).textContent, cta: cta && cta.textContent.trim(), ctaOff: cta && cta.getAttribute("aria-disabled"), fairOn: fair && fair.querySelector(".du-sw").classList.contains("on"),
      two: r.querySelectorAll(".du-two button").length, onBtn: (r.querySelector(".du-two button.on") || {}).id, decline: !!r.querySelector("#duelDecline"), step1: /SCHRITT|Schritt/.test(r.innerText),
      emoji: /[\u{1F300}-\u{1FAFF}☀-➿]/u.test(r.innerText), spacing: getComputedStyle(r.querySelector(".du-ik")).letterSpacing, overX: document.documentElement.scrollWidth > innerWidth + 1,
      nameFits: [...r.querySelectorAll(".du-vs .s b")].every(b => b.scrollWidth <= b.clientWidth + 1), board: (() => { const b = r.querySelector(".du-board").getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth; })(),
      scrolls: body.scrollHeight > body.clientHeight + 1, screen: navStack[navStack.length - 1] };
  });
  await open(true); await page.waitForTimeout(500); await page.evaluate(() => navigate("duelinvite")); await page.waitForTimeout(700);
  let s = await probe(); const tag = `${w}x${h}`;
  check(`${tag}: Titel`, s.title === "Herausforderung", s.title); check(`${tag}: zwei Magnete + VS`, s.mags === 2 && s.vs === "VS");
  check(`${tag}: drei Fakten`, s.facts === 3); check(`${tag}: Zettel gespielt`, /hat schon gespielt/.test(s.zettel || ""), s.zettel);
  check(`${tag}: Knopf gesperrt mit Text`, s.ctaOff === "true" && /Erst „Ich spiele fair“ antippen/.test(s.cta || ""), s.cta);
  check(`${tag}: kein "Schritt 1", kein Emoji`, !s.step1 && !s.emoji); check(`${tag}: Browser-Weg vorgewählt`, s.two === 2 && s.onBtn === "duelPathBrowser");
  check(`${tag}: Ablehnen da`, s.decline); check(`${tag}: kein Überlauf, Tafel im Bild, Namen passen`, !s.overX && s.board && s.nameFits, JSON.stringify([s.overX, s.board, s.nameFits]));
  if (shots) await page.screenshot({ path: path.join(shots, `einladung_aus_${w}.png`) });
  // gesperrter Knopf: Tippen -> Toast + Nudge, startet nichts
  await page.click("#duelAccept", { force: true }); await page.waitForTimeout(200);
  check(`${tag}: gesperrter Knopf -> Toast + Hervorhebung, kein Spielstart`, await page.evaluate(() => /Erst/.test(document.querySelector(".toast-stack").innerText) && document.getElementById("duelInvFair").classList.contains("nudge") && navStack[navStack.length - 1] === "duelinvite"));
  await page.click("#duelInvFair"); await page.waitForTimeout(200); s = await probe();
  check(`${tag}: Fair an -> Anpfiff`, s.fairOn && s.ctaOff === "false" && s.cta === "Anpfiff", JSON.stringify([s.fairOn, s.ctaOff, s.cta]));
  if (shots) await page.screenshot({ path: path.join(shots, `einladung_an_${w}.png`) });
  // App-Weg
  await page.evaluate(() => { copyText = () => {}; }); await page.click("#duelCopyCode"); await page.waitForTimeout(200); s = await probe();
  check(`${tag}: App-Weg: Hinweis, kein Fair/Anpfiff`, /Code kopiert/.test(s.zettel || "") && s.cta === null && s.fairOn === null && s.onBtn === "duelCopyCode", JSON.stringify(s.zettel));
  if (shots) await page.screenshot({ path: path.join(shots, `einladung_app_${w}.png`) });
  await page.click("#duelPathBrowser"); await page.waitForTimeout(300); s = await probe(); check(`${tag}: zurück zum Browser-Weg`, s.cta !== null && s.onBtn === "duelPathBrowser");
  // Anpfiff startet den Walkout
  await page.click("#duelInvFair"); await page.waitForTimeout(100); if (!(await probe()).fairOn) await page.click("#duelInvFair");
  await page.click("#duelAccept"); await page.waitForTimeout(900);
  check(`${tag}: Anpfiff -> Walkout`, await page.evaluate(() => navStack[navStack.length - 1] === "duelplay" && duelRun && duelRun.phase === "walkout"));
  // ungespielt + Ablehnen
  await page.evaluate(() => { abortDuelRun && 0; navStack.length = 0; navigate("start"); }); await page.waitForTimeout(300);
  const id2 = await open(false); await page.evaluate(() => navigate("duelinvite")); await page.waitForTimeout(500); s = await probe();
  check(`${tag}: Zettel ungespielt`, /Ihr spielt dieselben/.test(s.zettel || ""), s.zettel);
  await page.click("#duelDecline"); await page.waitForTimeout(400);
  check(`${tag}: Ablehnen entfernt das Duell`, await page.evaluate((id) => !profile.duels[id], id2));
  check(`Konsolenfehler ${tag}`, !errs.length, errs.join("|"));
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} von ${total} FALSCH` : `OK - ${total} Einladungs-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
