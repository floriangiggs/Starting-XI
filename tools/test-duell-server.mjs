// Duell ueber den Server (K6b): zwei App-Instanzen (Anna, Ben) sprechen mit EINER echten Datenbank (PGlite mit den Migrationen 0001-0010).
// Prueft: Herausfordern, Einladung, Spielen mit start_round/submit_round, versiegelte Ergebnisse, Abpfiff auf beiden Seiten, XP/Bilanz genau einmal
// (auch nach "Neuinstallation"), Aufgabe, Ablehnen, Zurueckziehen, Ausblenden, Offline-Warteschlange, Fehlermeldungen, Herausfordern aus dem Vergleich.
// Aufruf: node tools/test-duell-server.mjs
import { chromium } from "playwright";
import { PGlite } from "@electric-sql/pglite";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); const f = path.join(root, decodeURIComponent(u.pathname === "/" ? "/startelf_check.html" : u.pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  const ext = path.extname(f); res.writeHead(200, { "Content-Type": { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json" }[ext] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port + "/startelf_check.html";
const shots = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FEHLER:", msg); } };

// ---------- Datenbank ----------
const dbRoot = path.join(root, "supabase");
const db = new PGlite();
await db.exec(fs.readFileSync(path.join(dbRoot, "tests", "shim_supabase.sql"), "utf8"));
for (const f of fs.readdirSync(path.join(dbRoot, "migrations")).sort()) await db.exec(fs.readFileSync(path.join(dbRoot, "migrations", f), "utf8"));
await db.exec(fs.readFileSync(path.join(dbRoot, "seed.sql"), "utf8"));
await db.exec("update public.app_config set value = 0 where key = 'min_seconds_per_correct'; update public.app_config set value = 1000 where key = 'create_duel_per_minute';");
const one = async (sql, params = []) => (await db.query(sql, params)).rows;
let chain = Promise.resolve();
const rpc = (uid, name, args) => {
  const p = chain.then(async () => {
    try {
      await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
      const keys = Object.keys(args || {});
      const r = await db.query(`select public.${name}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as v`, keys.map((k) => { const v = args[k]; return v !== null && typeof v === "object" ? JSON.stringify(v) : v; }));
      return { data: r.rows[0].v, error: null };
    } catch (e) { return { data: null, error: { message: String(e.message || e) } }; }
    finally { await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);"); }
  });
  chain = p.then(() => {}, () => {});
  return p;
};
const U = {};
for (const n of ["anna", "ben", "cora"]) U[n] = (await one("insert into auth.users (email) values ($1) returning id", [n + "@test.de"]))[0].id;
for (const [n, name, col] of [["anna", "anna_kickt", "#C1392B"], ["ben", "ben_bolzt", "#2A5F8F"], ["cora", "cora_xi", "#2E7D52"]]) await rpc(U[n], "claim_username", { p_name: name, p_crest: col, p_legacy: null });
for (const f of ["ben", "cora"]) { await rpc(U.anna, "send_request", { p_user: U[f] }); await rpc(U[f], "answer_request", { p_user: U.anna, p_yes: true }); }
const srv = (sql, p) => one(sql, p);

// ---------- Browser ----------
const browser = await chromium.launch();
async function app(uid, wait = 5500) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 393, height: 852 } });
  const page = await ctx.newPage(); page.errs = []; page.on("pageerror", (e) => page.errs.push(String(e)));
  await page.exposeFunction("__rpc", (name, args) => rpc(uid, name, args));
  await page.addInitScript((uid) => {
    localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}");
    window.DUEL_TEST_SECONDS = 30;
    window.supabase = { createClient: () => ({
      auth: { getSession: async () => ({ data: { session: { user: { id: uid } } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({ error: null }) },
      rpc: async (name, a) => {
        if (name === "get_save") return { data: null, error: null };
        if (name === "put_save") return { data: 1, error: null };
        if (name === "put_public_stats") return { data: null, error: null };
        return window.__rpc(name, a || {});
      } }) };
  }, uid);
  await page.goto(base); await page.waitForTimeout(wait);
  return { ctx, page };
}
const A = await app(U.anna), B = await app(U.ben);
const pa = A.page, pb = B.page;

// eine Runde spielen: n richtige Namen, dann abgeben
async function solve(page, n) {
  await page.evaluate(() => startDuelRound()); await page.waitForTimeout(300);
  await page.evaluate((n) => {
    const r = duelRun, d = profile.duels[r.id], m = dailyMatchById(d.lineups[r.round]);
    [...document.querySelectorAll("#duelPlayView .pos-input")].slice(0, n).forEach((i) => { i.value = m.players[i.dataset.abbr]; i.dispatchEvent(new Event("input", { bubbles: true })); });
  }, n);
  await page.waitForTimeout(1100);
  await page.evaluate(() => document.getElementById("duelGive") && document.getElementById("duelGive").click());
  await page.waitForFunction(() => duelRun && duelRun.phase === "review", null, { timeout: 5000 });
}
async function toWalkout(page) { await page.waitForFunction(() => duelRun && duelRun.phase === "walkout", null, { timeout: 8000 }); }
async function playDuel(page, id, counts) {
  await page.evaluate((id) => startDuelRun(id), id); await toWalkout(page);
  for (let i = 0; i < counts.length; i++) {
    await solve(page, counts[i]);
    await page.evaluate(() => document.getElementById("duelNext").click());
    if (i < counts.length - 1) await toWalkout(page);
  }
  await page.waitForFunction(() => !duelRun && navStack[navStack.length - 1] === "duelresult", null, { timeout: 8000 });
  await page.waitForTimeout(800);
}
const S = (page, id) => page.evaluate((id) => { const d = profile.duels[id]; return d ? { server: d.server, status: d.status, role: d.role, mine: d.mine.length, subm: d.subm, theirs: d.theirs ? d.theirs.length : null, lineups: d.lineups.map((x) => !!x), xp: d.xp || null, result: d.result ? d.result.outcome + ":" + d.result.mw + "-" + d.result.ow : null } : null; }, id);
const sync = (page) => page.evaluate(() => sdSync());
const txt = async (page, sel) => (await page.locator(sel).first().innerText()).replace(/\s+/g, " ");

// 1) Freunde kommen aus der Datenbank, Herausfordern legt ein Duell an
ok(await pa.evaluate(() => online.state === "member" && FR.friends.some((f) => f.username === "ben_bolzt")), "Anna ist angemeldet und kennt Ben");
const cr = await pa.evaluate(async (bid) => sdCreate(bid, { rounds: 3, seconds: 60, difficulty: 0 }), U.ben);
ok(cr.ok && typeof cr.id === "string", "Herausfordern: Duell angelegt (" + JSON.stringify(cr) + ")");
const D1 = cr.id;
const a1 = await S(pa, D1);
ok(a1 && a1.server && a1.role === "challenger" && a1.status === "todo" && a1.mine === 0 && a1.lineups.every((x) => !x), "Anna: Server-Duell gespiegelt, Aufstellungen noch verborgen " + JSON.stringify(a1));
ok((await srv("select count(*)::int n from public.duels where id = $1 and status = 'open'", [D1]))[0].n === 1, "Server: Duell offen");
ok((await srv("select count(*)::int n from public.notification_queue where to_user = $1 and kind = 'duel_challenge'", [U.ben]))[0].n >= 1, "Server: Hinweis an Ben eingereiht");

// 2) Ben sieht die Herausforderung (Abgleich), Zentrale zeigt sie
await sync(pb);
const b1 = await S(pb, D1);
ok(b1 && b1.server && b1.role === "opponent" && b1.status === "todo" && b1.lineups.every((x) => !x), "Ben: Herausforderung angekommen " + JSON.stringify(b1));
await pb.evaluate(() => navigate("duels")); await pb.waitForTimeout(600);
ok(/anna_kickt/.test(await txt(pb, "#duelsView")) && /fordert dich heraus/.test(await txt(pb, "#duelsView")), "Ben: Zentrale zeigt 'fordert dich heraus'");
ok(await pb.evaluate(() => !!document.querySelector(".dz-tk.dz-hot")), "Ben: Ticket 'Du bist dran'");
if (shots) await pb.screenshot({ path: path.join(shots, "ben_zentrale.png") });

// 3) Anna spielt: Aufstellung erst nach Start sichtbar, Abgabe kommt beim Server an
await pa.evaluate((id) => startDuelRun(id), D1); await toWalkout(pa);
ok((await S(pa, D1)).lineups[0] === true && (await S(pa, D1)).lineups[1] === false, "Anna: nach dem Anpfiff nur Runde 1 bekannt");
ok((await srv("select count(*)::int n from public.duel_starts where duel_id = $1 and user_id = $2", [D1, U.anna]))[0].n === 1, "Server: Runde 1 gestartet");
await sync(pb);
ok(await pb.evaluate((id) => profile.duels[id].theirActive === true, D1), "Ben weiss, dass Anna gerade spielt (ohne Ergebnis)");
await solve(pa, 3);
await pa.waitForTimeout(1500);
ok((await srv("select correct, left_app from public.duel_results where duel_id = $1 and user_id = $2 and round = 1", [D1, U.anna])).map((r) => r.correct + ":" + r.left_app).join() === "3:0", "Server: Runde 1 von Anna (3 richtig) angekommen");
ok((await S(pa, D1)).subm === 1, "Anna: Runde als gesendet markiert");
await pa.evaluate(() => document.getElementById("duelNext").click()); await toWalkout(pa);
await solve(pa, 3);
await pa.evaluate(() => document.getElementById("duelNext").click()); await toWalkout(pa);
await solve(pa, 3);
await pa.evaluate(() => document.getElementById("duelNext").click());
await pa.waitForFunction(() => !duelRun && navStack[navStack.length - 1] === "duelresult", null, { timeout: 8000 }); await pa.waitForTimeout(800);
if (shots) await pa.screenshot({ path: path.join(shots, "anna_abpfiff_wartet.png") });
const a2 = await S(pa, D1);
ok(a2.status === "waiting" && a2.mine === 3 && a2.subm === 3 && a2.result === null, "Anna: Abpfiff 'gespielt', alles gesendet " + JSON.stringify(a2));
ok(/Gespielt!/.test(await txt(pa, "#duelResultView")) && /ben_bolzt ist dran/.test(await txt(pa, "#duelResultView")) && (await pa.locator("#duelResSend").count()) === 0, "Anna: Abpfiff zeigt Warten ohne Link-Teilen");
ok(a2.xp && a2.xp.rounds === 45 && (await pa.evaluate((id) => profile.duelsPaid.includes("r:" + id), D1)), "Anna: Rundenbonus (45 XP) einmal vergeben und gemerkt");
// Rundenbonus nur fuer wirklich gespielte Runden: Abbruch, Verlassen und 0 Richtige geben keine XP
const xr = await pa.evaluate(() => [
  duelXPRounds({ mine: [{ correct: 3, left: 0 }, { correct: 0, left: 0 }, { correct: 2, left: 1 }, { correct: 1 }] }),
  duelXPRounds({ mine: [{ correct: 0, left: 1 }, { correct: 0, left: 0 }, { correct: 0, left: 0 }] }),
  duelXPRounds({ mine: [] })]);
ok(xr[0] === 2 && xr[1] === 0 && xr[2] === 0, "Rundenbonus nur fuer gespielte Runden (nicht verlassen, mind. 1 richtig)", JSON.stringify(xr));

// 4) Versiegelung: Ben sieht Annas Ergebnisse nicht, bis er selbst spielt
await sync(pb);
ok((await S(pb, D1)).theirs === null, "Ben: Annas Runden sind verdeckt");
await pb.evaluate((id) => startDuelRun(id), D1); await toWalkout(pb);
await solve(pb, 5);
await pb.waitForTimeout(1800);
ok(await pb.evaluate((id) => { const d = profile.duels[id]; return !!(d.theirs && d.theirs.length === 1 && d.theirs[0].correct === 3); }, D1), "Ben: nach seiner Runde 1 ist Annas Runde 1 sichtbar (3)");
ok(/Stand/.test(await txt(pb, "#duelPlayView")) && /3/.test(await txt(pb, "#duelPlayView")), "Ben: Zwischenkarte zeigt den Stand sofort");
await pb.evaluate(() => document.getElementById("duelNext").click()); await toWalkout(pb);
await solve(pb, 2);
await pb.evaluate(() => document.getElementById("duelNext").click()); await toWalkout(pb);
await solve(pb, 4);
await pb.evaluate(() => document.getElementById("duelNext").click());
await pb.waitForFunction(() => !duelRun && navStack[navStack.length - 1] === "duelresult", null, { timeout: 8000 }); await pb.waitForTimeout(1200);
if (shots) await pb.screenshot({ path: path.join(shots, "ben_abpfiff_sieg.png") });
const b2 = await S(pb, D1);
ok(b2.status === "done" && b2.result === "win:2-1", "Ben: Sieg 2:1 " + JSON.stringify(b2));
ok(/Sieg!/.test(await txt(pb, "#duelResultView")), "Ben: Abpfiff 'Sieg!'");
ok(b2.xp && b2.xp.rounds === 45 && b2.xp.win === 40, "Ben: 45 XP Runden + 40 XP Sieg");
ok((await srv("select status, result->>'winner' w from public.duels where id = $1", [D1]))[0].w === U.ben, "Server: Sieger Ben");

// 5) Anna bekommt das Ergebnis beim Abgleich - Bilanz/XP genau einmal
const xpA0 = await pa.evaluate(() => profile.totalXP);
await sync(pa); await pa.waitForTimeout(500);
const a3 = await S(pa, D1);
ok(a3.status === "done" && a3.result === "loss:1-2", "Anna: Niederlage 1:2 nach dem Abgleich " + JSON.stringify(a3));
const st1 = await pa.evaluate(() => JSON.stringify([profile.duelStats.wins, profile.duelStats.losses, profile.duelStats.draws]));
ok(st1 === "[0,1,0]", "Anna: Bilanz 0-1-0 (" + st1 + ")");
await sync(pa); await sync(pa);
ok(await pa.evaluate(() => JSON.stringify([profile.duelStats.wins, profile.duelStats.losses, profile.duelStats.draws])) === "[0,1,0]", "Anna: weiterer Abgleich zaehlt nichts doppelt");
ok((await pa.evaluate(() => profile.totalXP)) === xpA0, "Anna: keine zusaetzliche XP beim Abgleich");

// 6) Gleiches Duell auf einem 'neuen Geraet': Duelle weg, Bezahlt-Liste bleibt (wird mit dem Spielstand synchronisiert) -> nichts doppelt
const before = await pa.evaluate(() => ({ xp: profile.totalXP, stats: JSON.stringify(profile.duelStats) }));
await pa.evaluate(() => { profile.duels = {}; profile.duelsDeleted = []; saveProfile(profile); });
await sync(pa); await pa.waitForTimeout(500);
const after = await pa.evaluate(() => ({ xp: profile.totalXP, stats: JSON.stringify(profile.duelStats), n: Object.keys(profile.duels).length }));
ok(after.n === 1 && after.xp === before.xp && after.stats === before.stats, "Neues Geraet: Duell kommt zurueck, XP und Bilanz bleiben gleich");

// 7) Revanche aus dem Abpfiff
await pb.evaluate((id) => { activeResultId = id; renderDuelResult(); }, D1);
await pb.evaluate(() => document.getElementById("duelResRematch").click());
await toWalkout(pb);
const rematch = (await srv("select id, created_by from public.duels where status = 'open' order by created_at desc limit 1"))[0];
ok(rematch.created_by === U.ben, "Revanche: neues Duell von Ben gegen Anna");
await pb.evaluate(() => abortDuelRun()); await pb.waitForTimeout(1500);
ok((await srv("select count(*)::int n from public.duel_results where duel_id = $1 and user_id = $2", [rematch.id, U.ben]))[0].n === 3, "Aufgeben: alle 3 Runden zaehlen (0 Richtige) beim Server");
ok((await srv("select bool_and(correct = 0) ok from public.duel_results where duel_id = $1 and user_id = $2", [rematch.id, U.ben]))[0].ok === true, "Aufgeben: 0 Richtige");

// 8) Ablehnen
const dDec = (await pa.evaluate(async (bid) => sdCreate(bid, { rounds: 1, seconds: 60, difficulty: 0 }), U.ben)).id;
await sync(pb);
await pb.evaluate((id) => { activeInviteId = id; navigate("duelinvite"); }, dDec); await pb.waitForTimeout(500);
ok(!(await pb.locator("#duelPathBrowser").count()) && /Aufstellung erfährst du erst beim Anpfiff/.test(await txt(pb, "#duelInviteView")), "Einladung: kein Browser/App-Weg, Hinweis auf spaete Aufstellung");
await pb.click("#duelDecline"); await pb.waitForTimeout(1200);
ok((await srv("select status from public.duels where id = $1", [dDec]))[0].status === "declined", "Server: abgelehnt");
ok(await pb.evaluate((id) => !profile.duels[id], dDec), "Ben: Einladung weg");
await sync(pa);
ok(await pa.evaluate((id) => !profile.duels[id], dDec), "Anna: abgelehntes Duell verschwindet");

// 9) Zurueckziehen (Loeschen, Gegner hat nicht gespielt)
const dCan = (await pa.evaluate(async (bid) => sdCreate(bid, { rounds: 1, seconds: 60, difficulty: 0 }), U.ben)).id;
await sync(pb);
ok(await pb.evaluate((id) => !!profile.duels[id], dCan), "Ben sieht das neue Duell");
await pa.evaluate((id) => duelDelete(id), dCan); await pa.waitForTimeout(1200);
ok((await srv("select status from public.duels where id = $1", [dCan]))[0].status === "cancelled", "Server: zurueckgezogen");
await sync(pb);
ok(await pb.evaluate((id) => !profile.duels[id], dCan), "Ben: zurueckgezogenes Duell verschwindet");

// 10) Beendetes Duell ausblenden - kommt nicht wieder
await pb.evaluate((id) => duelDelete(id), D1); await pb.waitForTimeout(1000);
ok((await srv("select $1::uuid = any (hidden_by) h from public.duels where id = $2", [U.ben, D1]))[0].h === true, "Server: Duell fuer Ben ausgeblendet");
await sync(pb);
ok(await pb.evaluate((id) => !profile.duels[id], D1), "Ben: ausgeblendetes Duell bleibt weg");
ok(await pa.evaluate((id) => !!profile.duels[id], D1), "Anna: sieht das Duell weiterhin");

// 11) Offline: Runde wird lokal gespielt, spaeter automatisch gesendet
const dOff = (await pa.evaluate(async (cid) => sdCreate(cid, { rounds: 1, seconds: 60, difficulty: 0 }), U.cora)).id;
await pa.evaluate((id) => startDuelRun(id), dOff); await toWalkout(pa);
await pa.evaluate(() => { Object.defineProperty(navigator, "onLine", { get: () => false, configurable: true }); });
await solve(pa, 4); await pa.waitForTimeout(600);
const off1 = await S(pa, dOff);
ok(off1.mine === 1 && off1.subm === 0, "Offline: Runde lokal gespeichert, noch nicht gesendet " + JSON.stringify(off1));
ok((await srv("select count(*)::int n from public.duel_results where duel_id = $1", [dOff]))[0].n === 0, "Offline: beim Server noch nichts");
await pa.evaluate(() => { Object.defineProperty(navigator, "onLine", { get: () => true, configurable: true }); });
await pa.evaluate(() => sdFlush()); await pa.waitForTimeout(800);
ok((await S(pa, dOff)).subm === 1 && (await srv("select correct from public.duel_results where duel_id = $1 and user_id = $2", [dOff, U.anna]))[0].correct === 4, "Wieder online: Runde wird nachgesendet (4 richtig)");
await pa.evaluate(() => { duelRun && (clearInterval(duelRun.tick), duelRun = null); navigate("start"); });

// 12) Fehlermeldungen: Grenze je Freundespaar
await db.exec("update public.duels set status = 'cancelled' where status = 'open'");
await pa.evaluate(async (bid) => { for (let i = 0; i < 3; i++) await sdCreate(bid, { rounds: 1, seconds: 60, difficulty: 0 }); }, U.ben);
const lim = await pa.evaluate(async (bid) => sdCreate(bid, { rounds: 1, seconds: 60, difficulty: 0 }), U.ben);
ok(!lim.ok && /drei Duelle/.test(lim.message), "Meldung bei zu vielen Duellen mit einem Freund (" + (lim && lim.message) + ")");

// 13) Herausfordern aus dem Vergleich: Blatt mit vorgewaehltem Freund
await db.exec("update public.duels set status = 'cancelled' where status = 'open'");
await pa.evaluate(() => { navigate("start"); }); await pa.waitForTimeout(300);
await pa.evaluate(() => kabineOpenCompare(FR.friends.find((f) => f.username === "ben_bolzt"))); await pa.waitForTimeout(800);
await pa.click("#cmChallenge"); await pa.waitForTimeout(1200);
ok(await pa.evaluate((bid) => { const b = document.querySelector('.dz-sheet [data-fr="s:' + bid + '"]'); return !!b && b.getAttribute("aria-pressed") === "true"; }, U.ben), "Vergleich: 'Herausfordern' oeffnet das Blatt mit Ben vorgewaehlt");

if (shots) await pa.screenshot({ path: path.join(shots, "anna_herausfordern.png") });
// 13b) K6c: Code einfuegen nur noch als Notweg in der Kabine (Mitglieder), Offline-Hinweis in der Zentrale
await pa.evaluate(() => { dzCloseSheet(); navigate("start"); }); await pa.waitForTimeout(400);
await pa.evaluate(() => navigate("duels")); await pa.waitForTimeout(600);
ok((await pa.locator("#duelPasteToggle").count()) === 0, "Mitglied: Zentrale hat kein 'Code einfügen' mehr");
await pa.evaluate(() => { Object.defineProperty(navigator, "onLine", { get: () => false, configurable: true }); renderDuels(true); });
ok(/Du bist offline/.test(await txt(pa, "#duelsView")), "Offline: Zentrale zeigt den Hinweis");
await pa.evaluate(() => { Object.defineProperty(navigator, "onLine", { get: () => true, configurable: true }); renderDuels(true); });
ok(!/Du bist offline/.test(await txt(pa, "#duelsView")), "Online: Hinweis weg");
const code = await pb.evaluate(() => { const id = createDuel({ rounds: 1, seconds: 60, difficulty: 1 }); return duelChallengeCode(id); });
await pa.evaluate(() => navigate("start")); await pa.waitForTimeout(300);
await pa.click("#kbLogo"); await pa.waitForTimeout(700);
ok((await pa.locator("#kbCode").count()) === 1, "Kabine: 'Duell-Code einlösen' für Mitglieder");
await pa.click("#kbCode"); await pa.waitForTimeout(900);
await pa.fill("#kcInput", "kein code"); await pa.click("#kcGo"); await pa.waitForTimeout(300);
ok((await txt(pa, "#kcMsg")).length > 5, "Notweg: ungültiger Code -> Meldung");
await pa.fill("#kcInput", code); await pa.click("#kcGo"); await pa.waitForTimeout(900);
ok(await pa.evaluate(() => navStack[navStack.length - 1] === "duelinvite"), "Notweg: gültiger Code öffnet die Einladung (Link-Duell)");
ok(await pa.evaluate(() => Object.values(profile.duels).some((d) => !d.server && d.role === "opponent")), "Notweg: Link-Duell wird lokal angelegt (Gast-Duell bleibt möglich)");

// 14) Keine Skriptfehler
ok(pa.errs.length === 0 && pb.errs.length === 0, "Keine Skriptfehler (" + [...pa.errs, ...pb.errs].join(" | ") + ")");

await browser.close(); server.close();
console.log(fails ? `\n${fails} FEHLER von ${checks} Pruefungen` : `OK - ${checks} Server-Duell-Pruefungen bestanden`);
process.exit(fails ? 1 : 0);
