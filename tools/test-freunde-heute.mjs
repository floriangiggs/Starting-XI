// Tages-Tabelle + Vergleich (Prompt K5): Spielzeit, Tagesergebnis melden (Warteschlange), "Heute unter Freunden", Vergleich.
// Aufruf: node tools/test-freunde-heute.mjs
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import vm from "node:vm";
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

// Nachbau: Server-Zustand aus Sicht des Spielers u1
const MOCK = () => {
  const P = (id, name, c, rank) => ({ id, username: name, crest_color: c, rank: rank || "Kreisliga" });
  window.__calls = [];
  window.__s = window.__s || { friends: [P("f1", "lisa_kickt", "#C1392B", "Profiliga")], incoming: [P("r1", "timo09", "#2A5F8F")], outgoing: [P("o1", "kai_bolzt", "#E8B23D")], blocked: [], directory: [P("d1", "lenny_xi", "#5B3D7A"), P("d2", "lena_libero", "#C1392B"), P("f1", "lisa_kickt", "#C1392B")], codes: { "XI-NEW1": P("n1", "neuling", "#13202A") }, legacy: [P("l1", "alter_gegner", "#2E7D52")], err: null, discoverable: "all" };
  window.__mock = window.__mock || { session: { user: { id: "u1" } }, profile: { username: "tester", crest_color: "#2E7D52", friend_code: "XI-TEST", username_changed_at: null, discoverable: "all" } };
  const take = (list, id) => { const i = list.findIndex((x) => x.id === id); return i < 0 ? null : list.splice(i, 1)[0]; };
  window.supabase = { createClient: () => ({
    auth: { getSession: async () => ({ data: { session: window.__mock.session } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), signOut: async () => ({ error: null }) },
    rpc: async (name, a) => {
      window.__calls.push([name, a]); const s = window.__s;
      if (s.err && !/^(my_profile|get_save|put_save|put_public_stats)$/.test(name)) { const e = s.err; if (!s.errKeep) s.err = null; return { data: null, error: { message: e } }; }
      switch (name) {
        case "my_profile": return { data: { ...window.__mock.profile, discoverable: s.discoverable }, error: null };
        case "get_save": return { data: null, error: null };
        case "put_save": return { data: 1, error: null };
        case "put_public_stats": return { data: null, error: null };
        case "friends_daily": return { data: s.daily || [], error: null };
        case "submit_daily": window.__submits = (window.__submits || 0) + 1; if (s.submitErr) return { data: null, error: { message: s.submitErr } }; return { data: { recorded: true }, error: null };
        case "friends_list": return { data: s.friends, error: null };
        case "incoming_requests": return { data: s.incoming, error: null };
        case "outgoing_requests": return { data: s.outgoing, error: null };
        case "blocked_list": return { data: s.blocked, error: null };
        case "search_users": return { data: s.directory.filter((p) => p.username.startsWith(a.p_prefix)), error: null };
        case "find_by_code": return { data: s.codes[a.p_code] || null, error: null };
        case "send_request": { const p = [...s.directory, ...Object.values(s.codes)].find((x) => x.id === a.p_user); if (p) s.outgoing.push(p); return { data: "sent", error: null }; }
        case "answer_request": { const p = take(s.incoming, a.p_user); if (p && a.p_yes) s.friends.push(p); return { data: null, error: null }; }
        case "remove_friend": { take(s.friends, a.p_user) || take(s.outgoing, a.p_user); return { data: null, error: null }; }
        case "block_user": { const p = take(s.friends, a.p_user); if (p) s.blocked.push(p); return { data: null, error: null }; }
        case "unblock_user": take(s.blocked, a.p_user); return { data: null, error: null };
        case "report_user": return { data: null, error: null };
        case "friend_stats": return { data: { level: 12, rank: "Profiliga", campaign_stars: 64, trophies: 9, streak_current: 5, streak_best: 7, quote: 78, lineups_played: 120 }, error: null };
        case "set_discoverable": s.discoverable = a.p_mode; return { data: null, error: null };
        case "match_legacy": return { data: s.legacy, error: null };
        default: return { data: null, error: { message: "unbekannt " + name } };
      }
    } }) };
};
const browser = await chromium.launch();
async function fresh(setup, url = base, wait = 5500) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 393, height: 852 } });
  const page = await ctx.newPage(); page.errs = []; page.on("pageerror", (e) => page.errs.push(String(e)));
  await page.addInitScript(MOCK); if (setup) await page.addInitScript(setup);
  await page.goto(url); await page.waitForTimeout(wait);
  return { ctx, page };
}
const MEMBER = () => { localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}"); };
const txt = async (page, sel) => (await page.locator(sel).first().innerText()).replace(/\s+/g, " ");


// Zeit im Test steuerbar: window.__off wird zu Date.now() addiert
const CLOCK = () => { const real = Date.now.bind(Date); window.__off = 0; Date.now = () => real() + window.__off; };
const TOKEN = () => localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}");
const MEMBER_SETUP = "(" + CLOCK + ")(); (" + TOKEN + ")();", GUEST_SETUP = "(" + CLOCK + ")(); window.__mock = { session: null, profile: null };";
const today = (page) => page.evaluate(() => localDateKey());
// heutige Tages-Challenge bis zum Spielfeld oeffnen, "Sekunden" verstreichen lassen, alles richtig eintragen und auswerten
async function playDaily(page, seconds, hiddenGap) {
  await page.evaluate(() => { startDailyChallenge(); document.getElementById("toPitchBtn").click(); });
  await page.waitForTimeout(500);
  if (hiddenGap) await page.evaluate((g) => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); window.__off += g * 1000; Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); }, hiddenGap);
  await page.evaluate((s) => { window.__off += s * 1000; }, seconds);
  await page.evaluate(() => { const m = currentMatch; document.querySelectorAll("input.pos-input").forEach((i) => { if (!i.disabled && !i.classList.contains("ok")) { i.value = m.players[i.dataset.abbr]; i.dispatchEvent(new Event("input", { bubbles: true })); } }); evaluatePitch(); });
  await page.waitForTimeout(800);
}

// 1) Spielzeit + Meldung nach dem Auswerten
{
  const { ctx, page } = await fresh(MEMBER_SETUP);
  await page.evaluate(() => { window.__calls.length = 0; });
  const day = await today(page);
  await playDaily(page, 95, 40);
  const calls = await page.evaluate(() => window.__calls.filter((c) => c[0] === "submit_daily"));
  ok(calls.length === 1, "Auswerten: genau ein submit_daily (" + calls.length + ")");
  const a = calls[0] && calls[0][1];
  ok(a && a.p_day === day && a.p_correct >= 0 && a.p_correct <= 11 && typeof a.p_lineup === "string", "Auswerten: Tag, Aufstellung, Richtige plausibel " + JSON.stringify(a));
  ok(a && a.p_seconds >= 94 && a.p_seconds <= 98, "Spielzeit zählt nur die aktive Zeit (95 s, nicht 135 s): " + (a && a.p_seconds));
  ok(await page.evaluate((d) => profile.daily[d] && profile.daily[d].seconds === window.__calls.find((c) => c[0] === "submit_daily")[1].p_seconds, day), "Zeit steht im Tagesergebnis (profile.daily.seconds)");
  ok(await page.evaluate(() => !localStorage.getItem("startelo_daily_outbox") && !localStorage.getItem("startelo_daily_clock")), "Warteschlange und Uhr sind nach dem Senden leer");
  // zweiter Versuch: startDailyChallenge tut nichts, es wird nichts gesendet
  await page.evaluate(() => { startDailyChallenge(); }); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__calls.filter((c) => c[0] === "submit_daily").length) === 1, "Zweiter Versuch: nichts wird erneut gesendet");
  ok(page.errs.length === 0, "keine Seitenfehler " + page.errs.join("|"));
  await ctx.close();
}
// 2) Uhr pausiert beim Verlassen und laeuft beim Fortsetzen weiter
{
  const { ctx, page } = await fresh(MEMBER_SETUP);
  const day = await today(page);
  await page.evaluate(() => { startDailyChallenge(); document.getElementById("toPitchBtn").click(); }); await page.waitForTimeout(400);
  await page.evaluate(() => { window.__off += 30000; dailyClockPause(); window.__off += 600000; }); // 30 s gespielt, dann 10 min Pause
  const sec = await page.evaluate((d) => JSON.parse(localStorage.getItem("startelo_daily_clock")), day);
  ok(sec && sec.day === day && sec.sec >= 29 && sec.sec <= 32, "Pause speichert 30 s in localStorage: " + JSON.stringify(sec));
  await page.reload(); await page.waitForTimeout(4000);
  await page.evaluate(() => { startDailyChallenge(); document.getElementById("toPitchBtn").click(); }); await page.waitForTimeout(400);
  const s2 = await page.evaluate(() => { window.__off += 20000; return dailyClockTake(localDateKey()); });
  ok(s2 >= 49 && s2 <= 53, "Nach Neustart: 30 s + 20 s = " + s2);
  ok(await page.evaluate(() => dailyClockTake("1999-01-01")) === null, "Fremder Tag: keine Zeit");
  await ctx.close();
}
// 3) Warteschlange: offline, Netzfehler, endgueltige Fehler, Gast
{
  const { ctx, page } = await fresh(MEMBER_SETUP);
  const day = await today(page);
  await page.evaluate(() => { window.__calls.length = 0; Object.defineProperty(navigator, "onLine", { get: () => false, configurable: true }); });
  await page.evaluate((d) => dailyOutboxAdd({ day: d, lineup: "x1", correct: 7, seconds: 120 }), day); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__calls.filter((c) => c[0] === "submit_daily").length) === 0 && await page.evaluate(() => dailyOutboxGet().length) === 1, "Offline: nichts gesendet, 1 Ergebnis wartet");
  await page.evaluate(() => { window.__s.submitErr = "server_kaputt"; Object.defineProperty(navigator, "onLine", { get: () => true, configurable: true }); window.dispatchEvent(new Event("online")); }); await page.waitForTimeout(500);
  ok(await page.evaluate(() => dailyOutboxGet().length) === 1 && await page.evaluate(() => window.__submits) === 1, "Serverfehler: bleibt in der Schlange (1 Versuch)");
  await page.evaluate(() => { window.__s.submitErr = null; window.dispatchEvent(new Event("online")); }); await page.waitForTimeout(500);
  ok(await page.evaluate(() => dailyOutboxGet().length) === 0 && await page.evaluate(() => window.__submits) === 2, "Netz wieder da: genau einmal gesendet, Schlange leer");
  await page.evaluate(() => { window.__s.submitErr = "wrong_lineup"; }); await page.evaluate((d) => dailyOutboxAdd({ day: d, lineup: "falsch", correct: 3, seconds: 90 }), day); await page.waitForTimeout(500);
  ok(await page.evaluate(() => dailyOutboxGet().length) === 0 && await page.evaluate(() => window.__submits) === 3, "Endgültiger Fehler (wrong_lineup): verworfen, kein Wiederholen");
  await page.evaluate((d) => { window.__s.submitErr = null; dailyOutboxAdd({ day: d, lineup: "a", correct: 4, seconds: 50 }); dailyOutboxAdd({ day: d, lineup: "a", correct: 4, seconds: 50 }); }, day);
  ok(await page.evaluate(() => dailyOutboxGet().length) <= 1, "Je Tag höchstens ein Eintrag in der Schlange");
  await ctx.close();
  const g = await fresh(GUEST_SETUP);
  await g.page.evaluate(() => { window.__calls.length = 0; });
  await playDaily(g.page, 70);
  ok(await g.page.evaluate(() => window.__calls.filter((c) => c[0] === "submit_daily").length) === 0, "Gast: es wird nichts gesendet");
  ok(g.page.errs.length === 0, "Gast: keine Seitenfehler " + g.page.errs.join("|"));
  await g.ctx.close();
}
// 4) Tabelle "Heute unter Freunden"
{
  const { ctx, page } = await fresh(MEMBER_SETUP);
  const day = await today(page);
  const P = (id, name, c) => ({ id, username: name, crest_color: c, rank: "Kreisliga" });
  await page.evaluate(([d]) => {
    window.__s.friends = [P0("f1", "lisa_kickt", "#C1392B"), P0("f2", "max_mueller", "#2A5F8F"), P0("f3", "schlafmuetze", "#E8B23D")];
    function P0(id, n, c) { return { id, username: n, crest_color: c, rank: "Kreisliga" }; }
    window.__s.daily = [
      { ...P0("f2", "max_mueller", "#2A5F8F"), correct: 8, seconds: 140, streak: 3, mine: false },
      { ...P0("f1", "lisa_kickt", "#C1392B"), correct: 9, seconds: 200, streak: 5, mine: false },
    ];
  }, [day]);
  await page.evaluate(() => kabineOpenFriends()); await page.waitForTimeout(900);
  let rows = await page.evaluate(() => [...document.querySelectorAll("#frTT .kb-tr")].map((r) => r.innerText.replace(/\s+/g, " ").trim()));
  ok(rows.length === 4, "Tabelle: 3 Freunde + ich = 4 Zeilen (" + rows.length + ")");
  ok(/^1 \w @lisa_kickt 9\/11\s*3:20/.test(rows[0]) && /^2 \w @max_mueller 8\/11\s*2:20/.test(rows[1]), "Sortierung: mehr Richtige zuerst (" + rows.slice(0, 2).join(" | ") + ")");
  ok(/Du.*noch offen/.test(rows[2]) && /@schlafmuetze noch offen/.test(rows[3]), "Wer noch nicht gespielt hat: 'noch offen', ich vor den anderen Offenen (" + rows.slice(2).join(" | ") + ")");
  // ich habe gespielt (Server kennt mein Ergebnis): Gleichstand bei Richtigen -> schnellere Zeit vorn
  await page.evaluate(() => { window.__s.daily.push({ id: "u1", username: "tester", crest_color: "#2E7D52", correct: 9, seconds: 150, streak: 2, mine: true }); return dailyTableLoad(); }); await page.waitForTimeout(500);
  rows = await page.evaluate(() => [...document.querySelectorAll("#frTT .kb-tr")].map((r) => r.innerText.replace(/\s+/g, " ").trim()));
  ok(/^1 \w Du\s*@tester 9\/11\s*2:30/.test(rows[0]) && /^2 \w @lisa_kickt 9\/11\s*3:20/.test(rows[1]), "Gleichstand: schnellere Zeit gewinnt, Du steht vorn (" + rows.slice(0, 2).join(" | ") + ")");
  ok(await page.evaluate(() => document.querySelector("#frTT .kb-tr.me") !== null && document.querySelector("#frTT .kb-tr.first .rk") !== null), "Ich und Platz 1 sind hervorgehoben");
  ok(await page.evaluate(() => window.__calls.some((c) => c[0] === "friends_daily" && /^\d{4}-\d\d-\d\d$/.test(c[1].p_day))), "friends_daily wird mit dem heutigen Tag gerufen");
  // kein Spoiler: weder Namen der Aufstellung noch Spielernamen im Bildschirm
  const leak = await page.evaluate(() => { const m = getDailyChallenge(localDateKey()), names = Object.values(m.players).map((n) => String(n).toLowerCase()), t = document.querySelector(".kb-screen").innerText.toLowerCase(); return names.filter((n) => n.length > 3 && t.includes(n)); });
  ok(leak.length === 0, "Kein Spoiler: " + leak.join(","));
  // ohne Freunde keine Tabelle
  await page.evaluate(() => { FR.friends = []; frEmit(); }); await page.waitForTimeout(300);
  ok(await page.locator("#frTT").count() === 0, "Ohne Freunde: keine Tabelle");
  ok(page.errs.length === 0, "Tabelle: keine Seitenfehler " + page.errs.join("|"));
  await ctx.close();
}
// 5) Vergleich: Heute-Zeile, Gewinner, Zurueck
{
  const { ctx, page } = await fresh(MEMBER_SETUP);
  await page.evaluate(() => { window.__s.daily = [{ id: "f1", username: "lisa_kickt", crest_color: "#C1392B", rank: "Profiliga", correct: 9, seconds: 200, streak: 5, mine: false }, { id: "u1", username: "tester", crest_color: "#2E7D52", rank: "Kreisliga", correct: 10, seconds: 300, streak: 1, mine: true }]; });
  await page.evaluate(() => kabineOpenFriends()); await page.waitForTimeout(900);
  await page.click('.kb-frow[data-id="f1"] [data-act="open"]'); await page.waitForTimeout(800);
  const t = await page.evaluate(() => document.querySelector(".kb-screen.kb-top2").innerText.replace(/\s+/g, " "));
  ok(/10\/11 · 5:00\s*Heute\s*9\/11 · 3:20/.test(t), "Vergleich: Heute-Zeile beider (" + t.slice(0, 120) + ")");
  ok(await page.evaluate(() => { const b = document.querySelectorAll(".kb-screen.kb-top2 .kb-cr")[0].querySelectorAll("b"); return b[0].classList.contains("win") && !b[1].classList.contains("win"); }), "Mehr Richtige gewinnt (Gold links)");
  ok(await page.evaluate(() => document.querySelectorAll(".kb-screen.kb-top2 .kb-cr .bar").length >= 4), "Balken für Level, Sterne, Trophäen, Serie, Quote");
  await page.click("#cmBack"); await page.waitForTimeout(400);
  ok(await page.locator(".kb-screen.kb-top2").count() === 0 && await page.locator("#frTT").count() === 1, "Zurück führt zur Freundesliste");
  ok(page.errs.length === 0, "Vergleich: keine Seitenfehler " + page.errs.join("|"));
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails ? `${fails} FEHLER von ${checks} Pruefungen` : `OK - ${checks} Heute-unter-Freunden-Pruefungen bestanden`);
process.exit(fails ? 1 : 0);
