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
await browser.close();
console.log(fails ? `${fails} von ${total} Pruefungen FALSCH` : `Alle ${total} Pruefungen bestanden`);
process.exit(fails ? 1 : 0);
