// App-Huelle (Capacitor, 8a-2): in der App (window.Capacitor da) nutzen Haptik, Teilen, Zwischenablage die nativen Plugins,
// Links zeigen auf startelo.de, kein Service Worker; im Browser aendert sich nichts. Dazu: Inhalt des www/-Bundles.
// Aufruf: node tools/test-native.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { buildWww } from "./build-www.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = path.join(root, "startelf_check.html");
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra !== "" ? ": " + extra : ""}`); } };
const src = fs.readFileSync(html, "utf8");

/* ---- 1) statisch ---- */
check("Service Worker wird in der App nicht registriert", /"serviceWorker" in navigator && !IS_NATIVE/.test(src));
check("kein Rest der alten GitHub-Pages-Adresse", !/github\.io/.test(src));

/* ---- 1b) Universal Links: Apple-Datei, Berechtigung, Projekt ---- */
const aasa = JSON.parse(fs.readFileSync(path.join(root, ".well-known/apple-app-site-association"), "utf8"));
const capCfg = JSON.parse(fs.readFileSync(path.join(root, "capacitor.config.json"), "utf8"));
const ent = fs.readFileSync(path.join(root, "ios/App/App/App.entitlements"), "utf8"), pbx = fs.readFileSync(path.join(root, "ios/App/App.xcodeproj/project.pbxproj"), "utf8");
const det = aasa.applinks && aasa.applinks.details && aasa.applinks.details[0];
check("Universal Links: apple-app-site-association nennt Team-ID.Bundle-ID und die Pfade /f/* und Duell-Link", !!det && det.appIDs[0] === "CS9J7W6JPM." + capCfg.appId && det.components.some((c) => c["/"] === "/f/*") && det.components.some((c) => c["/"] === "/startelf_check.html" && /^duel/.test(c["#"])), JSON.stringify(det));
check("Universal Links: .nojekyll da (sonst blendet GitHub Pages .well-known aus)", fs.existsSync(path.join(root, ".nojekyll")));
check("Universal Links: Berechtigung applinks:startelo.de, im Xcode-Projekt verdrahtet (Team + Entitlements, Bundle-ID stimmt)", /applinks:startelo\.de/.test(ent) && (pbx.match(/CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;/g) || []).length === 2 && (pbx.match(/DEVELOPMENT_TEAM = CS9J7W6JPM;/g) || []).length === 2 && pbx.includes("PRODUCT_BUNDLE_IDENTIFIER = " + capCfg.appId + ";"));

/* ---- 2) www/-Bundle ---- */
const files = buildWww({ quiet: true });
const has = (f) => files.includes(f);
check("www: index.html, Schriften, Bibliotheken", has("index.html") && has("fonts/anton-400.woff2") && has("fonts/oswald-variable.woff2") && has("vendor/supabase-js-2.118.0.umd.js") && has("vendor/qrcode-generator-2.0.4.js"), files.join(","));
check("www: nicht dabei sind sw.js, manifest.json, 404.html, docs, 1024er-Icon", !files.some((f) => /^(sw\.js|manifest\.json|404\.html|docs|social|supabase|tools)/.test(f) || f === "icons/icon-1024.png"), files.join(","));
const wwwHtml = fs.readFileSync(path.join(root, "www", "index.html"), "utf8");
check("www/index.html: kein Manifest-Link, sonst identisch mit startelf_check.html", !/rel="manifest"/.test(wwwHtml) && wwwHtml.replace(/\s+/g, "") === src.replace(/<link rel="manifest"[^>]*>\s*\n?/, "").replace(/\s+/g, ""));
const refs = [...wwwHtml.matchAll(/(?:src|href)="\.?\/?((?:icons|fonts|vendor)\/[^"?#]+)"/g)].map((m) => m[1]).concat([...wwwHtml.matchAll(/url\('\.\/(fonts\/[^']+)'\)/g)].map((m) => m[1]), [...wwwHtml.matchAll(/(?:lib|QR_LIB)[^"]*"((?:vendor)\/[^"]+)"/g)].map((m) => m[1]));
const missing = [...new Set(refs)].filter((r) => !has(r));
check("www: jede im HTML verwendete Datei (icons/fonts/vendor) ist im Bundle", refs.length >= 5 && missing.length === 0, JSON.stringify(missing));

/* ---- 3) Browser/App ---- */
const browser = await chromium.launch();
const fakeCap = () => {
  window.__calls = [];
  const rec = (n) => (a) => { window.__calls.push([n, a]); };
  window.Capacitor = {
    isNativePlatform: () => true,
    Plugins: {
      Haptics: { impact: rec("impact"), notification: rec("notification") },
      Clipboard: { write: rec("clipWrite"), read: async () => ({ value: "aus-der-ablage", type: "text/plain" }) },
      SplashScreen: { hide: rec("splashHide") },
      App: { addListener: (n, cb) => { (window.__listeners = window.__listeners || {})[n] = cb; return { remove() {} }; } },
      Preferences: window.__pref ? { set: async ({ key, value }) => { await window.__pref("set", key, value); }, get: async ({ key }) => ({ value: await window.__pref("get", key) }), remove: async ({ key }) => { await window.__pref("remove", key); }, keys: async () => ({ keys: await window.__pref("keys") }) } : undefined,
      Share: { share: async (a) => { window.__calls.push(["share", a]); if (a.text === "abbruch") throw new Error("Share canceled"); return { activityType: "x" }; } },
    },
  };
};
async function open(native) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  if (native) await page.addInitScript(fakeCap);
  await page.addInitScript(() => { window.__vib = []; navigator.vibrate = (p) => { window.__vib.push(p); return true; }; });
  await page.goto("file://" + html); await page.waitForTimeout(1500);
  return { ctx, page, errs };
}

{ // Browser: alles wie bisher
  const { ctx, page, errs } = await open(false);
  const r = await page.evaluate(() => { haptic("ok"); haptic("perfect"); return { native: IS_NATIVE, standalone: isStandalone(), base: duelBaseUrl(), vib: window.__vib, shareOwn: !navigator.share || Object.getOwnPropertyDescriptor(navigator, "share") === undefined, clipOwn: Object.getOwnPropertyDescriptor(navigator, "clipboard") === undefined }; });
  check("Browser: IS_NATIVE false, nicht 'installiert'", r.native === false && r.standalone === false, JSON.stringify(r));
  check("Browser: Link-Adresse = APP_URL (startelo.de)", r.base === "https://startelo.de/startelf_check.html", r.base);
  check("Browser: Haptik laeuft ueber navigator.vibrate", JSON.stringify(r.vib) === JSON.stringify([8, [20, 40, 20]]), JSON.stringify(r.vib));
  check("Browser: Teilen und Zwischenablage nicht ersetzt", r.shareOwn && r.clipOwn);
  check("Browser: keine Skriptfehler", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{ // App
  const { ctx, page, errs } = await open(true);
  const r = await page.evaluate(async () => {
    const out = {};
    out.native = IS_NATIVE; out.standalone = isStandalone(); out.base = duelBaseUrl();
    haptic("ok"); haptic("stars"); haptic("perfect"); vibrate(40);
    out.vib = window.__vib.length;
    await navigator.share({ title: "T", text: "hallo", url: "https://startelo.de/f/ABC" });
    try { await navigator.share({ text: "abbruch" }); out.abort = "kein Fehler"; } catch (e) { out.abort = e.name; }
    await navigator.clipboard.writeText("code-123");
    out.read = await navigator.clipboard.readText();
    out.calls = window.__calls;
    out.label = syncDeviceLabel();
    return out;
  });
  const c = r.calls;
  check("App: IS_NATIVE true, gilt als installierte App", r.native === true && r.standalone === true);
  check("App: Link-Adresse = startelo.de (nicht capacitor://localhost)", r.base === "https://startelo.de/startelf_check.html", r.base);
  check("App: Haptik ueber Capacitor (LIGHT, MEDIUM, Erfolg, HEAVY), nicht navigator.vibrate", JSON.stringify(c.filter((x) => /impact|notification/.test(x[0]))) === JSON.stringify([["impact", { style: "LIGHT" }], ["impact", { style: "MEDIUM" }], ["notification", { type: "SUCCESS" }], ["impact", { style: "HEAVY" }]]) && r.vib === 0, JSON.stringify(c));
  check("App: Teilen ueber Share-Plugin mit Titel/Text/Link", JSON.stringify(c.find((x) => x[0] === "share")[1]) === JSON.stringify({ title: "T", text: "hallo", url: "https://startelo.de/f/ABC" }));
  check("App: Abbruch im Teilen-Blatt -> AbortError (wie im Browser)", r.abort === "AbortError", r.abort);
  check("App: Zwischenablage schreiben/lesen ueber Clipboard-Plugin", JSON.stringify(c.find((x) => x[0] === "clipWrite")[1]) === JSON.stringify({ string: "code-123" }) && r.read === "aus-der-ablage");
  check("App: Geraetename 'iPhone/Mac/... (App)'", /\(App\)$/.test(r.label), r.label);
  check("App: keine Skriptfehler", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{ // Uebergang Start-Bild -> Lade-Animation: Buehne steht sofort, natives Start-Bild wird nach dem ersten Bild ausgeblendet
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript(fakeCap);
  await page.goto("file://" + html, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.getElementById("ldBrand") && document.getElementById("ldBrand").style.opacity !== "", null, { timeout: 5000 });
  const r = await page.evaluate(() => {
    const g = (id) => document.getElementById(id), st = g("ldStage").style;
    const k = Math.max(393 / 430, 852 / 932);
    return { brand: g("ldBrand").style.opacity, board: g("ldBoard").style.opacity, line: g("ldL0").style.strokeDashoffset, mag: g("ldM0").style.opacity, meter: g("ldMeter").style.opacity, pct: g("ldPct").textContent,
      scale: parseFloat(st.transform.replace(/[^0-9.]/g, "")), want: k * 430 / 390, left: parseFloat(st.left), wantLeft: (393 - 430 * k) / 2, top: parseFloat(st.top), wantTop: (852 - 932 * k) / 2 };
  });
  check("Uebergang: Titel, Tafel, Spielfeld stehen vom ersten Bild an (nichts baut sich neu auf)", r.brand === "1" && r.board === "1" && Number(r.line) === 0, JSON.stringify(r));
  check("Uebergang: Magnete und Fortschritt starten erst danach (Fortschritt bei 0 %, Anzeige noch unsichtbar)", Number(r.mag) === 0 && Number(r.meter) < 0.2, JSON.stringify([r.mag, r.meter, r.pct]));
  check("Uebergang: Buehne sitzt wie das Start-Bild (aspectFill auf 430x932)", Math.abs(r.scale - r.want) < 0.002 && Math.abs(r.left - r.wantLeft) < 0.6 && Math.abs(r.top - r.wantTop) < 0.6, JSON.stringify(r));
  await page.waitForTimeout(800);
  const hides = await page.evaluate(() => window.__calls.filter((c) => c[0] === "splashHide"));
  check("Uebergang: natives Start-Bild wird genau einmal ausgeblendet (250 ms)", hides.length === 1 && hides[0][1].fadeOutDuration === 250, JSON.stringify(hides));
  check("Uebergang: keine Skriptfehler", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{ // Speicher-Sicherung (8a-4): spiegeln, nach geraeumtem localStorage zurueckspielen, Hinweis nur bei leerem Spielstand
  const store = new Map();
  const mk = async () => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
    await ctx.exposeFunction("__pref", (op, key, value) => { if (op === "set") store.set(key, value); else if (op === "remove") store.delete(key); else if (op === "get") return store.has(key) ? store.get(key) : null; else if (op === "keys") return [...store.keys()]; });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", (e) => errs.push(e.message)); await page.addInitScript(fakeCap);
    return { ctx, page, errs };
  };
  { // frischer Start: Hinweis, Spiegelung
    const { ctx, page, errs } = await mk();
    await page.goto("file://" + html, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => /Schon im Browser gespielt/.test(document.getElementById("toastStack").innerText), null, { timeout: 15000 }).then(() => check("Speicher: leerer Spielstand ohne Konto -> einmaliger Hinweis auf die Kabine", true)).catch(() => check("Speicher: leerer Spielstand ohne Konto -> einmaliger Hinweis auf die Kabine", false));
    await page.evaluate(() => { profile.totalXP = 777; saveProfile(profile); localStorage.setItem("sb-test-auth-token", '{"a":1}'); localStorage.setItem(PROFILE_KEY + "_backup", "x"); });
    await page.waitForTimeout(2200);
    const keys = [...store.keys()];
    check("Speicher: Profil, Sitzung und Hinweis-Merker werden in die Sicherung gespiegelt", JSON.parse(store.get("anstoss_profile") || "{}").totalXP === 777 && store.get("sb-test-auth-token") === '{"a":1}' && store.has("startelo_native_hint"), keys.join(","));
    check("Speicher: Sicherungskopien (backup) werden nicht doppelt gespiegelt", !keys.some((k) => /backup/.test(k)), keys.join(","));
    check("Speicher: keine Skriptfehler (frischer Start)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }
  { // geraeumter WebView-Speicher: neuer Kontext = leeres localStorage, die Sicherung steht noch
    const { ctx, page, errs } = await mk();
    await page.goto("file://" + html, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof profile !== "undefined" && profile.totalXP === 777, null, { timeout: 10000 }).then(() => check("Speicher: leerer localStorage + Sicherung -> Profil wird zurueckgespielt", true)).catch(() => check("Speicher: leerer localStorage + Sicherung -> Profil wird zurueckgespielt", false));
    const r = await page.evaluate(() => ({ session: localStorage.getItem("sb-test-auth-token"), xp: profile.totalXP, calls: window.__calls.filter((c) => c[0] === "splashHide").length }));
    await page.waitForTimeout(600);
    const hides = await page.evaluate(() => window.__calls.filter((c) => c[0] === "splashHide").length);
    check("Speicher: Sitzung kommt mit zurueck, Start-Bild wird danach genau einmal ausgeblendet", r.session === '{"a":1}' && hides === 1, JSON.stringify([r, hides]));
    check("Speicher: keine Skriptfehler (Wiederherstellung)", errs.length === 0, errs.join(" | "));
    await ctx.close();
  }
}
{ // Universal Links in der App: appUrlOpen -> Freundescode merken / Duell-Hash verarbeiten
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message)); await page.addInitScript(fakeCap);
  await page.goto("file://" + html, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__listeners && window.__listeners.appUrlOpen && !document.getElementById("splash"), null, { timeout: 15000 });
  const r = await page.evaluate(async () => {
    const out = {}, open = (url) => window.__listeners.appUrlOpen({ url }), wait = (ms) => new Promise((res) => setTimeout(res, ms));
    window.__h = []; handleIncomingHash = (h) => { window.__h.push(h); };
    open("https://evil.example/f/ABC123"); open("https://startelo.de/impressum.html"); await wait(1200);
    out.fremd = localStorage.getItem("startelo_pending_friend"); out.hFremd = window.__h.length;
    open("https://startelo.de/f/abc-123"); await wait(1200);
    out.code = localStorage.getItem("startelo_pending_friend"); out.toast = document.getElementById("toastStack").innerText;
    open("https://startelo.de/?f=XYZ789"); await wait(1200);
    out.codeQ = localStorage.getItem("startelo_pending_friend");
    open("https://startelo.de/startelf_check.html#duel=SXD1abc"); open("https://startelo.de/startelf_check.html#duelr=SXR1xyz"); await wait(1500);
    out.hashes = window.__h.slice();
    return out;
  });
  check("Links in der App: fremde Adressen und andere startelo.de-Seiten werden ignoriert", r.fremd === null && r.hFremd === 0, JSON.stringify([r.fremd, r.hFremd]));
  check("Links in der App: startelo.de/f/CODE merkt den Freundescode (Grossbuchstaben) und fordert Gaeste zur Anmeldung auf", r.code === "ABC-123" && /Melde dich an/.test(r.toast), JSON.stringify([r.code, r.toast]));
  check("Links in der App: auch ?f=CODE wird erkannt", r.codeQ === "XYZ789", r.codeQ);
  check("Links in der App: Duell-Links (#duel= und #duelr=) gehen an die vorhandene Duell-Verarbeitung", JSON.stringify(r.hashes) === JSON.stringify(["#duel=SXD1abc", "#duelr=SXR1xyz"]), JSON.stringify(r.hashes));
  check("Links in der App: keine Skriptfehler", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{ // Apple-Login in der App (8b-1): nativer Weg mit Nonce, Abbruch ohne Fehlermeldung; im Browser unveraendert
  check("Apple-Login: Berechtigung 'Sign in with Apple' im Projekt, Plugin eingebunden", /com\.apple\.developer\.applesignin/.test(ent) && /CapawesomeCapacitorAppleSignIn/.test(fs.readFileSync(path.join(root, "ios/App/CapApp-SPM/Package.swift"), "utf8")));
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript(() => {
    window.__apple = { calls: [], mode: "ok" };
    window.__idp = [];
    window.__fakeCapPlugins = true;
  });
  await page.addInitScript(fakeCap);
  await page.addInitScript(() => { window.Capacitor.Plugins.AppleSignIn = { signIn: async (o) => { window.__apple.calls.push(o); if (window.__apple.mode === "cancel") { const e = new Error("x"); e.code = "SIGN_IN_CANCELED"; throw e; } if (window.__apple.mode === "fail") throw new Error("boom"); return { idToken: "ID.TOKEN.X", authorizationCode: "code1", user: "u1", email: null, givenName: null, familyName: null }; } }; });
  await page.goto("file://" + html, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__listeners && !document.getElementById("splash"), null, { timeout: 15000 });
  const r = await page.evaluate(async () => {
    const out = {};
    onlineClient = async () => ({ auth: { signInWithIdToken: async (a) => { window.__idp.push(a); return { error: window.__apple.supaFail ? { message: "x" } : null }; } } });
    out.ok = await onlineSignInApple();
    const c = window.__apple.calls[0], a = window.__idp[0];
    const dig = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(a.nonce));
    out.hashOk = c.nonce === Array.from(new Uint8Array(dig), (b) => b.toString(16).padStart(2, "0")).join("");
    out.scopes = c.scopes; out.rawLen = a.nonce.length; out.diff = c.nonce !== a.nonce; out.idp = { provider: a.provider, token: a.token };
    window.__apple.mode = "cancel"; out.cancel = await onlineSignInApple();
    window.__apple.mode = "fail"; out.fail = await onlineSignInApple();
    window.__apple.mode = "ok"; window.__apple.supaFail = true; out.supaFail = await onlineSignInApple();
    window.__apple.supaFail = false; const before = window.__idp.length;
    const o = navigator.onLine; Object.defineProperty(navigator, "onLine", { value: false, configurable: true }); out.offline = await onlineSignInApple(); out.offNoCall = window.__idp.length === before; Object.defineProperty(navigator, "onLine", { value: o, configurable: true });
    const n1 = await onlineNonce(), n2 = await onlineNonce(); out.nonces = [n1.raw.length, n1.hashed.length, n1.raw !== n2.raw];
    return out;
  });
  check("Apple-Login in der App: Anmeldung gelingt, Token geht mit Provider apple an Supabase", r.ok.ok === true && r.ok.native === true && r.idp.provider === "apple" && r.idp.token === "ID.TOKEN.X", JSON.stringify(r.ok));
  check("Apple-Login in der App: Apple bekommt die SHA-256-Pruefsumme, Supabase das rohe Nonce", r.hashOk && r.diff && r.rawLen === 64, JSON.stringify([r.hashOk, r.diff, r.rawLen]));
  check("Apple-Login in der App: Name und E-Mail werden angefragt", JSON.stringify(r.scopes) === JSON.stringify(["EMAIL", "FULL_NAME"]), JSON.stringify(r.scopes));
  check("Apple-Login in der App: Abbruch im Apple-Fenster = cancel (keine Fehlermeldung), anderer Fehler = auth", r.cancel.error === "cancel" && r.fail.error === "auth", JSON.stringify([r.cancel, r.fail]));
  check("Apple-Login in der App: Supabase lehnt ab -> auth; offline -> offline ohne Aufruf", r.supaFail.error === "auth" && r.offline.error === "offline" && r.offNoCall, JSON.stringify([r.supaFail, r.offline, r.offNoCall]));
  check("Apple-Login in der App: Nonce ist 64 Zeichen, Pruefsumme 64 Zeichen, jedes Mal neu", JSON.stringify(r.nonces) === JSON.stringify([64, 64, true]), JSON.stringify(r.nonces));
  check("Apple-Login in der App: keine Skriptfehler", errs.length === 0, errs.join(" | "));
  await ctx.close();
  const p2 = await (await browser.newContext({ serviceWorkers: "block" })).newPage();
  await p2.goto("file://" + html, { waitUntil: "domcontentloaded" });
  const web = await p2.evaluate(() => onlineSignInApple());
  check("Apple-Login im Browser: unveraendert (file:// meldet origin, kein nativer Weg)", web.ok === false && web.error === "origin", JSON.stringify(web));
}
{ // Konto loeschen in der App (8b-2): erst Apple bestaetigen, dann Edge Function "delete-account"; Web-Weg unveraendert
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript(fakeCap);
  await page.addInitScript(() => { window.__apple = { calls: [], mode: "ok" }; window.__fn = []; window.__rpc = []; window.Capacitor.Plugins.AppleSignIn = { signIn: async (o) => { window.__apple.calls.push(o); if (window.__apple.mode === "cancel") { const e = new Error("x"); e.code = "SIGN_IN_CANCELED"; throw e; } if (window.__apple.mode === "fail") throw new Error("boom"); return { idToken: "T", authorizationCode: "CODE-" + window.__apple.calls.length, user: "u" }; } }; });
  await page.goto("file://" + html, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__listeners && !document.getElementById("splash"), null, { timeout: 15000 });
  const r = await page.evaluate(async () => {
    const out = {}; let reply = { data: { ok: true, revoked: true }, error: null };
    online.state = "member"; online.userId = "u1"; online.account = { username: "flo_xi", crest: "#C8A24B", code: "XI-TEST", discoverable: "all" };
    onlineClient = async () => ({ auth: { signOut: async () => ({}) }, rpc: async (n) => { window.__rpc.push(n); return { error: null }; }, functions: { invoke: async (n, o) => { window.__fn.push([n, o]); return reply; } } });
    out.ok = await onlineDeleteAccount(); out.fn = window.__fn[0]; out.signIn = window.__apple.calls[0]; out.rpc = window.__rpc.length; out.state = online.state;
    online.state = "member"; window.__apple.mode = "cancel"; out.cancel = await onlineDeleteAccount(); out.cancelFn = window.__fn.length;
    window.__apple.mode = "fail"; out.fail = await onlineDeleteAccount(); out.failFn = window.__fn.length;
    window.__apple.mode = "ok"; reply = { data: null, error: { message: "x", context: { json: async () => ({ ok: false, error: "wrong_account" }) } } }; out.wrong = await onlineDeleteAccount();
    reply = { data: null, error: { message: "x", context: { json: async () => ({ ok: false, error: "apple" }) } } }; out.apple = await onlineDeleteAccount();
    reply = { data: null, error: { message: "x", context: { json: async () => ({ ok: false, error: "delete" }) } } }; out.server = await onlineDeleteAccount();
    out.stillMember = online.state === "member";
    online.state = "guest"; return out;
  });
  check("Konto loeschen in der App: Apple wird noch einmal gefragt, Code geht an die Function delete-account, kein direktes delete_account", r.ok.ok === true && r.fn[0] === "delete-account" && r.fn[1].body.authorizationCode === "CODE-1" && r.rpc === 0 && r.signIn && r.signIn.nonce === undefined, JSON.stringify([r.ok, r.fn, r.rpc]));
  check("Konto loeschen in der App: danach abgemeldet (Gast)", r.state === "guest", r.state);
  check("Konto loeschen in der App: Abbruch bei Apple = cancel, Function wird nicht aufgerufen; Apple-Fehler = apple", r.cancel.error === "cancel" && r.cancelFn === 1 && r.fail.error === "apple" && r.failFn === 1, JSON.stringify([r.cancel, r.cancelFn, r.fail, r.failFn]));
  check("Konto loeschen in der App: Antworten der Function werden richtig gemeldet (wrong_account, apple, sonst server), Konto bleibt", r.wrong.error === "wrong_account" && r.apple.error === "apple" && r.server.error === "server" && r.stillMember, JSON.stringify([r.wrong, r.apple, r.server]));
  check("Konto loeschen in der App: keine Skriptfehler", errs.length === 0, errs.join(" | "));
  await ctx.close();
  const p2 = await (await browser.newContext({ serviceWorkers: "block" })).newPage();
  await p2.goto("file://" + html, { waitUntil: "domcontentloaded" });
  const web = await p2.evaluate(async () => { const rpc = []; online.state = "member"; online.userId = "u"; onlineClient = async () => ({ auth: { signOut: async () => ({}) }, rpc: async (n) => { rpc.push(n); return { error: null }; } }); const x = await onlineDeleteAccount(); return { x, rpc }; });
  check("Konto loeschen im Browser: unveraendert ueber delete_account", web.x.ok === true && web.rpc[0] === "delete_account", JSON.stringify(web));
}

/* ---- 4) Push (8b-3) ---- */
{
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")), del = fs.readFileSync(path.join(root, "ios/App/App/AppDelegate.swift"), "utf8");
  const spm = fs.readFileSync(path.join(root, "ios/App/CapApp-SPM/Package.swift"), "utf8");
  check("Push: Plugin im Projekt (package.json, Swift Package), Entitlement aps-environment", !!pkg.dependencies["@capacitor/push-notifications"] && /CapacitorPushNotifications/.test(spm) && /<key>aps-environment<\/key>/.test(ent));
  check("Push: AppDelegate reicht Token und Fehler an Capacitor weiter", /didRegisterForRemoteNotificationsWithDeviceToken/.test(del) && /capacitorDidRegisterForRemoteNotifications/.test(del) && /didFailToRegisterForRemoteNotificationsWithError/.test(del) && /capacitorDidFailToRegisterForRemoteNotifications/.test(del));
  const pushCap = (o) => {
    window.__push = { perm: (o && o.perm) || "prompt", answer: o && o.answer, calls: [], listeners: {} };
    window.Capacitor.Plugins.PushNotifications = {
      checkPermissions: async () => ({ receive: window.__push.perm }),
      requestPermissions: async () => { window.__push.calls.push("request"); if (window.__push.perm === "prompt") window.__push.perm = window.__push.answer || "granted"; return { receive: window.__push.perm }; },
      register: async () => { window.__push.calls.push("register"); },
      addListener: (n, cb) => { window.__push.listeners[n] = cb; return { remove() {} }; },
    };
    window.Capacitor.Plugins.App.openUrl = async (a) => { window.__push.calls.push("openUrl:" + a.url); };
  };
  const open2 = async (setup, arg) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(fakeCap); if (setup) await page.addInitScript(setup, arg);
    await page.goto("file://" + html, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__listeners && !document.getElementById("splash"), null, { timeout: 15000 });
    return { ctx, page, errs };
  };
  const member = () => { online.state = "member"; online.stale = false; online.userId = "u1"; online.account = { username: "flo_xi", crest: "#C8A24B", code: "XI-TEST", discoverable: "all" }; window.__rpc = []; frCall = async (n, a) => { window.__rpc.push([n, a]); return { ok: true, data: null }; }; frRefresh = async () => {}; };

  { // Start: nichts fragen, nichts registrieren, solange keine Erlaubnis da ist
    const { ctx, page, errs } = await open2(pushCap);
    await page.evaluate(member); await page.evaluate(() => pushEnsure()); await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ calls: window.__push.calls, card: !!document.getElementById("pushYes"), wired: Object.keys(window.__push.listeners).sort() }));
    check("Push: beim Start keine Erlaubnis-Frage und kein Token, solange nichts erlaubt ist (Berechtigung wird nicht im Start verbraucht)", r.calls.length === 0 && !r.card, JSON.stringify(r));
    check("Push: Listener fuer Token, Fehler, Eingang und Antippen verbunden", ["pushNotificationActionPerformed", "pushNotificationReceived", "registration", "registrationError"].every((n) => r.wired.includes(n)), JSON.stringify(r.wired));
    // erste Herausforderung: Vorab-Karte, Ja -> iOS-Frage -> registrieren -> Token an register_device
    await page.evaluate(() => { window.__done = false; pushAsk("duel").then(() => { window.__done = true; }); });
    await page.waitForSelector("#pushYes", { timeout: 3000 });
    const card = await page.evaluate(() => document.querySelector(".sp-sheet").textContent);
    check("Push: Vorab-Karte erklaert Nutzen und Ruhezeit und nennt, wo man es ausschaltet", /Herausforderung/.test(card) && /22 bis 8 Uhr/.test(card) && /Einstellungen/.test(card), card.slice(0, 120));
    check("Push: vor dem Klick auf 'Ja' wurde iOS noch nicht gefragt", (await page.evaluate(() => window.__push.calls)).length === 0);
    await page.click("#pushYes"); await page.waitForFunction(() => window.__done === true, null, { timeout: 3000 });
    check("Push: 'Ja' -> iOS-Erlaubnis angefragt und Geraet registriert", JSON.stringify(await page.evaluate(() => window.__push.calls)) === JSON.stringify(["request", "register"]));
    await page.evaluate(() => window.__push.listeners.registration({ value: "apns-token-abc123" })); await page.waitForTimeout(100);
    const rpc = await page.evaluate(() => window.__rpc);
    check("Push: Token geht mit Plattform ios an register_device", rpc.some((c) => c[0] === "register_device" && c[1].p_token === "apns-token-abc123" && c[1].p_platform === "ios"), JSON.stringify(rpc));
    check("Push: ohne gespeicherte Schalter kein set_notify (neues Geraet = alles an)", !rpc.some((c) => c[0] === "set_notify"));
    // naechster Start: Erlaubnis da -> ohne Karte direkt registrieren
    await page.evaluate(() => { window.__push.calls.length = 0; return pushEnsure(); });
    check("Push: spaeter genuegt ensure() ohne Karte und ohne neue Frage (nur register)", JSON.stringify(await page.evaluate(() => window.__push.calls)) === JSON.stringify(["register"]));
    check("Push: keine Skriptfehler", errs.length === 0, errs.join(" | ")); await ctx.close();
  }
  { // 'Nicht jetzt': iOS wird nicht gefragt, Karte kommt nicht sofort wieder; abgelehnt in iOS: nie wieder Karte
    const { ctx, page, errs } = await open2(pushCap);
    await page.evaluate(member);
    await page.evaluate(() => { window.__done = false; pushAsk("friend").then(() => { window.__done = true; }); });
    await page.waitForSelector("#pushNo"); const t = await page.evaluate(() => document.querySelector(".sp-sheet").textContent);
    check("Push: Karte zur Freundschaftsanfrage hat eigenen Text", /Freund/.test(t) && /antwortet/.test(t), t.slice(0, 100));
    await page.click("#pushNo"); await page.waitForFunction(() => window.__done === true);
    check("Push: 'Nicht jetzt' verbraucht die iOS-Frage nicht", (await page.evaluate(() => window.__push.calls)).length === 0);
    await page.evaluate(() => pushAsk("duel")); await page.waitForTimeout(200);
    check("Push: nach 'Nicht jetzt' keine zweite Karte am selben Tag", !(await page.evaluate(() => !!document.getElementById("pushYes"))));
    await page.evaluate(() => { localStorage.setItem("startelo_push_ask", JSON.stringify({ n: 1, t: Date.now() - 4 * 86400000 })); pushAsk("duel"); }); await page.waitForSelector("#pushYes", { timeout: 2000 });
    check("Push: nach 3 Tagen darf die Karte noch einmal kommen", true); await page.click("#pushNo"); await page.waitForTimeout(100);
    await page.evaluate(() => localStorage.setItem("startelo_push_ask", JSON.stringify({ n: 3, t: Date.now() - 30 * 86400000 })));
    await page.evaluate(() => pushAsk("duel")); await page.waitForTimeout(200);
    check("Push: nach 3 Anlaeufen nie wieder eine Karte", !(await page.evaluate(() => !!document.getElementById("pushYes"))));
    await page.evaluate(() => { window.__push.perm = "denied"; localStorage.removeItem("startelo_push_ask"); return pushAsk("duel"); }); await page.waitForTimeout(200);
    check("Push: in iOS abgelehnt = keine Karte, keine Frage", !(await page.evaluate(() => !!document.getElementById("pushYes"))) && (await page.evaluate(() => window.__push.calls)).length === 0);
    check("Push: keine Skriptfehler", errs.length === 0, errs.join(" | ")); await ctx.close();
  }
  { // iOS-Frage verneint: kein Registrieren
    const { ctx, page, errs } = await open2(pushCap, { answer: "denied" });
    await page.evaluate(member);
    await page.evaluate(() => { window.__done = false; pushAsk("duel").then(() => { window.__done = true; }); });
    await page.click("#pushYes"); await page.waitForFunction(() => window.__done === true);
    check("Push: iOS-Frage verneint -> kein register, kein Fehler", JSON.stringify(await page.evaluate(() => window.__push.calls)) === JSON.stringify(["request"]) && errs.length === 0);
    await ctx.close();
  }
  { // Antippen, Eingang, Abmelden
    const { ctx, page, errs } = await open2(pushCap, { perm: "granted" });
    await page.evaluate(() => { member(); }).catch(() => {});
    await page.evaluate(member); await page.evaluate(() => { sdSync = async () => { window.__sd = (window.__sd || 0) + 1; }; kabineOpenFriends = () => { window.__fr = (window.__fr || 0) + 1; }; navigate = (id) => { window.__nav = id; }; });
    await page.evaluate(() => pushEnsure());
    await page.evaluate(() => window.__push.listeners.pushNotificationActionPerformed({ actionId: "tap", notification: { data: { kind: "duel_challenge", duel: "d1" } } }));
    await page.waitForFunction(() => window.__nav === "duels", null, { timeout: 4000 });
    check("Push: Antippen einer Duell-Push gleicht ab und oeffnet die Duelle", (await page.evaluate(() => window.__sd)) >= 1);
    await page.evaluate(() => window.__push.listeners.pushNotificationActionPerformed({ actionId: "tap", notification: { data: { kind: "friend_request" } } }));
    await page.waitForFunction(() => window.__fr === 1, null, { timeout: 4000 });
    check("Push: Antippen einer Freundes-Push oeffnet die Freunde", true);
    await page.evaluate(() => { window.__nav = ""; navStack.push("duelplay"); window.__push.listeners.pushNotificationActionPerformed({ actionId: "tap", notification: { data: { kind: "duel_your_turn" } } }); });
    await page.waitForTimeout(900);
    check("Push: mitten in einer Runde wird nichts weggeschaltet", (await page.evaluate(() => window.__nav)) === "");
    await page.evaluate(() => { navStack.pop(); window.__sd = 0; window.__push.listeners.pushNotificationReceived({ data: { kind: "duel_finished" } }); }); await page.waitForTimeout(100);
    { const g = await page.evaluate(() => [window.__sd, window.__nav]); check("Push: Eingang bei offener App aktualisiert nur den Stand (kein Wechsel des Bildschirms)", g[0] >= 1 && g[1] === "", JSON.stringify(g)); }
    // Abmelden nimmt das Geraet aus dem Konto
    await page.evaluate(() => { window.__rpc.length = 0; window.__push.listeners.registration({ value: "tok-xyz-999" }); }); await page.waitForTimeout(100);
    await page.evaluate(async () => { onlineSignOut = async () => { online.state = "guest"; }; kabineSignOut = kabineSignOut; });
    await page.evaluate(() => kabineSignOut()); const rpc = await page.evaluate(() => window.__rpc);
    check("Push: Abmelden ruft unregister_device mit dem Token (vor dem Abmelden)", rpc.some((c) => c[0] === "unregister_device" && c[1].p_token === "tok-xyz-999"), JSON.stringify(rpc));
    check("Push: keine Skriptfehler", errs.length === 0, errs.join(" | ")); await ctx.close();
  }
  { // Kabine -> Einstellungen -> Benachrichtigungen
    const { ctx, page, errs } = await open2(pushCap, { perm: "granted" });
    await page.evaluate(member); await page.evaluate(() => pushEnsure());
    await page.evaluate(() => { kabineOpenSettings(); }); await page.waitForSelector("#kbSPush");
    check("Push: Einstellungen zeigen 'Benachrichtigungen' (nur App + angemeldet)", true);
    await page.click("#kbSPush"); await page.waitForSelector("#pnBack");
    const rows = await page.evaluate(() => [...document.querySelectorAll("[data-k]")].map((b) => [b.dataset.k, b.getAttribute("aria-pressed")]));
    check("Push: sechs Schalter, alle an", rows.length === 6 && rows.every((r) => r[1] === "true"), JSON.stringify(rows));
    await page.evaluate(() => { window.__rpc.length = 0; }); await page.click('[data-k="duel_challenge"]'); await page.waitForTimeout(200);
    const sn = await page.evaluate(() => ({ rpc: window.__rpc, ls: localStorage.getItem("startelo_push_prefs"), on: document.querySelector('[data-k="duel_challenge"]').getAttribute("aria-pressed") }));
    check("Push: Schalter aus -> set_notify mit der Art auf false, lokal gemerkt", sn.on === "false" && sn.rpc.some((c) => c[0] === "set_notify" && c[1].p_prefs.duel_challenge === false) && /"duel_challenge":false/.test(sn.ls), JSON.stringify(sn));
    await page.click('[data-k="duel_challenge"]'); await page.waitForTimeout(200);
    check("Push: Schalter wieder an", (await page.evaluate(() => document.querySelector('[data-k="duel_challenge"]').getAttribute("aria-pressed"))) === "true");
    // neues Geraet bekommt die gemerkten Schalter mit
    await page.evaluate(() => { localStorage.setItem("startelo_push_prefs", JSON.stringify({ duel_challenge: false })); window.__rpc.length = 0; window.__push.listeners.registration({ value: "tok-new-123456" }); }); await page.waitForTimeout(150);
    const rr = await page.evaluate(() => window.__rpc.map((c) => c[0]));
    check("Push: Token registrieren und danach gespeicherte Schalter setzen (register_device, set_notify)", rr[0] === "register_device" && rr[1] === "set_notify", JSON.stringify(rr));
    // Hinweise bei verweigerter bzw. noch offener Erlaubnis
    await page.evaluate(() => { window.__push.perm = "denied"; kabineOpenNotify(); }); await page.waitForSelector("#pnSet");
    await page.click("#pnSet"); check("Push: verweigert -> Hinweis und Knopf zu den iPhone-Einstellungen (app-settings:)", (await page.evaluate(() => window.__push.calls)).includes("openUrl:app-settings:"));
    await page.evaluate(() => { window.__push.perm = "prompt"; kabineOpenNotify(); }); await page.waitForSelector("#pnAllow"); await page.click("#pnAllow"); await page.waitForTimeout(200);
    check("Push: noch offen -> 'Benachrichtigungen erlauben' fragt iOS", (await page.evaluate(() => window.__push.calls)).includes("request"));
    check("Push: keine Skriptfehler", errs.length === 0, errs.join(" | ")); await ctx.close();
  }
  { // Die Push-Frage darf nie hinter einem Blatt verschwinden und nie die eigentliche Aktion aufhalten (Fehler vom 05.11.2026: Karte hinter der Kabine, Anfrage nie gesendet)
    const { ctx, page, errs } = await open2(pushCap);
    await page.evaluate(member);
    const z = await page.evaluate(() => { pushAsk("duel"); return new Promise((res) => setTimeout(() => { const bd = document.getElementById("pushYes").closest(".modal-backdrop"); res({ z: Number(bd.style.zIndex || getComputedStyle(bd).zIndex), kb: Number(getComputedStyle(document.querySelector(".kb-screen") || document.body).zIndex) || 62 }); }, 200)); });
    check("Push: Vorab-Karte liegt ueber Kabine (62) und Freund-hinzufuegen-Blatt (70)", z.z > 70 && z.z > z.kb, JSON.stringify(z));
    await page.click("#pushNo");
    // Freund hinzufuegen: Anfrage geht raus, auch wenn die Push-Karte nie beantwortet wird
    const r = await page.evaluate(async () => {
      localStorage.removeItem("startelo_push_ask"); window.__rpc.length = 0; frRefresh = async () => {}; frToastResult = () => {};
      frConfirmAdd({ id: "p2", username: "test_xi", crest_color: "#C8A24B", rank: "Kreisliga", level: 1 });
      document.getElementById("frCfYes").click();
      await new Promise((res) => setTimeout(res, 300));
      return { sent: window.__rpc.filter((c) => c[0] === "send_request").length, card: !!document.getElementById("pushYes") };
    });
    check("Push: Freundschaftsanfrage wird gesendet, ohne auf die Push-Frage zu warten", r.sent === 1, JSON.stringify(r));
    check("Push: danach (nicht davor) erscheint die Vorab-Karte", r.card === true, JSON.stringify(r));
    // Herausforderung: sdCreate kehrt zurueck, auch wenn die Karte offen bleibt
    await page.evaluate(() => { document.querySelectorAll("#pushYes").forEach((n) => n.closest(".modal-backdrop").remove()); localStorage.removeItem("startelo_push_ask"); sdMirror = () => {}; saveProfile = () => {}; frCall = async (n, a) => { window.__rpc.push([n, a]); return { ok: true, data: n === "create_duel" ? "d-new" : { id: "d-new" } }; }; });
    const d = await page.evaluate(async () => { const res = await Promise.race([sdCreate("f1", { rounds: 3, seconds: 60, difficulty: 3 }), new Promise((r) => setTimeout(() => r("haengt"), 1500))]); return { res, card: !!document.getElementById("pushYes") }; });
    check("Push: Herausforderung wird angelegt und zurueckgegeben, auch wenn die Push-Karte offen bleibt", d.res && d.res.ok === true && d.res.id === "d-new", JSON.stringify(d));
    check("Push: keine Skriptfehler", errs.length === 0, errs.join(" | ")); await ctx.close();
  }
  { // Statuszeile: zeigt, warum kein Gerät angemeldet ist
    const { ctx, page, errs } = await open2(pushCap, { perm: "granted" });
    await page.evaluate(member); await page.evaluate(() => pushEnsure());
    await page.evaluate(() => kabineOpenNotify()); await page.waitForSelector("#pnState");
    let t = await page.evaluate(() => document.getElementById("pnState").textContent);
    check("Push: Statuszeile ohne Token = 'wird angemeldet'", /angemeldet/.test(t) && !/Kein/.test(t), t);
    await page.evaluate(() => window.__push.listeners.registrationError({ error: "no valid aps-environment entitlement" })); await page.evaluate(() => kabineOpenNotify()); await page.waitForSelector("#pnState");
    t = await page.evaluate(() => document.getElementById("pnState").textContent);
    check("Push: Statuszeile zeigt den Fehler von iOS (z. B. fehlende Berechtigung)", /Kein Gerätecode von iOS: no valid aps-environment/.test(t), t);
    await page.evaluate(() => { pushDiag.err = ""; window.__push.listeners.registration({ value: "tok-ok-123456" }); }); await page.waitForTimeout(150);
    await page.evaluate(() => kabineOpenNotify()); await page.waitForSelector("#pnState");
    t = await page.evaluate(() => document.getElementById("pnState").textContent);
    check("Push: Statuszeile mit Token und Konto = 'Dieses iPhone ist angemeldet.'", /Dieses iPhone ist angemeldet/.test(t), t);
    check("Push: keine Skriptfehler", errs.length === 0, errs.join(" | ")); await ctx.close();
  }
  { // Gast und Browser: Push taucht nicht auf
    const { ctx, page, errs } = await open2(pushCap);
    await page.evaluate(() => { online.state = "guest"; return pushAsk("duel"); }); await page.waitForTimeout(150);
    check("Push: als Gast keine Karte, keine Frage", !(await page.evaluate(() => !!document.getElementById("pushYes"))) && (await page.evaluate(() => window.__push.calls)).length === 0);
    await ctx.close();
    const p2 = await (await browser.newContext({ serviceWorkers: "block" })).newPage(); const e2 = []; p2.on("pageerror", (e) => e2.push(e.message));
    await p2.goto("file://" + html, { waitUntil: "domcontentloaded" });
    const web = await p2.evaluate(async () => { online.state = "member"; online.userId = "u"; online.account = { username: "flo_xi", crest: "#C8A24B", code: "X", discoverable: "all" }; await pushAsk("duel"); await pushEnsure(); await pushUnregister(); kabineOpenSettings(); return { card: !!document.getElementById("pushYes"), item: !!document.getElementById("kbSPush"), avail: pushAvailable() }; });
    check("Push: im Browser kein Plugin, keine Karte, kein Menuepunkt, keine Fehler", !web.card && !web.item && !web.avail && e2.length === 0, JSON.stringify(web) + e2.join("|"));
  }
}
await browser.close();
console.log(fails ? `${fails} von ${total} Pruefungen FALSCH` : `Alle ${total} Pruefungen bestanden`);
process.exit(fails ? 1 : 0);
