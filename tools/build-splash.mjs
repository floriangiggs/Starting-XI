// Erzeugt die nativen iOS-Bilder aus der App selbst (eine Quelle der Wahrheit):
//  - Start-Bild (Launch Screen): genau das Bild, in dem die Lade-Animation in der App beginnt (Bild bei 1000 ms, Buehne steht,
//    siehe runSplash/HANDOFF in startelf_check.html), 1290x2796 = 430x932 @3x. Die App blendet es aus, sobald sie darunter steht.
//  - App-Icon: icons/icon-1024.png (RGB, ohne Alpha) in den Asset-Katalog.
// Aufruf: node tools/build-splash.mjs        (danach: npm run cap:sync)
import { chromium } from "playwright";
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAT = join(ROOT, "ios/App/App/Assets.xcassets");
const T0 = 1000; // muss zu HANDOFF/T0 in runSplash passen

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, serviceWorkers: "block" });
await page.addInitScript((t) => {
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => "ios", Plugins: {} }; // wie in der App: Buehne steht, Fit wie das Start-Bild
  window.SPLASH_TEST_T = t;                                                                    // ein Bild bei t einfrieren
}, T0);
await page.goto("file://" + join(ROOT, "startelf_check.html"));
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => document.getElementById("ldBrand") && getComputedStyle(document.getElementById("ldBrand")).opacity === "1");
await page.waitForTimeout(300);
await page.screenshot({ path: join(CAT, "Splash.imageset/splash.png") });
await browser.close();

// Katalog: ein 3x-Bild, alte Capacitor-Vorlagen weg
for (const f of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) rmSync(join(CAT, "Splash.imageset", f), { force: true });
writeFileSync(join(CAT, "Splash.imageset/Contents.json"), JSON.stringify({ images: [{ idiom: "universal", filename: "splash.png", scale: "3x" }], info: { version: 1, author: "xcode" } }, null, 2) + "\n");
const sb = join(ROOT, "ios/App/App/Base.lproj/LaunchScreen.storyboard");
writeFileSync(sb, readFileSync(sb, "utf8").replace(/<image name="Splash" width="\d+" height="\d+"\/>/, '<image name="Splash" width="430" height="932"/>'));
if (!existsSync(join(ROOT, "icons/icon-1024.png"))) throw new Error("icons/icon-1024.png fehlt");
cpSync(join(ROOT, "icons/icon-1024.png"), join(CAT, "AppIcon.appiconset/AppIcon-512@2x.png"));
console.log("Start-Bild + App-Icon geschrieben");
