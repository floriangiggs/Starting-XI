// Konto-Tests (Prompt K2b): Kabine, Anmeldung mit Apple, Namen waehlen, Abmelden, Konto loeschen, Offline-Verhalten.
// Aufruf: node tools/test-konto.mjs
// Supabase wird in der Seite durch einen Nachbau ersetzt (window.supabase vor dem Laden gesetzt) - es gibt keine echte Anmeldung und keinen Netzverkehr.
// Die App laeuft ueber einen lokalen http-Server (file:// kann die Anmelde-Rueckkehr nicht).
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

// Nachbau von supabase-js: protokolliert Aufrufe, Antworten steuert window.__mock
const MOCK = () => {
  window.__calls = [];
  window.__mock = window.__mock || { session: null, profile: null, claim: { ok: true }, deleteError: null, profileError: null };
  window.supabase = { createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: window.__mock.session } }),
      onAuthStateChange: (cb) => { window.__authCb = cb; return { data: { subscription: { unsubscribe() {} } } }; },
      signInWithOAuth: async (o) => { window.__calls.push(["oauth", o]); return { error: null }; },
      signOut: async () => { window.__calls.push(["signOut"]); window.__mock.session = null; window.__mock.profile = null; return { error: null }; }
    },
    rpc: async (name, args) => {
      window.__calls.push(["rpc", name, args]);
      const m = window.__mock;
      if (name === "my_profile") return m.profileError ? { data: null, error: { message: "x" } } : { data: m.profile, error: null };
      if (name === "claim_username") { if (m.claim.ok) { m.profile = { username: args.p_name, crest_color: args.p_crest, friend_code: "XI-TEST", username_changed_at: new Date().toISOString() }; return { data: { ok: true, username: args.p_name }, error: null }; } return { data: m.claim, error: null }; }
      if (name === "delete_account") { if (m.deleteError) return { data: null, error: { message: "x" } }; m.session = null; m.profile = null; return { data: null, error: null }; }
      return { data: null, error: { message: "unbekannt" } };
    }
  }) };
};

const browser = await chromium.launch();
async function fresh(setup, url = base, opts = {}) {
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 393, height: 852 } });
  const page = await ctx.newPage();
  page.errs = []; page.on("pageerror", (e) => page.errs.push(String(e)));
  await page.addInitScript(MOCK);
  if (setup) await page.addInitScript(setup);
  await page.goto(url); await page.waitForFunction(() => document.getElementById("splash") === null || document.getElementById("splash").hidden || getComputedStyle(document.getElementById("splash")).display === "none" || document.getElementById("kbLogo"), null, { timeout: 15000 });
  await page.waitForTimeout(opts.wait || 6500);
  return { ctx, page };
}

// 1) Gast: Kabine, Apple-Knopf, keine Bibliothek geladen
{
  const { ctx, page } = await fresh();
  ok(await page.evaluate(() => online.state === "guest" && online.client === null), "Gast: Zustand guest, Supabase noch nicht gestartet");
  await page.click("#kbLogo"); await page.waitForTimeout(700);
  ok(await page.locator(".kb-drawer.on").count() === 1, "Gast: Kabine geht auf");
  ok(/Du spielst als Gast/.test(await page.locator(".kb-drawer").innerText()), "Gast: Gast-Karte sichtbar");
  ok(await page.locator("#kbApple").count() === 1 && /Mit Apple anmelden/.test(await page.locator("#kbApple").innerText()), "Gast: Knopf 'Mit Apple anmelden'");
  ok(await page.locator("#kbFr.lock").count() === 1, "Gast: Freunde sind gesperrt (kommt bald)");
  await page.click("#kbApple"); await page.waitForTimeout(500);
  const call = await page.evaluate(() => window.__calls.find((c) => c[0] === "oauth"));
  ok(call && call[1].provider === "apple", "Gast: Anmeldung startet mit Provider apple");
  ok(call && call[1].options.redirectTo === base, "Gast: Rueckkehr-Adresse = App-Adresse (" + (call && call[1].options.redirectTo) + ")");
  // Zurueck-Taste/Escape schliesst die Kabine
  await page.evaluate(() => { kabineClose(); }); await page.waitForTimeout(500);
  await page.click("#kbLogo"); await page.waitForTimeout(600); await page.keyboard.press("Escape"); await page.waitForTimeout(600);
  ok(await page.locator(".kb-drawer").count() === 0, "Escape schliesst die Kabine");
  ok(page.errs.length === 0, "Gast: keine Fehler in der Seite " + page.errs.join("|"));
  await ctx.close();
}

// 2) Rueckkehr von Apple ohne Namen: Namensbildschirm, Pruefung, vergeben + Vorschlaege, Erfolg, Konto
{
  const setup = () => { window.__mock = { session: { user: { id: "u1" } }, profile: null, claim: { ok: false, error: "taken", suggestions: ["flo_xi", "flo11", "flo_kickt"] } }; localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}"); };
  const { ctx, page } = await fresh(setup, base + "?code=abc123");
  ok(await page.locator(".kb-screen").count() === 1, "Rueckkehr: Namensbildschirm geoeffnet");
  ok(await page.evaluate(() => online.state === "needsName"), "Rueckkehr: Zustand needsName");
  ok(!(await page.evaluate(() => location.search)).includes("code="), "Rueckkehr: ?code= aus der Adresse entfernt");
  ok(await page.locator("#kbNNext").isDisabled(), "Name: Weiter anfangs gesperrt");
  await page.fill("#kbNIn", "A"); ok(/zu kurz/i.test(await page.locator("#kbNChk").innerText()), "Name: zu kurz erkannt");
  await page.fill("#kbNIn", "_flo"); ok(/Anfang und Ende/.test(await page.locator("#kbNChk").innerText()), "Name: Unterstrich am Anfang erkannt");
  await page.fill("#kbNIn", "Flo Müller!"); ok(await page.inputValue("#kbNIn") === "flomller", "Name: Eingabe wird auf a-z 0-9 . _ bereinigt (" + await page.inputValue("#kbNIn") + ")");
  await page.fill("#kbNIn", "flo"); await page.waitForTimeout(100);
  ok(await page.locator("#kbNNext").isDisabled(), "Name: ohne Altershaekchen bleibt Weiter gesperrt");
  await page.check("#kbAge"); await page.waitForTimeout(100);
  ok(await page.locator("#kbNNext").isEnabled(), "Name: mit Haekchen ist Weiter frei");
  await page.click("#kbCols button:nth-child(3)");
  await page.click("#kbNNext"); await page.waitForTimeout(500);
  ok(/vergeben/.test(await page.locator("#kbNChk").innerText()), "Name: 'vergeben' vom Server wird angezeigt");
  ok(await page.locator(".kb-sugg button").count() === 3, "Name: drei Vorschlaege");
  const claim = await page.evaluate(() => window.__calls.find((c) => c[0] === "rpc" && c[1] === "claim_username"));
  ok(claim && claim[2].p_name === "flo" && claim[2].p_crest === "#2A5F8F", "Name: claim_username mit Name und Wappenfarbe (" + JSON.stringify(claim && claim[2]) + ")");
  ok(claim && claim[2].p_legacy && claim[2].p_legacy.length > 4, "Name: alte Geraete-ID wird mitgegeben");
  await page.evaluate(() => { window.__mock.claim = { ok: true }; });
  await page.click(".kb-sugg button:nth-child(1)"); await page.waitForTimeout(100);
  ok(await page.inputValue("#kbNIn") === "flo_xi", "Name: Vorschlag uebernommen");
  await page.click("#kbNNext"); await page.waitForTimeout(600);
  ok(/fast fertig/i.test(await page.locator(".kb-screen").innerText()), "Name: Schritt 2 'Fast fertig'");
  await page.click("#kbDone"); await page.waitForTimeout(500);
  ok(await page.locator(".kb-screen").count() === 0, "Name: Bildschirm schliesst");
  ok(await page.evaluate(() => online.state === "member" && online.account.username === "flo_xi" && online.account.code === "XI-TEST"), "Konto: Mitglied mit Name und Freundescode");
  ok(await page.evaluate(() => !!localStorage.getItem("startelo_account")), "Konto: Ausweis lokal gemerkt");
  ok(await page.evaluate(() => !JSON.stringify(profile).includes("flo_xi")), "Konto: Name steht nicht im Spielstand (Export bleibt frei von Konto-Daten)");
  await page.click("#kbLogo"); await page.waitForTimeout(700);
  const t = await page.locator(".kb-drawer").innerText();
  ok(/@flo_xi/.test(t) && /XI-TEST/.test(t), "Kabine: zeigt @Name und Freundescode");
  ok(await page.locator("#kbApple").count() === 0, "Kabine: kein Anmelde-Knopf mehr");
  // Abmelden
  await page.click("#kbOut"); await page.waitForTimeout(600);
  ok(await page.evaluate(() => online.state === "guest" && !localStorage.getItem("startelo_account")), "Abmelden: wieder Gast, Ausweis entfernt");
  ok(await page.evaluate(() => window.__calls.some((c) => c[0] === "signOut")), "Abmelden: signOut aufgerufen");
  ok(await page.evaluate(() => typeof profile.level === "number"), "Abmelden: Spielstand bleibt");
  ok(page.errs.length === 0, "Konto: keine Fehler in der Seite " + page.errs.join("|"));
  await ctx.close();
}

// 3) Mitglied: Einstellungen, Name aendern (Sperre 30 Tage), Konto loeschen (Fehler offline, Erfolg)
{
  const setup = () => { const recent = new Date(Date.now() - 5 * 86400000).toISOString(); window.__mock = { session: { user: { id: "u1" } }, profile: { username: "kicker11", crest_color: "#C1392B", friend_code: "XI-AB12", username_changed_at: recent }, claim: { ok: true }, deleteError: null }; localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}"); };
  const { ctx, page } = await fresh(setup);
  ok(await page.evaluate(() => online.state === "member" && online.account.username === "kicker11"), "Mitglied: Sitzung + Profil wiederhergestellt");
  await page.evaluate(() => kabineOpenSettings()); await page.waitForTimeout(500);
  ok(/Erst wieder ab/.test(await page.locator("#kbSName").innerText()), "Einstellungen: Namensaenderung zeigt Sperrfrist");
  await page.click("#kbSName"); await page.waitForTimeout(300);
  ok(await page.locator(".kb-screen").count() === 1 && !/Name ändern/.test(await page.locator(".kb-screen h1").innerText()), "Einstellungen: bei Sperrfrist oeffnet sich kein Namensbildschirm");
  // Loeschen: erst Abbrechen
  await page.click("#kbSDel"); await page.waitForTimeout(300);
  ok(/endgültig gelöscht/.test(await page.locator(".modal-backdrop").innerText()), "Loeschen: Klartext-Rueckfrage");
  await page.click("#kbDelNo"); await page.waitForTimeout(200);
  ok(await page.evaluate(() => online.state === "member" && !window.__calls.some((c) => c[1] === "delete_account")), "Loeschen: Abbrechen loescht nichts");
  // Fehler vom Server
  await page.evaluate(() => { window.__mock.deleteError = true; });
  await page.click("#kbSDel"); await page.click("#kbDelYes"); await page.waitForTimeout(500);
  ok(/nicht geklappt/.test(await page.locator("#kbDelMsg").innerText()) && await page.evaluate(() => online.state === "member"), "Loeschen: Serverfehler wird gemeldet, Konto bleibt");
  await page.evaluate(() => { window.__mock.deleteError = null; });
  await page.click("#kbDelYes"); await page.waitForTimeout(700);
  ok(await page.evaluate(() => online.state === "guest" && window.__calls.some((c) => c[1] === "delete_account") && !localStorage.getItem("startelo_account")), "Loeschen: Konto weg, wieder Gast");
  ok(await page.evaluate(() => profile.level >= 1), "Loeschen: lokaler Spielstand bleibt");
  ok(page.errs.length === 0, "Mitglied: keine Fehler in der Seite " + page.errs.join("|"));
  await ctx.close();
}

// 4) Offline: bekannter Ausweis bleibt sichtbar, Anmelden/Loeschen melden 'offline'
{
  const setup = () => { localStorage.setItem("startelo_account", JSON.stringify({ username: "offline_fan", crest: "#5B3D7A", code: "XI-OFF1", changedAt: null })); localStorage.setItem("sb-dcbmqctnpaqgijainkwt-auth-token", "{}"); window.__mock = { session: { user: { id: "u1" } }, profile: null, profileError: true }; };
  const { ctx, page } = await fresh(setup);
  ok(await page.evaluate(() => online.state === "member" && online.account.username === "offline_fan" && online.stale), "Offline: Ausweis bleibt (stale), obwohl my_profile fehlschlaegt");
  await page.context().setOffline(true);
  await page.evaluate(() => { Object.defineProperty(navigator, "onLine", { get: () => false, configurable: true }); });
  await page.click("#kbLogo"); await page.waitForTimeout(700);
  ok(/offline_fan/.test(await page.locator(".kb-drawer").innerText()) && /Offline/.test(await page.locator(".kb-drawer").innerText()), "Offline: Kabine zeigt @Name mit Offline-Hinweis");
  const r = await page.evaluate(() => onlineDeleteAccount()); ok(r.ok === false && r.error === "offline", "Offline: Konto loeschen meldet offline");
  const r2 = await page.evaluate(() => onlineClaimName("neuername", "#2E7D52")); ok(r2.ok === false && r2.error === "offline", "Offline: Name aendern meldet offline");
  const r3 = await page.evaluate(() => onlineSignInApple()); ok(r3.ok === false && r3.error === "offline", "Offline: Anmelden meldet offline");
  ok(page.errs.length === 0, "Offline: keine Fehler in der Seite " + page.errs.join("|"));
  await ctx.close();
}

// 5) Reine Pruefungen
{
  const { ctx, page } = await fresh();
  const v = await page.evaluate(() => ["", "ab", "abc", "a_b", "_ab", "ab_", "a.b.c", "ABC", "abcdefghijklmnop", "abcdefghijklmno", "ä", "a b"].map((n) => onlineNameCheck(n).st));
  ok(JSON.stringify(v) === JSON.stringify(["info", "bad", "ok", "ok", "bad", "bad", "ok", "ok", "bad", "ok", "bad", "bad"]), "Namensregeln wie auf dem Server: " + JSON.stringify(v));
  // Dateien: Bibliothek liegt lokal und ist im Service-Worker-Cache
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  ok(sw.includes("vendor/supabase-js-2.118.0.umd.js") && fs.existsSync(path.join(root, "vendor/supabase-js-2.118.0.umd.js")), "Bibliothek lokal + im Cache");
  ok(/origin !== self\.location\.origin\) return/.test(sw), "Service Worker fasst fremde Adressen (Supabase) nicht an");
  const html = fs.readFileSync(path.join(root, "startelf_check.html"), "utf8");
  ok(!/service_role|sb_secret_/.test(html), "Kein geheimer Schluessel in der App");
  ok(/sb_publishable_/.test(html), "Oeffentlicher Schluessel ist gesetzt");
  await ctx.close();
}

await browser.close(); server.close();
console.log(fails ? `${fails} FEHLER von ${checks} Pruefungen` : `OK - ${checks} Konto-Pruefungen bestanden`);
process.exit(fails ? 1 : 0);
