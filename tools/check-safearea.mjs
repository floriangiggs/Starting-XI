// Prüft die Safe-Area (Prompt 43): mit simulierter Sperrzone (iPhone 16 Pro: oben 59 px, unten 34 px) darf kein antippbares Element
// in den oberen 59 px oder unteren 34 px liegen - für alle Bildschirme und geöffnete Blätter.
// Aufruf: node tools/check-safearea.mjs   (Playwright aus node_modules; env(safe-area-inset-*) wird im HTML durch feste Werte ersetzt)
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const file = process.argv[2] ? path.resolve(process.argv[2]) : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "startelf_check.html");
const TOP = 59, BOTTOM = 34, W = 393, H = 852;
let html = fs.readFileSync(file, "utf8").replace(/env\(safe-area-inset-top(?:,\s*0px)?\)/g, TOP + "px").replace(/env\(safe-area-inset-bottom(?:,\s*0px)?\)/g, BOTTOM + "px");
const tmp = path.join(path.dirname(file), ".safearea-test.html");
fs.writeFileSync(tmp, html);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.emulateMedia({ reducedMotion: "reduce" }); // keine Einblend-Animationen beim Messen
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.goto("file://" + tmp); await page.waitForTimeout(6600);

const scan = (label) => page.evaluate(({ TOP, BOTTOM, label }) => {
  const vh = innerHeight, bad = [];
  const sel = "button, a[href], input, select, textarea, [role=button], [data-act], .level-node, .mode-tile";
  document.querySelectorAll(sel).forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.pointerEvents === "none" || +cs.opacity === 0) return;
    let p = el, hidden = false; while (p && p !== document.body) { if (p.hidden || getComputedStyle(p).display === "none") { hidden = true; break; } p = p.parentElement; }
    if (hidden) return;
    // Inhalt in scrollenden Bereichen: in der Ruhelage (ganz oben bzw. ganz unten) darf er nicht in der Sperrzone liegen, dazwischen laesst er sich wegscrollen
    let sc = el.parentElement, scroller = null; while (sc && sc !== document.body) { const o = getComputedStyle(sc); if (/(auto|scroll)/.test(o.overflowY) && sc.scrollHeight > sc.clientHeight + 2) { scroller = sc; break; } if (o.position === "fixed" || o.position === "sticky") break; sc = sc.parentElement; }
    const atTop = !scroller || scroller.scrollTop <= 1, atBottom = !scroller || scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > vh) return;
    // von einer Ueberlagerung verdeckt = nicht antippbar -> zaehlt nicht
    const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 1), vh - 1);
    const hit = document.elementFromPoint(cx, cy);
    if (hit && !el.contains(hit) && !hit.contains(el)) return;
    if ((atTop && r.top < TOP - 0.5) || (atBottom && r.bottom > vh - BOTTOM + 0.5)) bad.push(`${(el.id || el.className || el.tagName).toString().slice(0, 40)} "${(el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 20)}" y=${Math.round(r.top)}-${Math.round(r.bottom)}`);
  });
  return bad.map((b) => `${label}: ${b}`);
}, { TOP, BOTTOM, label });

let issues = 0;
const report = async (label) => { const b = await scan(label); b.forEach((x) => console.log("  " + x)); issues += b.length; };
const screens = await page.evaluate(() => [...document.querySelectorAll(".screen")].map((s) => s.id.replace("screen-", "")));
await page.evaluate(() => { profile.hintTokens = 5; profile.level = 12; saveProfile(profile); });
for (const id of screens) {
  const ok = await page.evaluate(async (id) => {
    try {
      if (id === "game") { const m = LINEUP_CHALLENGES[0]; currentLevelContext = { tier: m.difficulty, index: 0, m }; startMatch(m); }
      else if (id === "levelpath") { campaignTier = 1; navigate("levelpath"); }
      else if (id === "duelplay" || id === "duelresult" || id === "duelinvite" || id === "duelnew") return false;
      else navigate(id);
      await new Promise((r) => setTimeout(r, 900));
      return navStack[navStack.length - 1] === id || id === "game";
    } catch (e) { return false; }
  }, id);
  if (!ok) { console.log(`(übersprungen: ${id})`); continue; }
  await report("Bildschirm " + id);
  if (id === "game") { await page.evaluate(() => renderPitch()); await page.waitForTimeout(900); await report("Spiel-Ansicht"); }
}
// Level-Vorschau, Duell-Walkout, Duell-Runde, Einladung
await page.evaluate(() => { const m = getMatchesByTier(1)[0]; currentLevelContext = { tier: 1, index: 0, m }; startMatch(m); }); await page.waitForTimeout(700); await report("Level-Vorschau");
await page.evaluate(() => { profile.duelName = "Anna"; profile.duelHandle = "anna"; window.DUEL_TEST_SECONDS = 120; const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }); profile.duels[id].opponent = { name: "Tim", deviceId: "t1" }; window.__duelId = id; startDuelRun(id); });
await page.waitForTimeout(1500); await report("Duell-Walkout");
await page.evaluate(() => startDuelRound()); await page.waitForTimeout(900); await report("Duell-Runde");
await page.evaluate(() => { const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }); const d = profile.duels[id]; d.role = "opponent"; d.opponent = { name: "Tim", deviceId: "t1", handle: "tim" }; d.status = "todo"; activeInviteId = id; navigate("duelinvite"); }); await page.waitForTimeout(900); await report("Duell-Einladung");
// Blaetter
const sheets = {
  "Neues Duell": () => { navigate("duels"); setTimeout(() => dzOpenNew(), 700); },
  "So geht's": () => openGuideModal(), "Regeln": () => openRulesModal(),
  "Rückfrage": () => askSheet(`<div class="t">Test?</div><p>Text</p>`, [{ label: "Ja", cls: "main" }, { label: "Nein", cls: "quiet" }]),
  "Scout-Profil": () => openProfileSheet(),
};
for (const [name, fn] of Object.entries(sheets)) {
  await page.evaluate(() => { document.querySelectorAll(".modal-backdrop, .dz-shade, .dz-sheet").forEach((e) => e.remove()); });
  await page.evaluate(fn); await page.waitForTimeout(1300);
  await report("Blatt " + name);
}
await browser.close(); fs.unlinkSync(tmp);
if (errs.length) { console.log("Konsolenfehler:", errs.slice(0, 3)); issues += errs.length; }
console.log(issues ? `\n${issues} PROBLEM(E)` : "OK - nichts Antippbares in der Sperrzone (oben 59 px / unten 34 px)");
process.exit(issues ? 1 : 0);
