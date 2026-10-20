// Umbenennung "Startelo XI" (Prompt 58): kein sichtbares "Starting XI" mehr, alle Texte/Dateinamen/Bilder neu, alter Stand (Profil, SXI1-Code,
// Duell-Link) laedt unveraendert. Vergleichsstand = letzter Commit VOR der Umbenennung (7a875a5).
// Aufruf: node tools/test-umbenennung.mjs [--shots <ordner>]
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = path.join(root, "startelf_check.html"), oldHtml = path.join(root, ".alt-startelf.html");
const OLD_COMMIT = "7a875a5";
const shots = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra !== "" ? ": " + extra : ""}`); } };

/* ---- 1) statisch ---- */
const src = fs.readFileSync(html, "utf8"), manifest = fs.readFileSync(path.join(root, "manifest.json"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const left = src.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => /starting/i.test(l));
check("Sichtbar kein 'Starting XI' mehr: einziger Rest ist APP_URL (GitHub-Pages-Pfad)", left.length === 1 && /const APP_URL = /.test(left[0][1]), JSON.stringify(left.map(([n, l]) => n + ":" + l.trim().slice(0, 80))));
check("manifest.json: name + short_name = Startelo XI, kein 'Starting'", /"name": "Startelo XI"/.test(manifest) && /"short_name": "Startelo XI"/.test(manifest) && !/starting/i.test(manifest));
check("title + apple-mobile-web-app-title", /<title>Startelo XI<\/title>/.test(src) && /apple-mobile-web-app-title" content="Startelo XI"/.test(src));
check("Logo, Ladebildschirm (h1 + aria-label)", /<b>Startelo <em>XI<\/em><\/b>/.test(src) && /<h1>Startelo <em>XI<\/em><\/h1>/.test(src) && /aria-label="Startelo XI wird geladen"/.test(src));
check("Walkout-Bande (3D-Text + Textur) = STARTELO XI", (src.match(/STARTELO XI/g) || []).length === 2 && !/STARTING XI/.test(src));
check("Interne Schluessel unveraendert: anstoss_profile, SXI1, startingxi-v im Service Worker, Dateiname", /PROFILE_KEY = "anstoss_profile"/.test(src) && /SAVE_PREFIX = "SXI1"/.test(src) && /CACHE_NAME = "startingxi-v\d+"/.test(sw));
check("Tagline bleibt", /Echte Spiele\. Deine Startelf\./.test(src));
check("Startseiten-Tagline-Text nicht veraendert; 'Startelo' kommt in >= 15 Stellen vor", (src.match(/Startelo/gi) || []).length >= 15, String((src.match(/Startelo/gi) || []).length));

/* ---- 2) alter Stand laedt ---- */
fs.writeFileSync(oldHtml, execSync(`git show ${OLD_COMMIT}:startelf_check.html`, { cwd: root, maxBuffer: 64 * 1024 * 1024 }));
const browser = await chromium.launch();
let old = {};
try {
  const octx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  const op = await octx.newPage();
  await op.goto("file://" + oldHtml); await op.waitForTimeout(6500);
  old = await op.evaluate(() => {
    profile.duelName = "Anna"; profile.duelHandle = "anna"; awardXP(profile, 5000, "Test");
    getMatchesByTier(1).slice(0, 3).forEach((m) => { profile.campaign.levelPassed[m.id] = true; profile.campaign.stars[m.id] = 2; });
    const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }); profile.duels[id].mine = [{ correct: 7, seconds: 80, left: 0 }, { correct: 8, seconds: 90, left: 0 }, { correct: 6, seconds: 100, left: 0 }]; profile.duels[id].status = "waiting";
    saveProfile(profile);
    return { raw: localStorage.getItem(PROFILE_KEY), code: exportSaveCode(), link: duelBaseUrl() + "#duel=" + duelChallengeCode(id), level: profile.level, xp: profile.totalXP, name: profile.duelName, duels: Object.keys(profile.duels).length, passed: Object.keys(profile.campaign.levelPassed).length };
  });
  await octx.close();
  check("Alter Stand erzeugt (alte App)", !!old.raw && /^SXI1\./.test(old.code) && /#duel=/.test(old.link));

  const nctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  await nctx.addInitScript((raw) => { if (!localStorage.getItem("anstoss_profile")) localStorage.setItem("anstoss_profile", raw); }, old.raw);
  const np = await nctx.newPage(); const errs = [];
  np.on("pageerror", (e) => errs.push(e.message));
  await np.goto("file://" + html); await np.waitForTimeout(6500);
  const cur = await np.evaluate(() => ({ level: profile.level, xp: profile.totalXP, name: profile.duelName, duels: Object.keys(profile.duels).length, passed: Object.keys(profile.campaign.levelPassed).length }));
  check("Altes Profil laedt unveraendert (Level, XP, Name, Duelle, bestandene Level)", cur.level === old.level && cur.xp === old.xp && cur.name === old.name && cur.duels === old.duels && cur.passed === old.passed, JSON.stringify([cur, old.level, old.xp]));
  const pc = await np.evaluate((code) => { const r = parseSaveCode(code); return { ok: !!r.obj, level: r.obj && r.obj.level, err: r.error, bad: parseSaveCode("SXI9.abc.d").error, junk: parseSaveCode("blub").error }; }, old.code);
  check("Alter SXI1-Sicherungs-Code wird akzeptiert", pc.ok && pc.level === old.level, JSON.stringify(pc));
  check("Fehlermeldung nennt Startelo-XI-Spielstand", /Startelo-XI-Spielstand/.test(pc.junk || ""), pc.junk);

  // Teilen-Texte, Dateinamen, Canvas-Schrift (fillText mitschneiden)
  const sh = await np.evaluate(async () => {
    const out = { shared: [], fills: [] }, ofill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, ...r) { out.fills.push(String(t)); return ofill.call(this, t, ...r); };
    navigator.canShare = () => true; navigator.share = async (d) => { out.shared.push({ files: (d.files || []).map((f) => f.name), text: d.text || "", title: d.title || "" }); };
    const key = localDateKey(); profile.daily[key] = { id: getDailyChallenge(key).id, correct: 9, grid: [["🟩", "🟩"]], stars: 2, cells: {} }; profile.streak.current = 3; saveProfile(profile);
    await shareDailyResult(key);
    const info = dailyShareInfo(key); const cv = await drawDailyShareCanvas(info); out.canvas = cv.width + "x" + cv.height;
    navigator.canShare = undefined; await shareDailyResult(key); // Text-Fallback
    const id = Object.keys(profile.duels)[0]; await shareDuelLink(id);
    profile.duels[id].role = "opponent"; profile.duels[id].theirs = profile.duels[id].mine; profile.duels[id].opponent = { name: "Tim", deviceId: "t", handle: "tim" };
    await shareDuelResult(id);
    // Spielstand sichern: Datei + Titel
    navigator.canShare = () => true; openExportSave(); await new Promise((r) => setTimeout(r, 400)); const b = document.getElementById("saveShare"); if (b && !b.hidden) b.click(); await new Promise((r) => setTimeout(r, 300));
    document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove());
    CanvasRenderingContext2D.prototype.fillText = ofill;
    return out;
  });
  const sj = JSON.stringify(sh.shared);
  check("Teilen-Bild: Dateiname startelo-xi-spieltag-N.png + Text 'Startelo XI · Spieltag'", sh.shared.some((s) => s.files.some((f) => /^startelo-xi-spieltag-\d+\.png$/.test(f)) && /Startelo XI · Spieltag/.test(s.text)), sj);
  check("Teilen-Bild zeichnet 'Startelo ' + 'XI' (kein 'Starting')", sh.fills.includes("Startelo ") && sh.fills.includes("XI") && !sh.fills.some((t) => /starting/i.test(t)), JSON.stringify(sh.fills.filter((t) => /star|xi/i.test(t))));
  check("Text-Teilen (ohne Bild): 'Startelo XI · Tag N · x/11'", sh.shared.some((s) => /^Startelo XI · Tag \d+ · 9\/11/.test(s.text)), sj);
  check("Duell-Einladungstext + Duell-Ergebnis-Text nennen Startelo XI", sh.shared.some((s) => /fordert dich bei Startelo XI heraus/.test(s.text)) && sh.shared.some((s) => /hat dein Duell bei Startelo XI gespielt/.test(s.text)), sj);
  check("Spielstand sichern: Datei startelo-xi-spielstand.txt + Titel 'Startelo XI Spielstand'", sh.shared.some((s) => s.files.includes("startelo-xi-spielstand.txt") && s.title === "Startelo XI Spielstand"), sj);
  check("Keine Konsolenfehler (neue App mit altem Profil)", !errs.length, errs.join("|"));
  await nctx.close();

  // alter Duell-Link in der NEUEN App (frisches Profil = anderer Absender)
  const fctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  const fp = await fctx.newPage();
  await fp.goto("file://" + html); await fp.waitForTimeout(6500);
  const dl = await fp.evaluate((link) => { const r = handleDuelInput(link); return { ok: !r.error, kind: r.kind, err: r.error, duels: Object.keys(profile.duels).length }; }, old.link);
  check("Alter Duell-Link (#duel=) oeffnet in der neuen App", dl.ok && dl.kind === "c" && dl.duels === 1, JSON.stringify(dl));
  await fctx.close();

  /* ---- 3) Optik ohne Umbruch/Abschneiden ---- */
  for (const [w, h] of [[393, 852], [375, 667]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block" });
    const page = await ctx.newPage();
    await page.goto("file://" + html); await page.waitForTimeout(1600);
    const spl = await page.evaluate(() => { const e = document.querySelector("#ldBrand h1"); if (!e) return null; const r = e.getBoundingClientRect(), fs = parseFloat(getComputedStyle(e).fontSize); return { txt: e.textContent, one: r.height < fs * 1.5, fit: e.scrollWidth <= e.clientWidth + 1 && r.left >= 0 && r.right <= innerWidth }; });
    check(`${w}x${h} Ladebildschirm: "Startelo XI" einzeilig, im Bild`, spl && spl.txt === "Startelo XI" && spl.one && spl.fit, JSON.stringify(spl));
    if (shots) await page.screenshot({ path: path.join(shots, `ladescreen_${w}.png`) });
    await page.waitForTimeout(5800);
    const logo = await page.evaluate(() => { const b = document.querySelector("#screen-start .hm-brand b"), r = b.getBoundingClientRect(), fs = parseFloat(getComputedStyle(b).fontSize), chip = document.querySelector("#screen-start .hm-head").getBoundingClientRect(); return { txt: b.textContent, one: r.height < fs * 1.5, fit: b.scrollWidth <= b.clientWidth + 1, headOk: document.querySelector("#screen-start .hm-head").scrollWidth <= chip.width + 1 }; });
    check(`${w}x${h} Logo: "Startelo XI" einzeilig, Kopfzeile ohne Ueberlauf`, logo.txt === "Startelo XI" && logo.one && logo.fit && logo.headOk, JSON.stringify(logo));
    if (shots) await page.screenshot({ path: path.join(shots, `logo_${w}.png`), clip: { x: 0, y: 0, width: w, height: 130 } });
    // Teilen-Bild als PNG ansehen
    if (shots) {
      const url = await page.evaluate(async () => { const key = localDateKey(); profile.daily[key] = { id: getDailyChallenge(key).id, correct: 9, grid: [["🟩"]], stars: 2, cells: {} }; profile.streak.current = 3; const cv = await drawDailyShareCanvas(dailyShareInfo(key)); return cv.toDataURL("image/png"); });
      fs.writeFileSync(path.join(shots, `teilen_${w}.png`), Buffer.from(url.split(",")[1], "base64"));
    }
    // Walkout-Bande: Textur-Text + Screenshots
    const wo = await page.evaluate(() => { window.__fills = []; const o = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (t, ...r) { window.__fills.push(String(t)); return o.call(this, t, ...r); }; return true; });
    for (const t of [5000, 8000, 11000]) {
      await page.evaluate((t) => { window.WO_TEST_T = t; profile.duelName = "Anna"; profile.duelHandle = "anna"; const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }); profile.duels[id].opponent = { name: "Lisa", deviceId: "l1", handle: "lisa", rank: "Bundesliga", level: 14 }; navStack.length = 0; navigate("start"); startDuelRun(id); }, t);
      await page.waitForTimeout(1500);
      if (shots) await page.screenshot({ path: path.join(shots, `walkout_${w}_${t}.png`) });
      await page.evaluate(() => { try { abortDuelRun(); } catch (e) {} navStack.length = 0; navigate("start"); }); await page.waitForTimeout(300);
    }
    const fl = await page.evaluate(() => window.__fills);
    check(`${w}x${h} Walkout-Bande: Textur schreibt "STARTELO XI"`, fl.includes("STARTELO XI") && !fl.some((x) => /STARTING/i.test(x)), JSON.stringify([...new Set(fl)].filter((x) => /STAR/i.test(x))));
    await ctx.close();
  }
} finally { fs.rmSync(oldHtml, { force: true }); await browser.close(); }
console.log(fails ? `\n${fails} von ${total} FALSCH` : `OK - ${total} Umbenennungs-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
