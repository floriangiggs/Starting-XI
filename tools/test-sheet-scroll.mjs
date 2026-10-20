// Wisch-zum-Schliessen respektiert inneres Scrollen (Prompt 57, Teil A): echte Touch-Gesten per CDP (Input.dispatchTouchEvent).
// Pruefung je Blatt: ganz unten nach oben wischen -> Blatt bleibt, scrollTop sinkt; Geste, die oben ankommt und weiterzieht -> bleibt;
// danach NEUE Geste nach unten -> schliesst; Wisch am Kopf/Griff schliesst immer; Blatt ohne Scrollbedarf schliesst wie bisher.
// Aufruf: node tools/test-sheet-scroll.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const html = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "startelf_check.html");
const browser = await chromium.launch();
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra !== "" ? ": " + extra : ""}`); } };

for (const [w, h] of [[393, 852], [375, 667]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("file://" + html); await page.waitForTimeout(6500);
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
  const wait = (ms) => page.waitForTimeout(ms);
  // Finger von (x, ya) nach (x, yb) ziehen (yb > ya = nach unten = Inhalt scrollt nach oben)
  const swipe = async (x, ya, yb, steps = 14) => {
    await touch("touchStart", x, ya);
    for (let i = 1; i <= steps; i++) { await touch("touchMove", x, ya + (yb - ya) * i / steps); await wait(16); }
    await touch("touchEnd", x, yb); await wait(450);
  };
  const tag = `${w}x${h}`;
  // generische Pruefung: sel = Blatt-Element, scr = Scroll-Element (oder dasselbe), open() = Zustand "Blatt offen?"
  const suite = async (label, openFn, scrSel, isOpen, sheetSel) => {
    await page.evaluate(openFn); await wait(900);
    const info = await page.evaluate(({ scrSel, sheetSel }) => { const s = document.querySelector(scrSel), sh = document.querySelector(sheetSel), r = sh.getBoundingClientRect(); return { sh: s.scrollHeight, ch: s.clientHeight, top: r.top, bottom: r.bottom, left: r.left, width: r.width }; }, { scrSel, sheetSel });
    const scrollable = info.sh > info.ch + 8, mid = (info.top + Math.min(info.bottom, h)) / 2 + 40, x = info.left + info.width / 2;
    const st = () => page.evaluate((scrSel) => { const e = document.querySelector(scrSel); return e ? Math.round(e.scrollTop) : -1; }, scrSel);
    const open = () => page.evaluate(isOpen);
    if (scrollable) {
      await page.evaluate((scrSel) => { const s = document.querySelector(scrSel); s.scrollTop = s.scrollHeight; }, scrSel); await wait(200);
      const s0 = await st();
      await swipe(x, mid - 60, mid + 120);
      check(`${tag} ${label}: unten nach oben wischen -> Blatt bleibt offen`, await open());
      const s1 = await st(); check(`${tag} ${label}: ... und scrollt nach oben (${s0} -> ${s1})`, s1 < s0 - 20, `${s0} -> ${s1}`);
      // Geste, die oben ankommt und weiterzieht: darf NICHT schliessen
      await page.evaluate((scrSel) => { const e = document.querySelector(scrSel); if (e) e.scrollTop = 60; }, scrSel); await wait(150);
      await swipe(x, mid - 100, mid + 220, 20);
      check(`${tag} ${label}: Geste kommt oben an und zieht weiter -> Blatt bleibt (kein Wechsel ins Schliessen)`, await open());
      check(`${tag} ${label}: oben angekommen`, (await st()) <= 1, String(await st()));
      // Wisch am Griff/Kopf: schliesst immer, auch wenn unten gescrollt
      await page.evaluate((scrSel) => { const s = document.querySelector(scrSel); if (s) s.scrollTop = s.scrollHeight; }, scrSel); await wait(150);
      const hdrY = info.top + 24;
      await swipe(x, hdrY, hdrY + 240);
      check(`${tag} ${label}: Wisch am Kopf schliesst immer`, !(await open()));
      // neue Geste oben
      await page.evaluate(openFn); await wait(900);
      await page.evaluate((scrSel) => { const e = document.querySelector(scrSel); if (e) e.scrollTop = 0; }, scrSel); await wait(150);
      await swipe(x, mid - 60, mid + 200);
      check(`${tag} ${label}: ganz oben, neue Geste nach unten -> schliesst`, !(await open()));
    } else {
      await swipe(x, mid - 60, mid + 200);
      check(`${tag} ${label}: kein Scrollbedarf -> Wisch nach unten schliesst wie bisher`, !(await open()));
    }
    await page.evaluate(() => document.querySelectorAll(".modal-backdrop, .dz-shade, .dz-sheet").forEach((e) => e.remove())); await wait(200);
    return scrollable;
  };
  // Scout-Profil: alle drei Reiter
  for (const tab of ["ov", "tr", "kn"]) {
    const sc = await suite(`Scout-Profil ${tab}`, `openProfileSheet("${tab}")`, "#profileSheetPanel", () => !!document.getElementById("profileSheetBg"), ".hm-psheet");
    check(`${tag} Scout-Profil ${tab}: Reiter ist scrollbar (Test aussagekraeftig)`, tab !== "ov" || sc, String(sc));
  }
  // So geht's (Reiter-Blatt mit innerem .panel)
  await suite("So geht's", "openGuideModal()", ".gs .panel", () => !!document.querySelector(".gs"), ".gs");
  // Ersatzbank
  await page.evaluate(() => { const m = LINEUP_CHALLENGES.find((x) => benchOf(x)); currentLevelContext = { tier: m.difficulty, index: 0, m }; navStack.length = 0; navigate("start"); startMatch(m); });
  await wait(600);
  await suite("Ersatzbank", `(() => { const m = LINEUP_CHALLENGES.find((x) => benchOf(x)); renderPitch(); openBenchSheet(m); })()`, ".bn-scroll", () => !!document.getElementById("benchSheet"), "#benchSheet .sp-sheet");
  // Duell-Blatt (Neues Duell, eigenes Scrollen des Blatts)
  await page.evaluate(() => { profile.duelName = "Anna"; profile.duelHandle = "anna"; saveProfile(profile); navStack.length = 0; navigate("start"); navigate("duels"); }); await wait(700);
  await suite("Duell-Blatt", "dzOpenNew()", ".dz-sheet", () => !!document.querySelector(".dz-sheet"), ".dz-sheet");
  check(`${tag}: keine Konsolenfehler`, !errs.length, errs.join("|"));
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} von ${total} FALSCH` : `OK - ${total} Wisch-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
