// Prüft die Safe-Area (Prompt 43): mit simulierter Sperrzone (iPhone 16 Pro: oben 59 px, unten 34 px) darf kein antippbares Element
// in den oberen 59 px oder unteren 34 px liegen - für alle Bildschirme und geöffnete Blätter.
// Aufruf: node tools/check-safearea.mjs   (Playwright aus node_modules; env(safe-area-inset-*) wird im HTML durch feste Werte ersetzt)
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const file = process.argv[2] ? path.resolve(process.argv[2]) : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "startelf_check.html");
// SA_DEVICE="Breite,Hoehe,oben,unten" ueberschreibt das Standardgeraet (iPhone 16 Pro: 393x852, 59/34); SA_NAME nur fuer die Ausgabe
const [W, H, TOP, BOTTOM] = (process.env.SA_DEVICE || "393,852,59,34").split(",").map(Number);
let html = fs.readFileSync(file, "utf8").replace(/env\(safe-area-inset-top(?:,\s*0px)?\)/g, TOP + "px").replace(/env\(safe-area-inset-bottom(?:,\s*0px)?\)/g, BOTTOM + "px");
const tmp = path.join(path.dirname(file), ".safearea-test.html");
fs.writeFileSync(tmp, html);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, serviceWorkers: "block" });
const blueNotes = new Set();
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
const frame = (label) => page.evaluate((label) => {
  // Rahmen-Check (Prompt 50): .stage fuellt den Bildschirm bis ganz unten, nichts laeuft seitlich ueber, und der unterste Pixel ist nicht Ink-Blau
  const out = [], st = document.querySelector(".stage").getBoundingClientRect(), vh = innerHeight;
  if (Math.abs(st.top) > 0.5 || Math.abs(st.bottom - vh) > 0.5) out.push(`${label}: .stage deckt nicht ganz ab (${Math.round(st.top)}..${Math.round(st.bottom)} von ${vh})`);
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`${label}: horizontaler Ueberlauf`);
  let el = document.elementFromPoint(Math.round(innerWidth / 2), vh - 1), col = "";
  while (el) { col = getComputedStyle(el).backgroundColor; if (col && col !== "rgba(0, 0, 0, 0)" && col !== "transparent") break; el = el.parentElement; }
  const m = col.match(/\d+/g) || [], blue = (+m[2] || 0) > (+m[1] || 0) + 12 && (+m[2] || 0) > (+m[0] || 0) + 12 && (+m[2] || 0) > 30;
  return { out, blue: blue ? col : null };
}, label);
const report = async (label) => {
  const b = await scan(label); b.forEach((x) => console.log("  " + x)); issues += b.length;
  const f = await frame(label); f.out.forEach((x) => console.log("  " + x)); issues += f.out.length;
  if (f.blue) blueNotes.add(label.replace(/^Bildschirm /, ""));
};
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
// Startseite mit fortgeschrittenem Stand + Scout-Profil-Blatt (alle Reiter)
await page.evaluate(() => { navStack.length = 0; navigate("start"); profile.streak = { current: 5, best: 9, lastDayKey: localDateKey() }; saveProfile(profile); renderProfileBar(); renderDailyCard(); renderModeTiles(); }); await page.waitForTimeout(900); await report("Startseite (Stand)");
for (const t of ["ov", "tr", "kn"]) {
  await page.evaluate((t) => { document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove()); openProfileSheet(t); }, t); await page.waitForTimeout(900); await report("Scout-Profil " + t);
}
await page.evaluate(() => document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove()));
// Level-Vorschau, Duell-Walkout, Duell-Runde, Einladung
await page.evaluate(() => { const m = getMatchesByTier(1)[0]; currentLevelContext = { tier: 1, index: 0, m }; startMatch(m); }); await page.waitForTimeout(700); await report("Level-Vorschau");
await page.evaluate(() => { profile.duelName = "Anna"; profile.duelHandle = "anna"; window.DUEL_TEST_SECONDS = 120; const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }); profile.duels[id].opponent = { name: "Tim", deviceId: "t1" }; window.__duelId = id; startDuelRun(id); });
await page.waitForTimeout(1500); await report("Duell-Walkout");
await page.evaluate(() => startDuelRound()); await page.waitForTimeout(900); await report("Duell-Runde");
await page.evaluate(() => { const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }); const d = profile.duels[id]; d.role = "opponent"; d.opponent = { name: "Tim", deviceId: "t1", handle: "tim" }; d.status = "todo"; activeInviteId = id; navigate("duelinvite"); }); await page.waitForTimeout(900); await report("Duell-Einladung");
await page.evaluate(() => document.getElementById("duelGive") && document.getElementById("duelGive").click()); await page.waitForTimeout(900); await report("Duell-Rundenende (Review)");
await page.evaluate(() => { const R = (c, s) => ({ correct: c, seconds: s, left: 0 }); for (const done of [false, true]) { const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }), d = profile.duels[id]; d.opponent = { name: "Tim", deviceId: "t2", handle: "tim" }; d.mine = [R(9, 90), R(8, 100), R(7, 110)]; d.playedRounds = 3; if (done) { d.theirs = [R(7, 90), R(6, 100), R(7, 120)]; evaluateDuel(id); } else d.status = "waiting"; window["__r" + done] = id; } activeResultId = window.__rfalse; duelRun = null; navStack.length = 0; navigate("start"); navigate("duelresult"); }); await page.waitForTimeout(900); await report("Duell-Abpfiff (wartet)");
await page.evaluate(() => { activeResultId = window.__rtrue; renderDuelResult(); }); await page.waitForTimeout(900); await report("Duell-Abpfiff (Ergebnis)");
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
if (blueNotes.size) console.log("Hinweis (kein Fehler): unterster Rand noch blau bei: " + [...blueNotes].join(", "));
console.log(issues ? `\n${issues} PROBLEM(E)` : `OK - nichts Antippbares in der Sperrzone (oben ${TOP} px / unten ${BOTTOM} px) bei ${W}x${H}`);
process.exit(issues ? 1 : 0);
