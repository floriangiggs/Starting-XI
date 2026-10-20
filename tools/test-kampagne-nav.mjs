// Kampagne von der Startseite (Prompt 57, Teil B): Kachel fuehrt immer in den Level-Pfad (start -> worldmap -> levelpath), Zurueck-Kette,
// Vorschau-/Ergebnis-"Pfad", Android-Zurueck, Schild "Weiter aufstellen" nur bei angefangenem Level (genau eines, ohne Ueberlappung),
// Float-Knopf "Weiter: Level n" oeffnet direkt die Vorschau, goBackTo("levelpath") ohne Pfad im Verlauf erzeugt keinen Vorwaertseintrag.
// Aufruf: node tools/test-kampagne-nav.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const html = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "startelf_check.html");
const browser = await chromium.launch();
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra !== "" ? ": " + extra : ""}`); } };
const SIZES = [[393, 852], [375, 667], [768, 1024]];
const shotDir = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;

for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("file://" + html); await page.waitForTimeout(6500);
  const tag = `${w}x${h}`, wait = (ms) => page.waitForTimeout(ms);
  const top = () => page.evaluate(() => navStack[navStack.length - 1]);
  const stack = () => page.evaluate(() => navStack.join(">"));
  const visible = (id) => page.evaluate((id) => !document.getElementById("screen-" + id).hidden, id);
  // Spielstand setzen: passed = { welt: anzahl bestandener Kern-Level }, draft = [welt, index] | null
  const setup = (passed, draft) => page.evaluate(({ passed, draft }) => {
    profile.campaign.levelPassed = {}; profile.drafts = {}; profile.hintTokens = 5;
    for (const [t, n] of Object.entries(passed)) getCoreMatchesByTier(+t).slice(0, n).forEach((m) => { profile.campaign.levelPassed[m.id] = true; });
    if (draft) { const m = getMatchesByTier(draft[0])[draft[1]]; profile.drafts["c:" + m.id] = { mode: "c", id: m.id, entries: { TW: { v: "x", s: "typed" } }, hintsUsed: [], tokenRevealed: [], fuzzyCorrected: [], wheel: {}, combo: 0, updated: Date.now() }; }
    saveProfile(profile); navStack.length = 0; history.replaceState({ stack: ["start"] }, "", "#start"); navStack.push("start"); showScreen("start", "back"); renderModeTiles();
  }, { passed, draft });
  const tile = () => page.evaluate(() => ({ btn: document.querySelector("#modeTileCampaign .hm-m-btn").textContent.trim(), txt: document.querySelector("#modeTileCampaign .hm-m-h small").textContent.trim() }));
  const cases = [
    { name: "neu", passed: {}, draft: null, tier: 1, btn: "Los geht's", lvl: 1, sign: false },
    { name: "Level offen", passed: { 1: 3 }, draft: null, tier: 1, btn: "Zum Pfad", lvl: 4, sign: false },
    { name: "Level angefangen", passed: { 1: 2 }, draft: [1, 2], tier: 1, btn: "Zum Pfad", lvl: 3, sign: true, draftIdx: 2 },
    { name: "angefangen in Welt 2", passed: { 1: 99, 2: 1 }, draft: [2, 1], tier: 2, btn: "Zum Pfad", lvl: 2, sign: true, draftIdx: 1 },
    { name: "alle Welten geschafft", passed: { 1: 99, 2: 99, 3: 99, 4: 99, 5: 99 }, draft: null, tier: null, btn: "Zur Weltkarte", sign: false },
  ];
  for (const c of cases) {
    const t = `${tag} ${c.name}`;
    await setup(c.passed, c.draft); await wait(300);
    const tl = await tile();
    check(`${t}: Kachel-Knopf "${c.btn}"`, tl.btn === c.btn, tl.btn);
    if (c.draft) check(`${t}: Kachel-Text nennt "angefangen"`, /angefangen/.test(tl.txt), tl.txt);
    await page.click("#modeTileCampaign"); await wait(1200);
    if (c.tier === null) { check(`${t}: Weltkarte wie bisher`, (await stack()) === "start>worldmap" && (await visible("worldmap"))); continue; }
    check(`${t}: Verlauf start>worldmap>levelpath`, (await stack()) === "start>worldmap>levelpath", await stack());
    check(`${t}: Pfad sichtbar, richtige Welt`, (await visible("levelpath")) && !(await visible("worldmap")) && (await page.evaluate(() => campaignTier)) === c.tier);
    await wait(3600); // Einstiegs-Kamerafahrt
    const sg = await page.evaluate(() => [...document.querySelectorAll("#lpWorld .lp-wsign")].map((e) => e.textContent.trim()));
    check(`${t}: Schild "Weiter aufstellen" ${c.sign ? "genau einmal" : "nicht vorhanden"}`, c.sign ? sg.length === 1 && sg[0] === "Weiter aufstellen" : sg.length === 0, JSON.stringify(sg));
    if (c.sign) {
      const ov = await page.evaluate(() => {
        const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
        const ws = document.querySelector("#lpWorld .lp-wsign"), me = R(ws), world = R(document.getElementById("lpWorld")), nd = ws.closest(".lp-node");
        const hit = (a, b, pad = 1) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;
        const bad = [];
        document.querySelectorAll("#lpWorld .lp-nbtn, #lpWorld .lp-nstars, #lpWorld .lp-badge, #lpWorld .lp-du, #lpWorld .lp-sign, #lpWorld .lp-note, #lpWorld .lp-goal").forEach((e) => { if (hit(me, R(e))) bad.push(e.className.baseVal || e.className); });
        return { bad, inside: me.l >= world.l - 0.5 && me.r <= world.r + 0.5, h: me.b - me.t, w: me.r - me.l, anim: getComputedStyle(ws).animationName, tapH: ws.getBoundingClientRect().height };
      });
      check(`${t}: Schild ohne Ueberlappung, im Spielfeld`, ov.bad.length === 0 && ov.inside, JSON.stringify(ov));
      check(`${t}: Schild ohne Dauer-Animation`, ov.anim === "none", ov.anim);
      if (shotDir && c.name === "Level angefangen") await page.screenshot({ path: `${shotDir}/pfad_schild_${w}.png` });
    }
    // Float-Knopf
    await page.evaluate(() => { document.getElementById("lpScroll").scrollTop = 0; }); await wait(400);
    const fl = await page.evaluate(() => { const f = document.getElementById("lpFloat"); return { on: f.classList.contains("on"), txt: f.textContent.trim() }; });
    const expTxt = c.draft ? "Weiter: Level " + (c.draftIdx + 1) : "Zu Level " + c.lvl;
    check(`${t}: Float-Knopf "${expTxt}"`, fl.txt === expTxt, fl.txt);
    if (c.draft) {
      check(`${t}: Float-Knopf sichtbar, wenn das angefangene Level aus dem Bild ist`, fl.on || await page.evaluate(() => { const st = lpState; return st.draftY - document.getElementById("lpScroll").scrollTop < document.getElementById("lpScroll").clientHeight - 80; }));
      await page.evaluate(() => document.getElementById("lpFloat").click()); await wait(900);
      const g = await page.evaluate(() => ({ top: navStack[navStack.length - 1], idx: currentLevelContext && currentLevelContext.index, cta: (document.getElementById("toPitchBtn") || {}).textContent }));
      check(`${t}: "Weiter: Level n" oeffnet direkt die Vorschau des angefangenen Levels`, g.top === "game" && g.idx === c.draftIdx && /Weiter aufstellen/.test(g.cta || ""), JSON.stringify(g));
      check(`${t}: Vorschau-Zurueck "Pfad" -> Pfad`, await (async () => { await page.click("#lvBack"); await wait(900); return (await stack()) === "start>worldmap>levelpath"; })());
      // Tipp auf das Schild = Tipp auf den Knoten
      await wait(400);
      await page.evaluate(() => document.querySelector("#lpWorld .lp-wsign").click()); await wait(800);
      check(`${t}: Tipp auf das Schild oeffnet dieselbe Vorschau`, (await top()) === "game" && (await page.evaluate(() => currentLevelContext.index)) === c.draftIdx);
      await page.click("#lvBack"); await wait(900);
    } else if (c.name !== "neu") {
      await page.evaluate(() => document.getElementById("lpFloat").classList.contains("on") && document.getElementById("lpFloat").click()); await wait(1000);
      check(`${t}: Float-Knopf ohne Entwurf scrollt nur (bleibt im Pfad)`, (await top()) === "levelpath");
    }
    // Zurueck-Kette: Pfad -> Weltkarte -> Start
    await page.click("#backFromLevelpath"); await wait(900);
    check(`${t}: Zurueck im Pfad -> Weltkarte`, (await top()) === "worldmap" && (await visible("worldmap")), await stack());
    await page.click("#backFromWorldmap"); await wait(900);
    check(`${t}: Zurueck in der Weltkarte -> Startseite`, (await top()) === "start" && (await visible("start")), await stack());
    // Android-Zurueck (history.back) dieselbe Kette
    await page.click("#modeTileCampaign"); await wait(1100);
    await page.evaluate(() => history.back()); await wait(700);
    const a1 = await top(); await page.evaluate(() => history.back()); await wait(700);
    check(`${t}: Android-Zurueck: Pfad -> Weltkarte -> Startseite`, a1 === "worldmap" && (await top()) === "start", a1 + " / " + (await top()));
    // Pfad -> aktuelles Level -> Vorschau -> auswerten -> "Pfad"
    if (c.name === "Level offen" || c.name === "neu") {
      await page.click("#modeTileCampaign"); await wait(1100);
      await page.evaluate(() => document.querySelector("#lpWorld .lp-node.cur .lp-nbtn").click()); await wait(900);
      check(`${t}: Pfad -> Level -> Vorschau (game)`, (await top()) === "game" && (await page.evaluate(() => /Pfad/.test(document.getElementById("lvBack").textContent))));
      await page.click("#toPitchBtn"); await wait(700);
      await page.evaluate(() => { const m = currentMatch; document.querySelectorAll("#pitchView .pos-input").forEach((i) => { if (!i.disabled && !i.classList.contains("ok")) { i.value = m.players[i.dataset.abbr]; i.dispatchEvent(new Event("input", { bubbles: true })); } }); });
      await page.click("#checkBtn"); await wait(500);
      await page.evaluate(() => { const b = [...document.querySelectorAll(".modal-backdrop button")].find((x) => /Auswerten/.test(x.textContent)); if (b) b.click(); }); await wait(900);
      await page.evaluate(() => document.querySelectorAll(".modal-backdrop, .lu-overlay").forEach((e) => e.remove()));
      await page.click("#backBtn"); await wait(900);
      check(`${t}: nach Auswerten "Pfad" -> Pfad`, (await stack()) === "start>worldmap>levelpath", await stack());
      await page.click("#backFromLevelpath"); await wait(700); await page.click("#backFromWorldmap"); await wait(700);
    }
  }
  // goBackTo("levelpath") ohne Pfad im Verlauf: kein Vorwaertseintrag, Rueckweg fuehrt nicht ins Spiel
  await setup({ 1: 1 }, null); await wait(200);
  const gb = await page.evaluate(async () => {
    const m = getMatchesByTier(1)[1]; currentLevelContext = { tier: 1, index: 1, m }; navigate("game"); startMatch(m);
    const before = history.length; goBackTo("levelpath"); await new Promise((r) => setTimeout(r, 400));
    return { stack: navStack.join(">"), grew: history.length - before, shown: !document.getElementById("screen-levelpath").hidden };
  });
  check(`${tag}: goBackTo("levelpath") ohne Pfad im Verlauf ersetzt die Ebene (kein Vorwaertseintrag)`, gb.stack === "start>levelpath" && gb.grew === 0 && gb.shown, JSON.stringify(gb));
  await page.evaluate(() => history.back()); await wait(600);
  check(`${tag}: ... und "Zurueck" fuehrt zur Startseite, nicht ins Spiel`, (await top()) === "start", await stack());
  check(`${tag}: keine Konsolenfehler`, !errs.length, errs.join("|"));
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} von ${total} FALSCH` : `OK - ${total} Kampagnen-Navigations-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
