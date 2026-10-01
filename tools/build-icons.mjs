// Rendert die App-Icon-Vorlagen aus icons/source/*.svg (Prompt 13d) in alle
// benoetigten PNG-Groessen und ersetzt die bestehenden Dateien in icons/.
// Nutzt Playwright (echter Chromium-Renderer) statt sharp/librsvg, damit
// Farbverlaeufe und der feDropShadow-Filter exakt wie in den *-preview.png
// aussehen - librsvg-basierte Renderer unterstuetzen SVG-Filter nur teilweise.
// Aufruf: node tools/build-icons.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "icons");
const sourceDir = path.join(iconsDir, "source");

async function renderSvg(page, svgFile, size) {
  const svgMarkup = fs.readFileSync(path.join(sourceDir, svgFile), "utf8");
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><html><head><style>
      html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden;}
      svg{display:block;width:${size}px;height:${size}px;}
    </style></head><body>${svgMarkup}</body></html>`
  );
  return page.screenshot({ omitBackground: false });
}

const browser = await chromium.launch();
const page = await browser.newPage();

// "any"-Icons + Apple-Touch-Icon + 1024er-Vorlage: aus app-icon.svg (mit Goldrahmen).
const anyTargets = [
  { out: "icon-512.png", size: 512 },
  { out: "icon-192.png", size: 192 },
  { out: "apple-touch-icon.png", size: 180 },
  { out: "icon-1024.png", size: 1024 },
];
for (const { out, size } of anyTargets) {
  const png = await renderSvg(page, "app-icon.svg", size);
  fs.writeFileSync(path.join(iconsDir, out), png);
  console.log(`geschrieben: icons/${out} (${size}x${size}, aus app-icon.svg)`);
}

// Maskable-Icons: aus app-icon-maskable.svg (ohne Goldrahmen, Safe-Zone-Motiv).
const maskableTargets = [
  { out: "icon-512-maskable.png", size: 512 },
  { out: "icon-192-maskable.png", size: 192 },
];
for (const { out, size } of maskableTargets) {
  const png = await renderSvg(page, "app-icon-maskable.svg", size);
  fs.writeFileSync(path.join(iconsDir, out), png);
  console.log(`geschrieben: icons/${out} (${size}x${size}, aus app-icon-maskable.svg)`);
}

// Favicons: eigene vereinfachte Vorlage (app-icon-favicon.svg) - das volle
// Motiv mit 11 Punkten ist bei 16/32px nicht mehr erkennbar (geprueft),
// daher reduziert auf Feld-Farbstimmung + leuchtender Punkt + Goldrahmen.
for (const size of [32, 16]) {
  const png = await renderSvg(page, "app-icon-favicon.svg", size);
  fs.writeFileSync(path.join(iconsDir, `favicon-${size}.png`), png);
  console.log(`geschrieben: icons/favicon-${size}.png (${size}x${size}, aus app-icon-favicon.svg)`);
}

await browser.close();
