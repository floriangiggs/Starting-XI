// Prueft fuer jede Formation aus PITCH_LAYOUTS bei mehreren Viewport-Breiten,
// ob sich .pos-slot-Elemente auf dem Spielfeld ueberlappen (Prompt 2).
// Aufruf: node tools/check-overlap.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "..", "startelf_check.html");
const WIDTHS = [360, 375, 430];

function overlap(a, b) {
  return a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + htmlPath);

const formations = await page.evaluate(() => Object.keys(PITCH_LAYOUTS));

let totalIssues = 0;

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  for (const formation of formations) {
    const result = await page.evaluate((formationName) => {
      const match = LINEUP_CHALLENGES.find((c) => c.formation === formationName);
      if (!match) return { error: "keine Aufstellung mit dieser Formation gefunden" };
      document.querySelectorAll(".screen").forEach((s) => { s.hidden = true; });
      document.getElementById("screen-game").hidden = false;
      currentMatch = match;
      renderPitch();
      const slots = Array.from(document.querySelectorAll(".pos-slot"));
      return slots.map((el) => {
        const r = el.getBoundingClientRect();
        const abbr = el.querySelector(".pos-label").textContent;
        return { abbr, left: r.left, top: r.top, width: r.width, height: r.height };
      });
    }, formation);

    if (result.error) {
      console.log(`[${width}px] ${formation}: ${result.error}`);
      continue;
    }

    const issues = [];
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        if (overlap(result[i], result[j])) {
          issues.push(`${result[i].abbr} <-> ${result[j].abbr}`);
        }
      }
    }
    if (issues.length > 0) {
      totalIssues += issues.length;
      console.log(`[${width}px] ${formation}: ${issues.length} Ueberlappung(en): ${issues.join(", ")}`);
    }
  }
}

await browser.close();

if (totalIssues === 0) {
  console.log("OK - keine Ueberlappungen bei " + WIDTHS.join("/") + "px.");
  process.exit(0);
} else {
  console.log(`FEHLER - ${totalIssues} Ueberlappung(en) gefunden.`);
  process.exit(1);
}
