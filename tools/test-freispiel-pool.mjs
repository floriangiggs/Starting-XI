// Frei-spielen-Pool (Prompt 60): neue Karten (Frankreich, Niederlande & Portugal, Nostalgie, Highlights), "bald"-Zustand bei leerem Pool,
// Zaehler mit eingeschleusten Testeintraegen, Nostalgie nie in "Alle"/Wettbewerbs-Karten, Layout ohne Ueberlauf/Ueberlappung.
// Aufruf: node tools/test-freispiel-pool.mjs [--shots ordner]
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const html = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "startelf_check.html");
const browser = await chromium.launch();
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra !== "" ? ": " + extra : ""}`); } };
const SIZES = [[393, 852], [375, 667]];
const shotDir = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("file://" + html); await page.waitForTimeout(6500);
  const tag = `${w}x${h}`;
  const open = () => page.evaluate(() => { selectedLeagues.clear(); selectedDifficulties.clear(); profile.hardcoreMode = false; profile.drafts = {}; navStack.length = 0; history.replaceState({ stack: ["start"] }, "", "#start"); navStack.push("start"); showScreen("freeplay", "forward"); });
  const chips = () => page.evaluate(() => [...document.querySelectorAll("#fpBin .fp-ch")].map((b) => ({ nm: b.querySelector(".nm").textContent, n: b.querySelector(".n").textContent, soon: b.classList.contains("soon"), dis: b.disabled, on: b.classList.contains("on") })));
  const chip = async (nm) => (await chips()).find((c) => c.nm === nm);
  const layout = (label) => page.evaluate(() => {
    const bin = document.getElementById("fpBin"), bad = [], rs = [...bin.querySelectorAll(".fp-ch")].map((b) => [b, b.getBoundingClientRect()]);
    if (bin.scrollHeight > bin.clientHeight + 1) bad.push("Tafel scrollt/ragt ueber");
    if (bin.scrollWidth > bin.clientWidth + 1) bad.push("Tafel horizontal ueber");
    for (const [b, r] of rs) { const nm = b.querySelector(".nm"); if (!b.classList.contains("long") && nm.scrollWidth > nm.clientWidth + 1) bad.push("Name abgeschnitten: " + nm.textContent); if (b.classList.contains("long") && nm.scrollHeight > nm.clientHeight + 1) bad.push("Name abgeschnitten: " + nm.textContent); if (r.right > innerWidth + 0.5 || r.left < -0.5) bad.push("Karte ausserhalb: " + nm.textContent); }
    for (let a = 0; a < rs.length; a++) for (let c = a + 1; c < rs.length; c++) { const A = rs[a][1], B = rs[c][1]; if (A.left < B.right - 1 && B.left < A.right - 1 && A.top < B.bottom - 1 && B.top < A.bottom - 1) bad.push("Karten ueberlappen"); }
    const tray = document.querySelector(".fp-tray").getBoundingClientRect(), bb = bin.getBoundingClientRect();
    if (bb.bottom > tray.top + 1) bad.push("Tafel ueberlappt Auslos-Leiste");
    return [...new Set(bad)];
  });

  // 1) Ausgangslage: Karten ohne Duell-Pool-Eintraege (Frankreich, Niederlande & Portugal, Nostalgie) stehen auf "bald"
  await open(); await page.waitForTimeout(400);
  // Die Karten-Zaehler haengen vom Pool-Stand ab: alle Erwartungen werden aus dem Frei-spielen-Pool (fpPool) abgeleitet.
  // Testet man mit einem gefuellten Duell-Pool, werden nur Karten mit "bald" geprueft, die dort noch leer sind.
  const poolStat = await page.evaluate(() => ({ n: fpPool().filter((m) => m.special !== "nostalgie").length, fr: fpPool().filter((m) => ["Ligue 1", "Coupe de France"].includes(m.league)).length,
    nlpt: fpPool().filter((m) => ["Eredivisie", "Liga Portugal", "KNVB-Pokal", "Taça de Portugal"].includes(m.league)).length, nost: fpPool().filter((m) => m.special === "nostalgie").length }));
  const hlCount = await page.evaluate(() => fpPool().filter((m) => m.special === "highlight").length);
  for (const [nm, cnt] of [["Frankreich", poolStat.fr], ["Niederlande & Portugal", poolStat.nlpt], ["Nostalgie 2000–2007", poolStat.nost]]) {
    const c = await chip(nm);
    if (cnt === 0) check(`${tag} Karte ${nm} sichtbar, ausgegraut mit "bald", nicht antippbar`, c && c.soon && c.dis && c.n === "bald", JSON.stringify(c));
    else check(`${tag} Karte ${nm} gefuellt (${cnt}) und antippbar`, c && !c.soon && !c.dis && +c.n === cnt, JSON.stringify(c));
  }
  const hl = await chip("Highlights");
  check(`${tag} Highlights zaehlt die Kennzeichen im Frei-spielen-Pool (${hlCount})`, hl && !hl.soon && +hl.n === hlCount && hlCount > 0, JSON.stringify(hl));
  check(`${tag} Wettbewerbs-Karten ohne Nostalgie`, (await chip("WM")).n > 0);
  const alle = await page.evaluate(() => +document.querySelector("#fpAll .n").textContent);
  check(`${tag} "Alle" = ${poolStat.n} (Pool ohne Nostalgie)`, alle === poolStat.n, alle);
  const b0 = await layout();
  check(`${tag} Layout leer`, b0.length === 0, b0.join("; "));
  if (shotDir) await page.screenshot({ path: path.join(shotDir, `freispiel_leer_${tag}.png`) });
  // "bald"-Karte reagiert nicht
  await page.evaluate(() => document.querySelector("#fpBin .fp-ch.soon").click());
  check(`${tag} "bald"-Karte waehlt nichts`, await page.evaluate(() => selectedLeagues.size) === 0);

  // 2) Testeintraege einschleusen
  await page.evaluate(() => {
    const mk = (id, league, difficulty, extra = {}) => ({ id, comp: league + " 01.01.2020", league, teams: "A gegen B 1:0", side: "A", difficulty, formation: "4-4-2", players: {}, ...extra });
    DUEL_POOL.push(mk("tst-fr1", "Ligue 1", 2), mk("tst-fr2", "Coupe de France", 3), mk("tst-nl1", "Eredivisie", 2), mk("tst-pt1", "Liga Portugal", 4), mk("tst-nost1", "Champions League", 2, { special: "nostalgie" }),
      mk("tst-nost2", "Weltmeisterschaft", 3, { special: "nostalgie" }), mk("tst-hl1", "Ligue 1", 3, { special: "highlight" }), mk("tst-cl1", "Champions League", 2));
    selectedLeagues.clear(); paintFpBoard(false);
  });
  await page.waitForTimeout(300);
  const fr = await chip("Frankreich"), nlpt = await chip("Niederlande & Portugal"), nost = await chip("Nostalgie 2000–2007"), hl2 = await chip("Highlights"), cl = await chip("Champions League");
  check(`${tag} Frankreich zaehlt +3 (Ligue 1 x2 inkl. Highlight, Coupe de France)`, fr && !fr.soon && +fr.n === poolStat.fr + 3, JSON.stringify(fr));
  check(`${tag} Niederlande & Portugal zaehlt +2`, nlpt && !nlpt.soon && +nlpt.n === poolStat.nlpt + 2, JSON.stringify(nlpt));
  check(`${tag} Nostalgie zaehlt +2`, nost && !nost.soon && +nost.n === poolStat.nost + 2, JSON.stringify(nost));
  check(`${tag} Highlights zaehlt +1`, hl2 && +hl2.n === hlCount + 1, JSON.stringify(hl2));
  const clBase = await page.evaluate(() => fpPool().filter((m) => m.league === "Champions League" && m.special !== "nostalgie" && !m.id.startsWith("tst-")).length);
  check(`${tag} Champions League enthaelt keine Nostalgie (nur +1)`, +cl.n === clBase + 1, cl.n + " statt " + (clBase + 1));
  const wmBase = await page.evaluate(() => fpPool().filter((m) => ["Weltmeisterschaft", "Confed Cup"].includes(m.league) && m.special !== "nostalgie" && !m.id.startsWith("tst-")).length);
  check(`${tag} WM enthaelt keine Nostalgie`, +(await chip("WM")).n === wmBase, (await chip("WM")).n + " statt " + wmBase);
  const allN = await page.evaluate(() => +document.querySelector("#fpAll .n").textContent);
  check(`${tag} "Alle" ohne Nostalgie (+6)`, allN === alle + 6, allN + " statt " + (alle + 6));
  const poolAll = await page.evaluate(() => poolForActiveLeague().map((m) => m.id));
  check(`${tag} Auslosung ohne Auswahl zieht nie Nostalgie`, !poolAll.some((id) => id.startsWith("tst-nost")) && poolAll.includes("tst-fr1") && poolAll.includes("tst-hl1"));
  // Karten antippen
  await page.evaluate(() => [...document.querySelectorAll("#fpBin .fp-ch")].find((b) => b.querySelector(".nm").textContent.startsWith("Nostalgie")).click());
  const poolNost = await page.evaluate(() => { const p = poolForActiveLeague(); return p.every((m) => m.special === "nostalgie") ? p.map((m) => m.id).filter((id) => id.startsWith("tst-")).sort().join() : "NICHT NUR NOSTALGIE"; });
  check(`${tag} Karte Nostalgie: Pool nur Nostalgie`, poolNost === "tst-nost1,tst-nost2", poolNost);
  check(`${tag} Nostalgie-Karte an, Zaehler`, (await chip("Nostalgie 2000–2007")).on && +(await page.evaluate(() => document.getElementById("fpCnt").textContent)) === poolStat.nost + 2);
  await page.evaluate(() => [...document.querySelectorAll("#fpBin .fp-ch")].find((b) => b.querySelector(".nm").textContent === "Frankreich").click());
  const poolBoth = await page.evaluate(() => poolForActiveLeague().map((m) => m.id).filter((id) => id.startsWith("tst-")).sort().join());
  check(`${tag} Nostalgie + Frankreich kombinierbar`, poolBoth === "tst-fr1,tst-fr2,tst-hl1,tst-nost1,tst-nost2", poolBoth);
  await page.evaluate(() => { selectedLeagues.clear(); [...document.querySelectorAll("#fpBin .fp-ch")].find((b) => b.querySelector(".nm").textContent === "Highlights").click(); });
  const poolHl = await page.evaluate(() => poolForActiveLeague().every((m) => m.special === "highlight") && poolForActiveLeague().length);
  check(`${tag} Highlights: nur gekennzeichnete (${hlCount + 1})`, poolHl === hlCount + 1, poolHl);
  check(`${tag} Ziehungs-Beschriftung Nostalgie`, await page.evaluate(() => fpCompLabel({ special: "nostalgie", league: "Champions League" }) === "Nostalgie" && fpCompLabel({ league: "Ligue 1" }) === "Frankreich" && fpCompLabel({ league: "Liga Portugal" }) === "Niederlande & Portugal"));
  const b1 = await layout();
  check(`${tag} Layout mit allen Karten`, b1.length === 0, b1.join("; "));
  await page.evaluate(() => { selectedLeagues.clear(); paintFpBoard(false); });
  await page.waitForTimeout(200);
  if (shotDir) await page.screenshot({ path: path.join(shotDir, `freispiel_gefuellt_${tag}.png`) });
  check(`${tag} Layout nach Zuruecksetzen`, (await layout()).length === 0);
  check(`${tag} keine Konsolenfehler`, errs.length === 0, errs.slice(0, 2).join(" | "));
  await ctx.close();
}
await browser.close();
console.log(`${total} Pruefungen` + (fails ? `, ${fails} FALSCH` : " OK"));
process.exit(fails ? 1 : 0);
