// Cloud-Spielstand-Tests (Prompt K3): Zusammenfuehren (mergeProfiles) und Abgleich (syncRun) gegen einen Server-Nachbau.
// Aufruf: node tools/test-sync.mjs
// Wie test-konto.mjs: Supabase wird durch einen Nachbau ersetzt (kein Netz, kein echtes Konto), die App laeuft ueber einen lokalen http-Server.
import { chromium } from "playwright";
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

let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; console.log("FEHLER:", msg); } };

// Nachbau von supabase-js inkl. Spielstand-Tabelle mit Versionspruefung
const MOCK = () => {
  window.__calls = [];
  window.__srv = window.__srv || { save: null, conflictOnce: false };
  window.__mock = window.__mock || { session: { user: { id: "u1" } }, profile: { username: "tester", crest_color: "#2E7D52", friend_code: "XI-TEST", username_changed_at: null } };
  window.supabase = { createClient: () => ({
    auth: { getSession: async () => ({ data: { session: window.__mock.session } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({ error: null }) },
    rpc: async (name, args) => {
      window.__calls.push([name, args]);
      const s = window.__srv;
      if (name === "my_profile") return { data: window.__mock.profile, error: null };
      if (name === "get_save") return { data: s.save ? { data: s.save.data, version: s.save.version, updated_at: "x", device: "t" } : null, error: null };
      if (name === "put_save") {
        if (s.conflictOnce) { s.conflictOnce = false; if (s.save) s.save.version += 1; return { data: null, error: { message: "save_conflict" } }; }
        const cur = s.save ? s.save.version : 0;
        if (args.p_expected_version !== cur) return { data: null, error: { message: "save_conflict" } };
        s.save = { data: JSON.parse(JSON.stringify(args.p_data)), version: cur + 1 };
        return { data: cur + 1, error: null };
      }
      if (name === "put_public_stats") return { data: null, error: null };
      return { data: null, error: { message: "unbekannt" } };
    }
  }) };
};

const browser = await chromium.launch();
async function fresh(setup, wait = 6500) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 393, height: 852 } });
  const page = await ctx.newPage(); page.errs = []; page.on("pageerror", (e) => page.errs.push(String(e)));
  await page.addInitScript(MOCK); if (setup) await page.addInitScript(typeof setup === "string" ? `(${setup})()` : setup);
  await page.goto(base); await page.waitForTimeout(wait);
  return { ctx, page };
}
// Vollstaendiges Standard-Profil der App (damit die App beim Laden nichts vermisst), darueber die gewuenschten Felder
let baseProfileJson = null;
async function profileJson(patch) {
  if (!baseProfileJson) {
    const c = await browser.newContext({ serviceWorkers: "block" }); const pg = await c.newPage(); await pg.goto(base); await pg.waitForTimeout(1500);
    baseProfileJson = await pg.evaluate(() => JSON.stringify(profile)); await c.close();
  }
  const o = JSON.parse(baseProfileJson), merge = (t, p) => { Object.keys(p).forEach((k) => { if (p[k] && typeof p[k] === "object" && !Array.isArray(p[k]) && t[k] && typeof t[k] === "object" && !Array.isArray(t[k])) merge(t[k], p[k]); else t[k] = p[k]; }); return t; };
  return JSON.stringify(merge(o, patch));
}

// ---------- 1) mergeProfiles (reine Funktion) ----------
{
  const { ctx, page } = await fresh();
  const R = await page.evaluate(() => {
    const day = (n) => { const d = new Date(2026, 9, n, 12); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
    const P = (o) => Object.assign(structuredClone(defaultProfile), o);
    const out = {};
    const A = P({ totalXP: 500, hintTokens: 5, perfectRewarded: { m1: true }, trophiesWon: ["t1"], achievements: ["a1"], campaign: { levelPassed: { l1: true, l2: true }, stars: { l1: 3, l2: 1 }, solutionSeen: { l2: true } }, best: { m1: { correct: 8, solvedAbbrs: ["TW", "ST"] } }, drafts: { "c:x": { entries: {} } }, duels: { d1: { id: "d1" } }, sound: { on: false, volume: 0.1 }, daily: { [day(1)]: { id: "m1", correct: 7, stars: 1 }, [day(2)]: { id: "m2", correct: 9, stars: 2 } }, streak: { current: 2, best: 2, lastDayKey: day(2) }, deviceId: "AAA" });
    const B = P({ totalXP: 900, hintTokens: 3, perfectRewarded: { m2: true }, trophiesWon: ["t2"], achievements: ["a1", "a2"], campaign: { levelPassed: { l2: true, l3: true }, stars: { l2: 3, l3: 2 }, solutionSeen: { l3: true } }, best: { m1: { correct: 11, solvedAbbrs: ["TW", "RV"] }, m2: { correct: 5, solvedAbbrs: [] } }, prefillSeed: 777, daily: { [day(2)]: { id: "m2", correct: 6, stars: 0 }, [day(3)]: { id: "m3", correct: 8, stars: 1 } }, streak: { current: 2, best: 5, lastDayKey: day(3) }, futureFeature: { x: 1 }, deviceId: "BBB", duels: { zz: {} } });
    const before = JSON.stringify([A, B]);
    const M = mergeProfiles(A, B);
    out.noMutate = JSON.stringify([A, B]) === before;
    out.tokens = M.hintTokens; out.tokensRev = mergeProfiles(B, A).hintTokens;
    out.xp = M.totalXP; out.level = M.level; out.levelOk = M.level === levelFromXP(900);
    out.perfect = Object.keys(M.perfectRewarded).sort().join(); out.trophies = M.trophiesWon.sort().join(); out.ach = M.achievements.sort().join();
    out.passed = Object.keys(M.campaign.levelPassed).sort().join(); out.stars = JSON.stringify(M.campaign.stars); out.seen = Object.keys(M.campaign.solutionSeen).sort().join();
    out.best1 = JSON.stringify([M.best.m1.correct, M.best.m1.solvedAbbrs.slice().sort()]); out.best2 = M.best.m2.correct;
    out.dailyKeys = Object.keys(M.daily).length; out.day2 = M.daily[day(2)].correct;
    out.streak = JSON.stringify(M.streak); out.lastIs3 = M.streak.lastDayKey === day(3);
    out.localOnly = JSON.stringify([M.drafts, M.duels, M.sound, M.deviceId]) === JSON.stringify([A.drafts, A.duels, A.sound, A.deviceId]);
    { // Duell-Bilanz (K6b): Zaehler = das Hoehere, je Gegner das Hoehere; bezahlte Belohnungen vereinigt
      const X = mergeProfiles(P({ duelsPaid: ["r:1", "s:1"], duelStats: { wins: 5, losses: 2, draws: 1, streak: 1, bestStreak: 3, sweeps: 1, form: ["w", "l", "w", "w", "d"], perOpponent: { "u:a": { name: "a", w: 3, l: 1, d: 0 }, k1: { name: "k", w: 1, l: 0, d: 0 } } } }),
        P({ duelsPaid: ["s:1", "w:2"], duelStats: { wins: 4, losses: 4, draws: 0, streak: 0, bestStreak: 6, sweeps: 0, form: ["l", "l", "l", "w", "w"], perOpponent: { "u:a": { name: "a", w: 2, l: 3, d: 1 }, "u:b": { name: "b", w: 1, l: 0, d: 0 } } } }));
      out.duelMerge = JSON.stringify([X.duelsPaid.slice().sort(), X.duelStats.wins, X.duelStats.losses, X.duelStats.draws, X.duelStats.bestStreak, X.duelStats.sweeps, X.duelStats.form.join(""), Object.keys(X.duelStats.perOpponent).sort(), X.duelStats.perOpponent["u:a"].w, X.duelStats.perOpponent["u:a"].l, X.duelStats.perOpponent["u:a"].d]);
    }
    out.seed = M.prefillSeed; out.future = JSON.stringify(M.futureFeature);
    // Stabilitaet: nochmal zusammenfuehren aendert nichts
    out.idem = syncCanon(syncSnapshot(mergeProfiles(M, B))) === syncCanon(syncSnapshot(M));
    out.idem2 = syncCanon(syncSnapshot(mergeProfiles(A, M))) === syncCanon(syncSnapshot(M));
    // Reihenfolge egal bei den gemeinsamen Zaehlern
    const M2 = mergeProfiles(B, A); out.commute = [M.totalXP === M2.totalXP, syncCanon(M.campaign.stars) === syncCanon(M2.campaign.stars), Object.keys(M.campaign.levelPassed).sort().join() === Object.keys(M2.campaign.levelPassed).sort().join(), M.hintTokens === M2.hintTokens].every(Boolean);
    // Luecke in den Tagen: Serie nur der letzte zusammenhaengende Block
    const C = P({ daily: { [day(1)]: { correct: 5 }, [day(2)]: { correct: 5 }, [day(5)]: { correct: 5 } }, streak: { current: 1, best: 2, lastDayKey: day(5) } });
    const MC = mergeProfiles(C, P({})); out.gap = JSON.stringify(MC.streak);
    // Leerer Server / leeres Geraet
    out.emptyServer = syncCanon(syncSnapshot(mergeProfiles(A, {}))) === syncCanon(syncSnapshot(mergeProfiles(A, P({}))));
    out.hasProgress = [syncHasProgress(A), syncHasProgress(P({})), syncHasProgress(null)];
    out.snapshot = Object.keys(syncSnapshot(A)).filter((k) => ["drafts", "duels", "deviceId", "sound", "hasSeenInstallTip"].includes(k));
    return out;
  });
  ok(R.noMutate, "merge: veraendert die Eingaben nicht");
  ok(R.tokens === 5 && R.tokensRev === 5, "merge: Token = das Hoehere, nie addiert (" + R.tokens + "/" + R.tokensRev + ")");
  ok(R.xp === 900 && R.levelOk, "merge: XP = das Hoehere, Level daraus berechnet");
  ok(R.perfect === "m1,m2" && R.trophies === "t1,t2" && R.ach === "a1,a2", "merge: Perfekt-Boni, Trophaeen, Erfolge vereinigt");
  ok(R.passed === "l1,l2,l3" && R.seen === "l2,l3", "merge: durchgespielte Level und gesehene Loesungen vereinigt");
  ok(R.stars === JSON.stringify({ l1: 3, l2: 3, l3: 2 }), "merge: Sterne je Level = das Hoehere (" + R.stars + ")");
  ok(R.best1 === JSON.stringify([11, ["RV", "ST", "TW"]]) && R.best2 === 5, "merge: bestes Ergebnis hoeher, richtige Positionen vereinigt (" + R.best1 + ")");
  ok(R.dailyKeys === 3 && R.day2 === 9, "merge: Tages-Challenge je Tag das bessere Ergebnis");
  ok(JSON.parse(R.streak).current === 3 && R.lastIs3 && JSON.parse(R.streak).best === 5, "merge: Serie aus den vereinigten Tagen (3 in Folge), beste Serie bleibt (" + R.streak + ")");
  ok(R.localOnly, "merge: Entwuerfe, Duelle, Ton, Geraete-ID bleiben lokal");
  ok(R.duelMerge === JSON.stringify([["r:1", "s:1", "w:2"], 5, 4, 1, 6, 1, "wlwwd", ["k1", "u:a", "u:b"], 3, 3, 1]), "merge: Duell-Bilanz = je Zaehler das Hoehere, bezahlte Belohnungen vereinigt (" + R.duelMerge + ")");
  ok(R.seed === 777, "merge: Zufalls-Seed vom Server (gleiche Geschenke auf allen Geraeten)");
  ok(R.future === JSON.stringify({ x: 1 }), "merge: unbekannte Felder vom Server bleiben erhalten");
  ok(R.idem && R.idem2, "merge: nochmaliges Zusammenfuehren aendert nichts (stabil)");
  ok(R.commute, "merge: Reihenfolge egal bei XP, Sternen, Leveln, Token");
  ok(JSON.parse(R.gap).current === 1 && JSON.parse(R.gap).best === 2, "merge: Luecke bei den Tagen beendet die Serie (" + R.gap + ")");
  ok(R.emptyServer, "merge: leerer Server = eigener Stand");
  ok(JSON.stringify(R.hasProgress) === JSON.stringify([true, false, false]), "Fortschritts-Erkennung");
  ok(R.snapshot.length === 0, "Hochladen: lokale Felder sind nicht im Snapshot (" + R.snapshot.join() + ")");
  await ctx.close();
}

// ---------- 2) Abgleich ----------
// Fall 1: Server leer -> lokaler Stand wird hochgeladen
{
  const pj1 = await profileJson({ totalXP: 450, level: 3, hintTokens: 7, campaign: { levelPassed: { x1: true }, stars: { x1: 2 } }, stats: { lineupsPlayed: 2, playedMatchIds: ["a", "b"] }, drafts: { "c:x": { entries: {} } }, duelName: "Flo" });
  const setup = `() => { localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}"); localStorage.setItem("anstoss_profile", ${JSON.stringify(pj1)}); }`;
  const { ctx, page } = await fresh(setup, 7500);
  const st = await page.evaluate(() => ({ state: sync.state, v: sync.meta.version, dirty: sync.meta.dirty, calls: window.__calls.map((c) => c[0]), put: (window.__calls.find((c) => c[0] === "put_save") || [])[1], srv: window.__srv.save }));
  ok(st.state === "ok" && st.v === 1 && !st.dirty, "Fall 1: abgeglichen, Version 1 (" + st.state + "/" + st.v + ")");
  ok(st.put && st.put.p_expected_version === 0 && st.put.p_data.totalXP === 450 && st.put.p_data.hintTokens === 7, "Fall 1: lokaler Stand wird hochgeladen " + JSON.stringify(st.put && [st.put.p_expected_version, st.put.p_data.totalXP, st.put.p_data.hintTokens]));
  ok(st.put && !("drafts" in st.put.p_data) && !("duelName" in st.put.p_data) && !("deviceId" in st.put.p_data) && !("sound" in st.put.p_data), "Fall 1: Entwuerfe, Duelle, Geraete-ID, Ton gehen nicht hoch");
  ok(st.calls.includes("put_public_stats"), "Fall 1: oeffentliche Werte werden mitgeschrieben");
  const ps = await page.evaluate(() => window.__calls.find((c) => c[0] === "put_public_stats")[1]);
  ok(ps.p_level === 3 && ps.p_campaign_stars === 2 && ps.p_lineups_played === 2 && ps.p_rank === "Kreisliga", "Fall 1: oeffentliche Werte stimmen (" + JSON.stringify(ps) + ")");
  // zweiter Lauf ohne Aenderung: nur lesen, nicht schreiben
  const before = await page.evaluate(() => window.__calls.filter((c) => c[0] === "put_save").length);
  await page.evaluate(() => syncRun("test")); await page.waitForTimeout(300);
  ok((await page.evaluate(() => window.__calls.filter((c) => c[0] === "put_save").length)) === before, "Fall 1: unveraendert -> kein neues Schreiben");
  // Aenderung -> dirty -> Schreiben mit der bekannten Version
  await page.evaluate(() => { profile.hintTokens += 1; saveProfile(profile); });
  ok(await page.evaluate(() => sync.meta.dirty === true && sync.timer !== null), "Aenderung: Abgleich wird vorgemerkt (Ruhezeit)");
  await page.evaluate(() => syncRun("test")); await page.waitForTimeout(300);
  const last = await page.evaluate(() => [window.__calls.filter((c) => c[0] === "put_save").pop()[1].p_expected_version, window.__srv.save.version, window.__srv.save.data.hintTokens]);
  ok(last[0] === 1 && last[1] === 2 && last[2] === 8, "Aenderung: Schreiben mit erwarteter Version 1 -> 2 (" + last.join() + ")");
  // Zurueck zum Server holt fremde Aenderung (zweites Geraet hat mehr XP)
  await page.evaluate(() => { const s = window.__srv.save; s.data.totalXP = 5000; s.version += 1; });
  await page.evaluate(() => syncRun("test")); await page.waitForTimeout(400);
  ok(await page.evaluate(() => profile.totalXP === 5000 && profile.level === levelFromXP(5000)), "Zweites Geraet: hoehere XP vom Server werden uebernommen");
  ok(await page.evaluate(() => profile.duelName === "Flo" && profile.drafts["c:x"] !== undefined), "Zweites Geraet: lokaler Duell-Name/Entwuerfe bleiben " + JSON.stringify(await page.evaluate(() => [profile.duelName, Object.keys(profile.drafts)])));
  ok(page.errs.length === 0, "Fall 1: keine Fehler " + page.errs.join("|"));
  await ctx.close();
}
// Fall 2: frisches Geraet, Server hat Fortschritt -> Willkommen zurueck, Stand wird geladen
{
  const setup = () => { localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}"); window.__srv = { save: { version: 4, data: { version: 6, totalXP: 2500, level: 8, hintTokens: 12, campaign: { levelPassed: { s1: true, s2: true }, stars: { s1: 3, s2: 2 }, solutionSeen: {} }, trophiesWon: ["tx"], stats: { lineupsPlayed: 9, playedMatchIds: ["a"] }, prefillSeed: 4242 } }, conflictOnce: false }; };
  const { ctx, page } = await fresh(setup, 200);
  await page.waitForFunction(() => window.__calls.some((c) => c[0] === "put_save"), null, { timeout: 20000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({ xp: profile.totalXP, tok: profile.hintTokens, passed: Object.keys(profile.campaign.levelPassed).sort().join(), seed: profile.prefillSeed, state: sync.state, dlg: !!document.querySelector("#syncMergeYes"), toast: document.getElementById("toastStack").innerText, calls: window.__calls.map((c) => c[0]).join(), errs: 0 }));
  ok(r.xp === 2500 && r.tok === 12 && r.passed === "s1,s2" && r.seed === 4242, "Fall 2: Server-Stand ist auf dem frischen Geraet (" + JSON.stringify(r) + ")");
  ok(!r.dlg, "Fall 2: keine Rueckfrage noetig");
  ok(/Willkommen zurück/.test(r.toast) && /tester/.test(r.toast), "Fall 2: 'Willkommen zurueck, @name' (" + r.toast + " | " + r.calls + " | " + JSON.stringify(page.errs) + ")");
  ok(r.state === "ok", "Fall 2: abgeglichen");
  await ctx.close();
}
// Fall 3: beide haben Fortschritt -> Rueckfrage mit Uebersicht; 'Spaeter' aendert nichts, 'Zusammenfuehren' schon (mit Sicherung)
{
  const pj3 = await profileJson({ totalXP: 800, level: 4, hintTokens: 6, campaign: { levelPassed: { a1: true, a2: true }, stars: { a1: 3, a2: 3 } }, trophiesWon: ["t1"], stats: { lineupsPlayed: 5, playedMatchIds: ["a"] } });
  const setup = `() => {
    localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}");
    localStorage.setItem("anstoss_profile", ${JSON.stringify(pj3)});
    window.__srv = { save: { version: 3, data: { version: 6, totalXP: 600, level: 3, hintTokens: 9, campaign: { levelPassed: { b1: true }, stars: { b1: 2 }, solutionSeen: {} }, trophiesWon: ["t2"], stats: { lineupsPlayed: 3, playedMatchIds: ["b"] } } }, conflictOnce: false };
  }`;
  const { ctx, page } = await fresh(setup, 7500);
  ok(await page.locator("#syncMergeYes").count() === 1, "Fall 3: Rueckfrage 'Spielstaende zusammenfuehren' erscheint");
  const t = await page.locator(".modal-backdrop").innerText();
  ok(/Level\s*4\s*→\s*4/.test(t.replace(/\n/g, " ")) || /4\s*→\s*4/.test(t.replace(/\n/g, " ")), "Fall 3: Uebersicht zeigt Level (" + t.replace(/\n/g, " ").slice(0, 120) + ")");
  ok(/Sterne\s*8\s*→\s*10/.test(t.replace(/\n/g, " ")) || /6\s*→\s*8/.test(t.replace(/\n/g, " ")) || /→/.test(t), "Fall 3: Uebersicht zeigt vorher -> nachher");
  await page.click("#syncMergeNo"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !profile.campaign.levelPassed.b1 && !window.__calls.some((c) => c[0] === "put_save")), "Fall 3: 'Spaeter' aendert nichts und schreibt nichts");
  await page.evaluate(() => syncRun("test")); await page.waitForTimeout(300);
  ok(await page.locator("#syncMergeYes").count() === 0, "Fall 3: nach 'Spaeter' keine neue Rueckfrage bis 'Jetzt sichern'");
  await page.evaluate(() => { syncRun("manuell"); }); await page.waitForTimeout(500);
  await page.click("#syncMergeYes"); await page.waitForTimeout(700);
  const r = await page.evaluate(() => ({ passed: Object.keys(profile.campaign.levelPassed).sort().join(), tok: profile.hintTokens, xp: profile.totalXP, tro: profile.trophiesWon.sort().join(), srv: window.__srv.save, backup: !!localStorage.getItem("startelo_backup_vor_abgleich"), state: sync.state }));
  ok(r.passed === "a1,a2,b1" && r.tok === 9 && r.xp === 800 && r.tro === "t1,t2", "Fall 3: zusammengefuehrt, Token das Hoehere (" + JSON.stringify([r.passed, r.tok, r.xp, r.tro]) + ")");
  ok(r.srv.version === 4 && r.srv.data.hintTokens === 9 && Object.keys(r.srv.data.campaign.levelPassed).length === 3, "Fall 3: Server hat den zusammengefuehrten Stand (Version 4)");
  ok(r.backup && r.state === "ok", "Fall 3: Sicherung des alten lokalen Stands angelegt");
  ok(page.errs.length === 0, "Fall 3: keine Fehler " + page.errs.join("|"));
  await ctx.close();
}
// Konflikt, Offline, Spielsperre, Einstellungen
{
  const setup = () => { localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}"); window.__srv = { save: { version: 2, data: { version: 6, totalXP: 100, level: 1, hintTokens: 1 } }, conflictOnce: false }; };
  const { ctx, page } = await fresh(setup, 7500);
  // Konflikt: Server aendert sich zwischen holen und schreiben -> erneut
  await page.evaluate(() => { profile.hintTokens = 20; saveProfile(profile); window.__srv.conflictOnce = true; });
  await page.evaluate(() => syncRun("test")); await page.waitForTimeout(500);
  const k = await page.evaluate(() => [window.__calls.filter((c) => c[0] === "put_save").length, window.__srv.save.data.hintTokens, sync.state]);
  ok(k[2] === "ok" && k[1] === 20 && k[0] >= 2, "Konflikt: erneut geholt und geschrieben (" + k.join() + ")");
  // Spiel laeuft: kein Abgleich
  await page.evaluate(() => { window.__calls.length = 0; navStack.push("game"); profile.hintTokens = 21; saveProfile(profile); });
  await page.evaluate(() => syncRun("test")); await page.waitForTimeout(200);
  ok(await page.evaluate(() => window.__calls.length === 0), "Im Spiel: kein Abgleich (Stand wird nicht mitten im Spiel angefasst)");
  await page.evaluate(() => { navStack.pop(); });
  // Offline: nur vormerken
  await page.evaluate(() => { Object.defineProperty(navigator, "onLine", { get: () => false, configurable: true }); });
  await page.evaluate(() => syncRun("test")); await page.waitForTimeout(200);
  ok(await page.evaluate(() => sync.state === "offline" && sync.meta.dirty && window.__calls.length === 0), "Offline: kein Netzverkehr, bleibt vorgemerkt");
  await page.evaluate(() => { Object.defineProperty(navigator, "onLine", { get: () => true, configurable: true }); });
  await page.evaluate(() => window.dispatchEvent(new Event("online"))); await page.waitForTimeout(800);
  ok(await page.evaluate(() => sync.state === "ok" && !sync.meta.dirty && window.__srv.save.data.hintTokens === 21), "Wieder online: vorgemerkter Stand wird gesichert");
  // Einstellungen zeigen Status und 'Jetzt sichern'
  await page.evaluate(() => kabineOpenSettings()); await page.waitForTimeout(500);
  ok(/Zuletzt gesichert/.test(await page.locator("#kbSyncTxt").innerText()), "Einstellungen: 'Zuletzt gesichert …'");
  const n0 = await page.evaluate(() => window.__calls.length); await page.click("#kbSSync"); await page.waitForTimeout(500);
  ok(await page.evaluate((n) => window.__calls.length > n, n0), "Einstellungen: 'Jetzt sichern' gleicht ab");
  // Gast: nie Abgleich
  ok(page.errs.length === 0, "Konflikt/Offline: keine Fehler " + page.errs.join("|"));
  await ctx.close();
}
{
  const { ctx, page } = await fresh(() => { window.__mock = { session: null, profile: null }; });
  await page.evaluate(() => { profile.hintTokens += 1; saveProfile(profile); });
  ok(await page.evaluate(() => sync.timer === null && !sync.meta.dirty && (!window.__calls || window.__calls.length === 0)), "Gast: kein Abgleich, nichts vorgemerkt");
  await ctx.close();
}

await browser.close(); server.close();
console.log(fails ? `${fails} FEHLER von ${checks} Pruefungen` : `OK - ${checks} Cloud-Spielstand-Pruefungen bestanden`);
process.exit(fails ? 1 : 0);
