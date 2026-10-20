// Welt- und Rangnamen (Prompt 59): Profiliga / Meisterklasse / Zweite Liga statt geschuetzter Ligamarken. Spieldaten, Filter und Duell-Kategorien
// behalten die Wettbewerbsnamen. Alter Stand (Commit 575876b) laedt unveraendert; Gegner-Raenge aus alten Links/Duellen werden auf die neuen Namen abgebildet.
// Aufruf: node tools/test-weltnamen.mjs [--shots <ordner>]
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = path.join(root, "startelf_check.html"), oldHtml = path.join(root, ".alt-startelf.html");
const OLD_COMMIT = "575876b";
const shots = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra !== "" ? ": " + extra : ""}`); } };

/* ---- 1) statisch: wo stehen die alten Namen noch? ---- */
const src = fs.readFileSync(html, "utf8");
const hits = src.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => /Bundesliga|Champions[ -]League/.test(l));
const DATA = /^\s*(league|comp|context|teaser|source|title):/;
const ALLOWED = [/const RANK_RENAME = /, /label: "Champions League", leagues:/, /label: "Deutschland", leagues:/, /"Deutschland": \[/, /"Europapokal": \[/, /const DUEL_LEAGUE_SHORT = /, /Wer dran ist, bekommt drei zufällige Kategorien/, /Champions-League-/, /\.replace\("Champions League", "CL"\)/];
const notData = hits.filter(([, l]) => !DATA.test(l)), unexpected = notData.filter(([, l]) => !ALLOWED.some((r) => r.test(l)));
console.log(`Verbleibende Fundstellen: ${hits.length} (davon ${hits.length - notData.length} Spieldaten, ${notData.length} Filter/Kategorien/Abbildung)`);
notData.forEach(([n, l]) => console.log(`   ${n}: ${l.trim().slice(0, 110)}`));
check("Alte Namen nur noch in Spieldaten, Filtern, Duell-Kategorien und der Abbildung", unexpected.length === 0, JSON.stringify(unexpected.map(([n, l]) => n + ":" + l.trim().slice(0, 60))));
check("DIFF_LABEL + RANKS tragen die neuen Namen", /DIFF_LABEL = \{ 1: "Kreisliga", 2: "Regionalliga", 3: "Profiliga", 4: "Meisterklasse", 5: "Weltklasse" \}/.test(src) && /name: "Zweite Liga"/.test(src) && /name: "Profiliga"/.test(src) && /name: "Meisterklasse"/.test(src) && !/name: "(2\. )?Bundesliga"/.test(src) && !/name: "Champions League", c1/.test(src));
const claude = fs.readFileSync(path.join(root, "CLAUDE.md"), "utf8");
check("CLAUDE.md: Stufen-Tabelle + Regel", /\| 3 \| Profiliga/.test(claude) && /\| 4 \| Meisterklasse/.test(claude) && /nie als eigene Welt-, Rang- oder Modusnamen/.test(claude));

/* ---- 2) alter Stand ---- */
fs.writeFileSync(oldHtml, execSync(`git show ${OLD_COMMIT}:startelf_check.html`, { cwd: root, maxBuffer: 64 * 1024 * 1024 }));
const browser = await chromium.launch();
let old;
try {
  const octx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  const op = await octx.newPage();
  await op.goto("file://" + oldHtml); await op.waitForTimeout(6500);
  old = await op.evaluate(() => {
    profile.duelName = "Anna"; profile.duelHandle = "anna";
    for (let t = 1; t <= 5; t++) getCoreMatchesByTier(t).forEach((m, i) => { profile.campaign.levelPassed[m.id] = true; profile.campaign.stars[m.id] = (i % 3) + 1; });
    while (profile.level < 22) awardXP(profile, 1000, "x");
    checkTrophies(profile);
    const id = createDuel({ rounds: 1, seconds: 120, difficulty: 0 }); profile.duels[id].opponent = { name: "Max", deviceId: "dev-max", handle: "max", rank: "Bundesliga", level: 16 };
    profile.duelStats.perOpponent["dev-max"] = { name: "Max", handle: "max", rank: "2. Bundesliga", level: 12, w: 1, l: 0, d: 0 };
    profile.duels[id].mine = [{ correct: 7, seconds: 80, left: 0 }]; profile.duels[id].status = "waiting";
    saveProfile(profile);
    const link = duelBaseUrl() + "#duel=" + duelChallengeCode(id);
    const tiers = {}; for (let t = 1; t <= 5; t++) tiers[t] = getCoreMatchesByTier(t).filter((m) => profile.campaign.levelPassed[m.id]).length;
    return { raw: localStorage.getItem(PROFILE_KEY), link, rankMe: rankForLevel(profile.level).name, level: profile.level, tiers, trophies: [...(profile.trophiesWon || [])].sort(), stars: JSON.stringify(profile.campaign.stars), id };
  });
  await octx.close();
  check("Alter Stand: eigener Rang war 'Champions League', Link traegt ihn", old.rankMe === "Champions League" && old.level >= 20, old.rankMe);

  const nctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  await nctx.addInitScript((raw) => { if (!localStorage.getItem("anstoss_profile")) localStorage.setItem("anstoss_profile", raw); }, old.raw);
  const np = await nctx.newPage(); const errs = [];
  np.on("pageerror", (e) => errs.push(e.message));
  await np.goto("file://" + html); await np.waitForTimeout(6500);
  const cur = await np.evaluate(() => { const tiers = {}; for (let t = 1; t <= 5; t++) tiers[t] = getCoreMatchesByTier(t).filter((m) => profile.campaign.levelPassed[m.id]).length;
    const id = Object.keys(profile.duels)[0]; return { tiers, level: profile.level, trophies: [...(profile.trophiesWon || [])].sort(), stars: JSON.stringify(profile.campaign.stars), oppRank: profile.duels[id].opponent.rank, perRank: profile.duelStats.perOpponent["dev-max"].rank, me: rankForLevel(profile.level).name }; });
  check("Kampagnen-Fortschritt je Welt unveraendert", JSON.stringify(cur.tiers) === JSON.stringify(old.tiers), JSON.stringify([cur.tiers, old.tiers]));
  check("Level, Sterne und Trophaeen-IDs unveraendert", cur.level === old.level && cur.stars === old.stars && JSON.stringify(cur.trophies) === JSON.stringify(old.trophies), JSON.stringify([cur.level, old.level]));
  check("Gespeicherte Gegner-Raenge migriert (Bundesliga -> Profiliga, 2. Bundesliga -> Zweite Liga)", cur.oppRank === "Profiliga" && cur.perRank === "Zweite Liga", JSON.stringify([cur.oppRank, cur.perRank]));
  check("Eigener Rang heisst jetzt 'Meisterklasse'", cur.me === "Meisterklasse", cur.me);
  check("Keine Konsolenfehler (neue App mit altem Profil)", !errs.length, errs.join("|"));
  await nctx.close();

  // alter Duell-Link (Absender-Rang 'Champions League') in der neuen App
  const fctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  const fp = await fctx.newPage();
  await fp.goto("file://" + html); await fp.waitForTimeout(6500);
  const dl = await fp.evaluate(async (link) => { const r = handleDuelInput(link); const id = r.id; activeInviteId = id; navStack.length = 0; navigate("start"); navigate("duelinvite"); await new Promise((r2) => setTimeout(r2, 500));
    const inv = document.getElementById("duelInviteView").innerText; return { ok: !r.error, rank: profile.duels[id].opponent.rank, inv }; }, old.link);
  check("Alter Duell-Link: Rang des Absenders wird 'Meisterklasse'", dl.ok && dl.rank === "Meisterklasse", JSON.stringify([dl.ok, dl.rank]));
  check("Einladung zeigt 'Meisterklasse · Level', nicht 'Champions League'", /Meisterklasse · Level/.test(dl.inv) && !/Champions League/.test(dl.inv), dl.inv.replace(/\s+/g, " ").slice(0, 160));
  const wo = await fp.evaluate(async () => { window.WO_TEST_T = 3000; profile.duelName = "Du"; const id = Object.keys(profile.duels)[0]; profile.duels[id].opponent.rank = "Champions League"; profile.duels[id].role = "challenger"; navStack.length = 0; navigate("start"); startDuelRun(id); await new Promise((r) => setTimeout(r, 1500)); const e = document.querySelector("#wo-foOpWho"); return e ? e.textContent : null; });
  check("Walkout-Anzeige bildet auch einen alten Rang ab ('Meisterklasse')", /Meisterklasse/.test(wo || "") && !/Champions/.test(wo || ""), String(wo));
  await fctx.close();

  /* ---- 3) UI-Texte + Optik ---- */
  for (const [w, h] of [[393, 852], [375, 667]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block" });
    const page = await ctx.newPage(); const tag = `${w}x${h}`, wait = (ms) => page.waitForTimeout(ms);
    await page.goto("file://" + html); await wait(6500);
    const names = await page.evaluate(() => ({ labels: [1, 2, 3, 4, 5].map((n) => DIFF_LABEL[n]), ranks: RANKS.map((r) => r.name), c3: TROPHIES.find((t) => t.id === "cup_tier3").name, p4: TROPHIES.find((t) => t.id === "plate_tier4").name, c4d: TROPHIES.find((t) => t.id === "cup_tier4").desc }));
    check(`${tag} Weltnamen`, names.labels.join() === "Kreisliga,Regionalliga,Profiliga,Meisterklasse,Weltklasse", names.labels.join());
    check(`${tag} Rangnamen`, names.ranks.join() === "Kreisliga,Regionalliga,Zweite Liga,Profiliga,Meisterklasse,Weltklasse", names.ranks.join());
    check(`${tag} Trophaeen-Namen folgen den Weltnamen`, names.c3 === "Profiliga-Pokal" && names.p4 === "Meisterklasse-Schale" && /Meisterklasse/.test(names.c4d), JSON.stringify([names.c3, names.p4]));
    // Weltkarte
    await page.evaluate(() => { profile.campaign.levelPassed = {}; for (let t = 1; t <= 2; t++) getCoreMatchesByTier(t).forEach((m) => { profile.campaign.levelPassed[m.id] = true; }); profile.drafts = {}; saveProfile(profile); navStack.length = 0; navigate("start"); navigate("worldmap"); }); await wait(1800);
    const wm = await page.evaluate(() => [...document.querySelectorAll(".wm-wname")].map((e) => ({ t: e.textContent.trim(), fit: e.scrollWidth <= e.clientWidth + 1 })));
    check(`${tag} Weltkarte: Namen sichtbar und nicht abgeschnitten`, wm.map((x) => x.t).join() === "Kreisliga,Regionalliga,Profiliga,Meisterklasse,Weltklasse" && wm.every((x) => x.fit), JSON.stringify(wm));
    if (shots) await page.screenshot({ path: path.join(shots, `weltkarte_${w}.png`) });
    // Kachel
    await page.evaluate(() => { navStack.length = 0; navigate("start"); renderModeTiles(); }); await wait(700);
    const tl = await page.evaluate(() => { const e = document.querySelector("#modeTileCampaign .hm-m-h small"); return { t: e.textContent.trim(), fit: e.scrollWidth <= e.clientWidth + 1 }; });
    check(`${tag} Kachel: "Profiliga · Level n von m"`, /^Profiliga · Level 1 von \d+/.test(tl.t), tl.t);
    if (shots) await page.screenshot({ path: path.join(shots, `kachel_${w}.png`), clip: { x: 0, y: Math.round(h * 0.52), width: w, height: Math.round(h * 0.4) } });
    // Pfad Welt 3 und 4 (mit angefangenem Level -> Schild)
    for (const tier of [3, 4]) {
      await page.evaluate((tier) => { const ms = getMatchesByTier(tier); profile.drafts = {}; profile.drafts["c:" + ms[0].id] = { mode: "c", id: ms[0].id, entries: { TW: { v: "x", s: "typed" } }, updated: Date.now() }; saveProfile(profile); campaignTier = tier; navStack.length = 0; navigate("start"); navigate("levelpath"); }, tier);
      await wait(4800);
      const pf = await page.evaluate(() => ({ title: document.querySelector("#lpWorld .lp-board h2").textContent.trim(), fit: (() => { const h = document.querySelector("#lpWorld .lp-board h2"); return h.scrollWidth <= h.clientWidth + 1; })(), top: document.getElementById("pathTitle").textContent }));
      check(`${tag} Pfad Welt ${tier}: Titel "${tier === 3 ? "Profiliga" : "Meisterklasse"}"`, pf.title === (tier === 3 ? "Profiliga" : "Meisterklasse") && pf.fit, JSON.stringify(pf));
      if (shots) await page.screenshot({ path: path.join(shots, `pfad_welt${tier}_${w}.png`) });
    }
    // Scout-Pass: Raenge bei Level 10 / 15 / 20 + Level-Up-Text
    for (const [lv, name] of [[10, "Zweite Liga"], [15, "Profiliga"], [20, "Meisterklasse"]]) {
      await page.evaluate((lv) => { profile.level = lv; saveProfile(profile); navStack.length = 0; navigate("start"); renderProfileBar(); openProfileSheet("ov"); }, lv); await wait(900);
      const pass = await page.evaluate(() => { const e = document.querySelector(".hm-psheet .hm-who b"); return { t: e ? e.textContent.trim() : null, fit: e ? e.scrollWidth <= e.clientWidth + 1 : false }; });
      check(`${tag} Scout-Pass Level ${lv}: "${name}"`, pass.t === name && pass.fit, JSON.stringify(pass));
      if (shots && (lv === 15 || lv === 20)) await page.screenshot({ path: path.join(shots, `scoutpass_lv${lv}_${w}.png`) });
      await page.evaluate(() => document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove())); await wait(200);
    }
    const lu = await page.evaluate(async () => { showLevelUpToast(15, 1); await new Promise((r) => setTimeout(r, 400)); const t = (document.querySelector(".lu-rank") || {}).textContent || ""; document.querySelectorAll(".lu-overlay").forEach((e) => e.remove()); return t; });
    check(`${tag} Level-Up zeigt "Neuer Rang: Profiliga"`, /Neuer Rang: Profiliga/.test(lu), lu);
    // Welt-Feier Welt 3 -> 4: Wort einzeilig
    const wc = await page.evaluate(async () => { window.WC_TEST_T = 9500; const c = playWorldCelebration(3); await new Promise((r) => setTimeout(r, 1800)); const w = document.getElementById("wc-word"); const lines = w ? [...w.querySelectorAll(".wc-ln")].map((l) => ({ t: l.textContent, w: l.getBoundingClientRect().width / (parseFloat(getComputedStyle(document.getElementById("wc-phone")).transform.split(",")[0].replace("matrix(", "")) || 1) })) : []; const fs = w ? parseFloat(getComputedStyle(w).fontSize) : 0; return { lines, fs, id: !!w }; });
    check(`${tag} Welt-Feier: "MEISTERKLASSE" einzeilig, hoechstens 350 px breit`, wc.id && wc.lines.length === 1 && wc.lines[0].t === "MEISTERKLASSE" && wc.lines[0].w <= 352, JSON.stringify(wc));
    if (shots) await page.screenshot({ path: path.join(shots, `weltfeier_welt4_${w}.png`) });
    await page.evaluate(() => { const r = document.getElementById("worldCelebration"); if (r) r.remove(); });
    await ctx.close();
  }
} finally { fs.rmSync(oldHtml, { force: true }); await browser.close(); }
console.log(fails ? `\n${fails} von ${total} FALSCH` : `OK - ${total} Weltnamen-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
