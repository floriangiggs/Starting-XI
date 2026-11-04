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
await browser.close();
console.log(fails ? `${fails} von ${total} Pruefungen FALSCH` : `Alle ${total} Pruefungen bestanden`);
process.exit(fails ? 1 : 0);
