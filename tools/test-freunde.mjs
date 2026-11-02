// Freunde-Tests (Prompt K4): Liste, Anfragen, Suche, Code, Einladungslink, Blockieren, Melden, Privatsphaere gegen einen Server-Nachbau.
// Aufruf: node tools/test-freunde.mjs
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

// 1) Kabine, Liste, Anfragen
{
  const { ctx, page } = await fresh(MEMBER);
  ok(await page.evaluate(() => online.state === "member" && FR.friends.length === 1 && FR.incoming.length === 1 && FR.outgoing.length === 1), "Daten werden beim Anmelden geladen");
  ok(await page.evaluate(() => !document.getElementById("kbDot").hidden), "Logo: goldener Punkt bei offener Anfrage");
  await page.click("#kbLogo"); await page.waitForTimeout(700);
  const k = await txt(page, "#kbFr");
  ok(/1 Freund/.test(k) && /1 Anfrage/.test(k), "Kabine: 'Freunde' zeigt Anzahl und Anfragen (" + k + ")");
  ok(await page.locator("#kbFr .kb-cnt").innerText() === "1", "Kabine: Zähler an Freunde");
  ok(await page.locator("#kbFr.lock").count() === 0, "Kabine: Freunde nicht mehr gesperrt");
  await page.click("#kbFr"); await page.waitForTimeout(800);
  const t = await txt(page, ".kb-screen");
  ok(/Anfragen 1/.test(t) && /@timo09/.test(t) && /@lisa_kickt/.test(t) && /Profiliga/.test(t) && /Wartet auf Antwort/.test(t) && /@kai_bolzt/.test(t), "Freunde-Bildschirm: Anfragen, Freunde, ausgehende (" + t.slice(0, 150) + ")");
  // Anfrage annehmen
  await page.click('.kb-frow[data-id="r1"] [data-act="yes"]'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => FR.friends.length === 2 && FR.incoming.length === 0) && /@timo09/.test(await txt(page, ".kb-screen")) && !/Anfragen 1/.test(await txt(page, ".kb-screen")), "Anfrage annehmen: Freund in der Liste, Anfrage weg");
  ok(await page.evaluate(() => document.getElementById("kbDot").hidden), "Logo: Punkt weg ohne Anfragen");
  // Zurueckziehen
  await page.click('.kb-frow[data-id="o1"] [data-act="withdraw"]'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => FR.outgoing.length === 0 && window.__calls.some((c) => c[0] === "remove_friend" && c[1].p_user === "o1")), "Ausgehende Anfrage zurückziehen");
  ok(page.errs.length === 0, "Liste: keine Fehler " + page.errs.join("|"));
  await ctx.close();
}
// 2) Anfrage ablehnen, Freund ansehen / melden / entfernen / blockieren / Privatsphaere
{
  const { ctx, page } = await fresh(MEMBER);
  await page.evaluate(() => kabineOpenFriends()); await page.waitForTimeout(700);
  await page.click('.kb-frow[data-id="r1"] [data-act="no"]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => FR.incoming.length === 0 && FR.friends.length === 1), "Anfrage ablehnen: weg, kein Freund");
  await page.click('.kb-frow[data-id="f1"] [data-act="open"]'); await page.waitForTimeout(500);
  const st = await txt(page, ".modal-backdrop");
  ok(/@lisa_kickt/.test(st) && /12\s*Level/.test(st) && /64\s*Sterne/.test(st) && /9\s*Trophäen/.test(st) && /78 %\s*Trefferquote/.test(st), "Freundesblatt zeigt die Werte (" + st.slice(0, 160) + ")");
  await page.click("#frRp"); await page.waitForTimeout(300); await page.click(".kdYes"); await page.waitForTimeout(500);
  ok(await page.evaluate(() => window.__calls.some((c) => c[0] === "report_user" && c[1].p_target === "f1" && c[1].p_reason.length > 3)), "Melden: report_user mit Grund");
  await page.evaluate(() => document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove()));
  await page.click('.kb-frow[data-id="f1"] [data-act="open"]'); await page.waitForTimeout(400);
  await page.click("#frBl"); await page.waitForTimeout(300);
  ok(/kann dich nicht mehr finden/.test(await txt(page, ".modal-backdrop:last-of-type")), "Blockieren: Klartext-Rückfrage");
  await page.click(".kdYes"); await page.waitForTimeout(600);
  ok(await page.evaluate(() => FR.friends.length === 0 && FR.blocked.length === 1 && window.__calls.some((c) => c[0] === "block_user")), "Blockieren: Freund weg, in der Sperrliste");
  // Privatsphaere
  await page.evaluate(() => { sheetCloseTop(); kabineOpenPrivacy(); }); await page.waitForTimeout(700);
  const pv = await txt(page, ".kb-screen");
  ok(/Wer darf mich finden/.test(pv) && /@lisa_kickt/.test(pv) && /Aufheben/.test(pv), "Privatsphäre: Optionen und blockierte Spieler (" + pv.slice(0, 120) + ")");
  ok(await page.locator('[data-v="all"]').getAttribute("aria-pressed") === "true", "Privatsphäre: 'Alle' ist voreingestellt");
  await page.click('[data-v="code"]'); await page.waitForTimeout(400);
  ok(await page.evaluate(() => window.__calls.some((c) => c[0] === "set_discoverable" && c[1].p_mode === "code") && online.account.discoverable === "code"), "Privatsphäre: set_discoverable(code)");
  await page.click('.kb-frow [data-act="unblock"]'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => FR.blocked.length === 0 && window.__calls.some((c) => c[0] === "unblock_user")), "Aufheben: Sperre weg");
  ok(page.errs.length === 0, "Blatt: keine Fehler " + page.errs.join("|"));
  await ctx.close();
}
// 3) Freund hinzufuegen: Suche, Code, Teilen, Duell-Gegner
{
  const { ctx, page } = await fresh(() => { localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}"); window.__shared = null; Object.defineProperty(navigator, "share", { value: async (d) => { window.__shared = d; }, configurable: true }); }, base);
  await page.evaluate(() => { kabineOpenFriends(); }); await page.waitForTimeout(500);
  await page.click("#frAdd"); await page.waitForTimeout(500);
  await page.fill("#faName", "le"); await page.waitForTimeout(500);
  ok(/Mindestens 3/.test(await txt(page, "#faRes")), "Suche: unter 3 Zeichen kein Aufruf");
  await page.fill("#faName", "len"); await page.waitForTimeout(900);
  const r = await txt(page, "#faRes");
  ok(/@lenny_xi/.test(r) && /@lena_libero/.test(r), "Suche: Treffer für 'len' (" + r + ")");
  await page.fill("#faName", "lisa"); await page.waitForTimeout(900);
  ok(/Befreundet/.test(await txt(page, "#faRes")), "Suche: vorhandener Freund ist 'Befreundet'");
  await page.fill("#faName", "lenn"); await page.waitForTimeout(900);
  await page.click('#faRes [data-act="add"]'); await page.waitForTimeout(500);
  ok(await page.evaluate(() => window.__calls.some((c) => c[0] === "send_request" && c[1].p_user === "d1")) && /Angefragt/.test(await txt(page, "#faRes")), "Hinzufügen: Anfrage gesendet, 'Angefragt'");
  // Code
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT + "-hinzufuegen.png" });
  await page.fill("#faCode", "xi-test"); await page.click("#faGo"); await page.waitForTimeout(400);
  ok(/eigener Code/.test(await txt(page, "#faCRes")), "Code: eigener Code wird erkannt");
  await page.fill("#faCode", "xi-zzzz"); await page.click("#faGo"); await page.waitForTimeout(500);
  ok(/gibt es nicht/.test(await txt(page, "#faCRes")), "Code: unbekannter Code");
  await page.fill("#faCode", "xi-new1"); await page.click("#faGo"); await page.waitForTimeout(500);
  ok(/@neuling/.test(await txt(page, "#faCRes")), "Code: Spieler gefunden (Groß-/Kleinschreibung egal)");
  // Teilen
  await page.click("#faShare"); await page.waitForTimeout(300);
  const sh = await page.evaluate(() => window.__shared);
  ok(sh && sh.url === "https://startelo.de/f/XI-TEST" && /XI-TEST/.test(sh.text), "Teilen: Link https://startelo.de/f/XI-TEST (" + JSON.stringify(sh) + ")");
  ok(/startelo\.de\/f\/XI-TEST/.test(await txt(page, ".kb-screen.kb-top2")), "Dein Code und Link stehen auf dem Blatt");
  ok(page.errs.length === 0, "Hinzufügen: keine Fehler " + page.errs.join("|"));
  await ctx.close();
}
// 4) Fehler: Limit, offline
{
  const { ctx, page } = await fresh(MEMBER);
  await page.evaluate(() => kabineOpenAddFriend()); await page.waitForTimeout(500);
  await page.evaluate(() => { window.__s.err = "rate_limited"; });
  await page.fill("#faName", "len"); await page.waitForTimeout(900);
  ok(/Zu viele Versuche/.test(await txt(page, "#faRes")), "Fehler: rate_limited wird freundlich gemeldet");
  const r = await page.evaluate(async () => { Object.defineProperty(navigator, "onLine", { get: () => false, configurable: true }); return frCall("friends_list"); });
  ok(r.ok === false && r.error === "offline", "Offline: kein Aufruf, Meldung 'offline'");
  await ctx.close();
}
// 5) Einladungslink: Gast -> anmelden -> Rueckfrage
{
  const { ctx, page } = await fresh(() => { window.__mock = { session: null, profile: null }; }, base + "?f=xi-new1");
  ok(await page.evaluate(() => !location.search.includes("f=") && localStorage.getItem("startelo_pending_friend") === "XI-NEW1"), "Link (Gast): Code gemerkt, Adresse bereinigt");
  ok(await page.locator(".kb-drawer.on").count() === 1 || await page.locator(".kb-drawer").count() === 1, "Link (Gast): Kabine öffnet sich zum Anmelden");
  // Anmeldung simulieren
  await page.evaluate(() => { window.__mock.session = { user: { id: "u1" } }; window.__mock.profile = { username: "tester", crest_color: "#2E7D52", friend_code: "XI-TEST", username_changed_at: null }; localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}"); onlineRefresh(); });
  await page.waitForTimeout(1500);
  ok(/@neuling/.test(await txt(page, ".modal-backdrop")), "Link (nach Anmeldung): Rückfrage '@neuling als Freund hinzufügen?'");
  await page.click("#frCfYes"); await page.waitForTimeout(600);
  ok(await page.evaluate(() => window.__calls.some((c) => c[0] === "send_request" && c[1].p_user === "n1") && !localStorage.getItem("startelo_pending_friend")), "Link: Anfrage gesendet, gemerkter Code gelöscht");
  await ctx.close();
  const b = await fresh(MEMBER, base + "?f=XI-TEST");
  await b.page.waitForTimeout(500);
  ok(await b.page.evaluate(() => !localStorage.getItem("startelo_pending_friend") && !window.__calls.some((c) => c[0] === "find_by_code")), "Link: eigener Code löst keine Suche aus");
  await b.ctx.close();
  const c2 = await fresh(MEMBER);
  await c2.page.evaluate(() => { localStorage.setItem("startelo_pending_friend", "XI-NONE"); frHandlePending(); });
  await c2.page.waitForTimeout(500);
  ok(/gibt es nicht/.test(await c2.page.locator("#toastStack").innerText()), "Link: unbekannter Code meldet 'gibt es nicht'");
  await c2.ctx.close();
}
// 6) Gast sieht Freunde gesperrt; 404-Seite leitet /f/<Code> um
{
  const { ctx, page } = await fresh(() => { window.__mock = { session: null, profile: null }; });
  await page.click("#kbLogo"); await page.waitForTimeout(700);
  ok(await page.locator("#kbFr.lock").count() === 1, "Gast: Freunde gesperrt");
  await ctx.close();
  const html = fs.readFileSync(path.join(root, "404.html"), "utf8"), code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const run = (p) => { let to = null; vm.runInNewContext(code, { location: { pathname: p, replace: (u) => { to = u; } }, encodeURIComponent }); return to; };
  ok(run("/f/xi-7k4p") === "/startelf_check.html?f=XI-7K4P" && run("/f/XI-7K4P/") === "/startelf_check.html?f=XI-7K4P", "404.html: /f/<Code> wird zur App umgeleitet");
  ok(run("/irgendwas") === null && run("/f/") === null && run("/f/a b") === null, "404.html: andere Adressen bleiben stehen");
}
await browser.close(); server.close();
console.log(fails ? `${fails} FEHLER von ${checks} Pruefungen` : `OK - ${checks} Freunde-Pruefungen bestanden`);
process.exit(fails ? 1 : 0);
