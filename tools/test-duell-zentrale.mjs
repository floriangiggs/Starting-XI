// Duell-Zentrale (Prompt 54 Paket D): Pass, Sprungleiste, Kacheln, Am Zug (hot/wait/abgelaufen), Historie (Sieg/Niederlage/Remis, Detail),
// Freunde & Trophaeen, Code einfuegen, Schnell-Duell-Blatt, Loeschen + Rueckgaengig. Layout 393x852 + 375x667.
// Aufruf: node tools/test-duell-zentrale.mjs [--shots <ordner>]
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
  const tag = `${w}x${h}`;
  await page.evaluate(() => {
    profile.duelName = "Florian"; profile.duelHandle = "florian"; profile.level = 12; saveProfile(profile);
    const R = (c, s) => ({ correct: c, seconds: s, left: 0 }), O = (n, id, hd) => ({ name: n, deviceId: id, handle: hd, rank: "Bundesliga", level: 14 });
    const mk = (opp, role, mine, theirs, st, extra = {}) => { const id = createDuel({ rounds: 3, seconds: 120, difficulty: 0 }), d = profile.duels[id]; d.opponent = opp; d.role = role; d.mine = mine; d.theirs = theirs; d.status = st; d.playedRounds = mine.length; Object.assign(d, extra); return id; };
    mk(O("Lisa", "l1", "lisa_kickt"), "challenger", [R(6, 95)], null, "todo");                // Du bist dran (Runde 2)
    mk(O("Tim", "t1", "timbo_10"), "opponent", [], [R(7, 80), R(8, 100), R(5, 90)], "todo");   // Einladung
    mk(O("Kai", "k1", "kai_bolzt"), "challenger", [R(6, 95), R(9, 100), R(8, 110)], null, "waiting"); // wartet
    mk(null, "challenger", [R(6, 95), R(9, 100), R(8, 110)], null, "waiting", { label: "Duell an Opa", updated: Date.now() - 20 * 86400000, created: Date.now() - 20 * 86400000 }); // abgelaufen
    const d1 = mk(O("Lisa", "l1", "lisa_kickt"), "challenger", [R(9, 90), R(8, 100), R(7, 110)], [R(7, 90), R(6, 100), R(7, 120)], "todo"); evaluateDuel(d1);
    const d2 = mk(O("Tim", "t1", "timbo_10"), "challenger", [R(5, 90), R(6, 100), R(7, 110)], [R(8, 90), R(9, 100), R(7, 100)], "todo"); evaluateDuel(d2);
    const d3 = mk(O("Kai", "k1", "kai_bolzt"), "challenger", [R(7, 90), R(7, 100), R(6, 100)], [R(7, 90), R(7, 100), R(6, 100)], "todo"); evaluateDuel(d3);
    navStack.length = 0; navigate("start");
  });
  await page.waitForTimeout(400); await page.evaluate(() => navigate("duels")); await page.waitForTimeout(800);
  const probe = () => page.evaluate(() => {
    const r = document.getElementById("duelsView"), body = r.querySelector(".du-body");
    const txt = r.innerText;
    return { screen: navStack[navStack.length - 1], pass: !!r.querySelector(".dz-pass"), passName: (r.querySelector(".dz-pass .who b") || {}).textContent, snav: r.querySelectorAll("#dzSnav button").length, hotN: (r.querySelector(".dz-n") || {}).textContent,
      modes: r.querySelectorAll(".dz-mode").length, hot: r.querySelectorAll(".dz-tk.dz-hot").length, wait: r.querySelectorAll(".dz-tk.dz-wait").length, exp: r.querySelectorAll(".dz-tk.dz-exp").length,
      go: [...r.querySelectorAll(".dz-go")].map((e) => e.textContent), hist: r.querySelectorAll(".dz-hc").length, res: [...r.querySelectorAll(".dz-hc .dz-res")].map((e) => e.innerText.replace(/\s+/g, " ")),
      troph: r.querySelectorAll(".dz-tr").length, trophOn: r.querySelectorAll(".dz-tr:not(.off)").length, frow: r.querySelectorAll(".dz-frow").length, ranked: !!r.querySelector(".dz-plank"), code: !!r.querySelector("#duelPasteToggle"),
      emoji: /[\u{1F300}-\u{1FAFF}☀-➿←-⇿]/u.test(txt), overX: document.documentElement.scrollWidth > innerWidth + 1, bodyOverX: body.scrollWidth > body.clientWidth + 1,
      redLoss: [...r.querySelectorAll(".dz-hc.dz-l .dz-res")].some((e) => /rgb\((1[89]\d|2\d\d), \d+, \d+\)/.test(getComputedStyle(e).backgroundColor) && !/(122|107)/.test(getComputedStyle(e).backgroundColor)),
      bg: getComputedStyle(document.getElementById("screen-duels")).backgroundImage.slice(0, 40), top: !!r.querySelector(".lv-top #dzBack") };
  });
  let s = await probe();
  check(`${tag}: Screen + Pass`, s.screen === "duels" && s.pass && s.passName === "Florian", JSON.stringify([s.screen, s.pass, s.passName]));
  check(`${tag}: Sprungleiste + Zähler`, s.snav === 3 && s.hotN === "2", JSON.stringify([s.snav, s.hotN]));
  check(`${tag}: Kacheln, Ranked, Code`, s.modes === 2 && s.ranked && s.code);
  check(`${tag}: Tickets hot/wait/exp`, s.hot === 2 && s.wait === 1 && s.exp === 1, JSON.stringify([s.hot, s.wait, s.exp]));
  check(`${tag}: Spielen/Ansehen`, s.go.includes("Spielen") && s.go.includes("Ansehen"), JSON.stringify(s.go));
  check(`${tag}: Historie 3 (Sieg/Niederlage/Remis)`, s.hist === 3 && s.res.some((t) => /Sieg/.test(t)) && s.res.some((t) => /Niederlage/.test(t)) && s.res.some((t) => /Remis/.test(t)), JSON.stringify(s.res));
  check(`${tag}: Freunde 3, Trophäen 4 (2 gewonnen)`, s.frow === 3 && s.troph === 4 && s.trophOn >= 1, JSON.stringify([s.frow, s.troph, s.trophOn]));
  check(`${tag}: kein Emoji/Pfeil-Zeichen, kein Überlauf`, !s.emoji && !s.overX && !s.bodyOverX, JSON.stringify([s.emoji, s.overX, s.bodyOverX]));
  check(`${tag}: Kopfzeile mit Zurück`, s.top);
  if (shots) {
    await page.screenshot({ path: path.join(shots, `zentrale_oben_${w}.png`) });
    await page.evaluate(() => document.querySelector("#duelsView .du-body").scrollTo(0, 560)); await page.waitForTimeout(300); await page.screenshot({ path: path.join(shots, `zentrale_mitte_${w}.png`) });
    await page.evaluate(() => document.querySelector("#duelsView .du-body").scrollTo(0, 99999)); await page.waitForTimeout(300); await page.screenshot({ path: path.join(shots, `zentrale_unten_${w}.png`) });
    await page.evaluate(() => document.querySelector("#duelsView .du-body").scrollTo(0, 0));
  }
  // Sprungleiste scrollt
  await page.click('#dzSnav button[data-s="hist"]'); await page.waitForTimeout(400);
  check(`${tag}: Sprung zu Historie scrollt`, await page.evaluate(() => document.querySelector("#duelsView .du-body").scrollTop > 100));
  // Historie aufklappen
  await page.evaluate(() => document.querySelector("#duelsView .du-body").scrollTo(0, 0));
  await page.click(".dz-hc.dz-w .dz-hc-row"); await page.waitForTimeout(900);
  const det = await page.evaluate(() => ({ open: !!document.querySelector(".dz-hc.dz-open .dz-det"), flip: document.querySelectorAll(".dz-hc.dz-open .dz-flip b").length, rt: document.querySelectorAll(".dz-hc.dz-open .dz-rtab").length, rev: !!document.querySelector(".dz-hc.dz-open [data-rev]"), cta: !!document.querySelector(".dz-hc.dz-open .du-cta") }));
  check(`${tag}: Detail klappt auf (Anzeigetafel, Runden-Reiter, Revanche)`, det.open && det.flip >= 2 && det.rt === 3 && det.rev && det.cta, JSON.stringify(det));
  if (shots) { await page.screenshot({ path: path.join(shots, `zentrale_detail_${w}.png`) }); }
  await page.click(".dz-hc.dz-w .dz-hc-row"); await page.waitForTimeout(700);
  // Neues-Duell-Blatt
  await page.evaluate(() => document.querySelector("#duelsView .du-body").scrollTo(0, 0));
  await page.click(".lv-top [data-new]"); await page.waitForTimeout(800);
  let sh = await page.evaluate(() => { const sheet = document.querySelector(".dz-sheet"), cta = sheet && sheet.querySelector("#dzSend"); return { open: !!sheet, in: !!(sheet && sheet.querySelector(".in")), friends: sheet ? sheet.querySelectorAll(".dz-friend").length : 0, mags: sheet ? sheet.querySelectorAll(".dz-friend .du-mag").length : 0, seg: sheet ? sheet.querySelectorAll(".dz-seg").length : 0, cta: cta && cta.textContent.trim(), off: cta && cta.getAttribute("aria-disabled"), sum: (sheet.querySelector("#dzSum") || {}).textContent, x: !!sheet.querySelector(".sheet-x"), bottom: sheet.getBoundingClientRect().bottom <= innerHeight + 1, emoji: /[\u{1F300}-\u{1FAFF}☀-➿]/u.test(sheet.innerText) }; });
  check(`${tag}: Blatt offen mit Filz, Magnet-Chips, 3 Segmente`, sh.open && sh.in && sh.friends >= 3 && sh.mags >= 2 && sh.seg === 3 && sh.x && sh.bottom && !sh.emoji, JSON.stringify(sh));
  check(`${tag}: Blatt gesperrt bis fair`, sh.off === "true" && /Erst „Ich spiele fair“ antippen/.test(sh.cta || ""), sh.cta);
  if (shots) await page.screenshot({ path: path.join(shots, `blatt_aus_${w}.png`) });
  await page.click("#dzFair"); await page.waitForTimeout(250);
  sh = await page.evaluate(() => { const c = document.querySelector("#dzSend"); return { off: c.getAttribute("aria-disabled"), t: c.textContent.trim(), sum: document.querySelector("#dzSum").textContent }; });
  check(`${tag}: Fair an -> Anpfiff & Link teilen + Zusammenfassung`, sh.off === "false" && /Anpfiff/.test(sh.t) && /Aufstellungen/.test(sh.sum), JSON.stringify(sh));
  if (shots) await page.screenshot({ path: path.join(shots, `blatt_an_${w}.png`) });
  await page.keyboard.press("Escape"); await page.waitForTimeout(600);
  check(`${tag}: Blatt schließt per Escape`, await page.evaluate(() => !document.querySelector(".dz-sheet")));
  // Info-Blatt Ranked
  await page.evaluate(() => document.querySelector("#duelsView .du-body").scrollTo(0, 99999)); await page.click(".dz-plank"); await page.waitForTimeout(700);
  check(`${tag}: Ranked-Blatt`, await page.evaluate(() => !!document.querySelector(".dz-sheet .du-cta")));
  await page.click("#dzInfoOk"); await page.waitForTimeout(500);
  // Löschen + Rückgängig über Menü
  await page.evaluate(() => document.querySelector("#duelsView .du-body").scrollTo(0, 0));
  const nBefore = await page.evaluate(() => Object.keys(profile.duels).length);
  await page.click(".dz-tk.dz-wait [data-menu]"); await page.waitForTimeout(300);
  check(`${tag}: Menü mit Löschen`, await page.evaluate(() => !!document.querySelector(".dz-menu [data-m=del]")));
  await page.click(".dz-menu [data-m=del]"); await page.waitForTimeout(600);
  check(`${tag}: Gelöscht + Rückgängig-Hinweis`, await page.evaluate((n) => Object.keys(profile.duels).length === n - 1 && !!document.querySelector(".dz-toast button"), nBefore));
  await page.click(".dz-toast button"); await page.waitForTimeout(600);
  check(`${tag}: Rückgängig stellt wieder her`, await page.evaluate((n) => Object.keys(profile.duels).length === n, nBefore));
  // Ticket antippen -> Einladung
  await page.click(".dz-tk.dz-hot:has(.dz-go:text('Ansehen'))"); await page.waitForTimeout(700);
  check(`${tag}: Ansehen öffnet Einladung`, await page.evaluate(() => navStack[navStack.length - 1] === "duelinvite"));
  await page.evaluate(() => goBack()); await page.waitForTimeout(500);
  // Code einfügen
  await page.evaluate(() => document.querySelector("#duelsView .du-body").scrollTo(0, 99999)); await page.click("#duelPasteToggle"); await page.waitForTimeout(200);
  await page.fill("#duelPasteInput", "kaputt"); await page.click("#duelPasteGo"); await page.waitForTimeout(200);
  check(`${tag}: Code einfügen zeigt Fehlermeldung`, await page.evaluate(() => document.getElementById("duelPasteMsg").textContent.length > 5));
  check(`Konsolenfehler ${tag}`, !errs.length, errs.join("|"));
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} von ${total} FALSCH` : `OK - ${total} Zentrale-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
