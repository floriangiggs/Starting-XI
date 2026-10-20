// Prueft fuer jede Formation aus PITCH_LAYOUTS bei mehreren Viewport-Groessen die Spiel-Ansicht (Taktiktafel, Prompt 42) auf Ueberlappungen,
// abgeschnittene Namen und Scrollen; ausserdem den Level-Pfad (Prompt 11c).
// Aufruf: node tools/check-overlap.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "..", "startelf_check.html");
const WIDTHS = [360, 375, 402, 430];

function overlap(a, b) {
  return a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + htmlPath);

const formations = await page.evaluate(() => Object.keys(PITCH_LAYOUTS));

let totalIssues = 0;

// Spiel-Ansicht "Taktiktafel" (Prompt 42): je Formation x Breite x Hoehe in drei Zustaenden (leer / alle richtig / lange Namen + alle Abzeichen):
// Schild+Reiter duerfen sich nicht ueberlappen (auch nicht mit Abzeichen, Kombo-Chip, Bank-Knopf), nichts ausserhalb der Tafel, kein Scrollen,
// Namen komplett im Schild (scrollWidth <= clientWidth), Tafel/Leiste/Auswerten ueberlappen sich nicht.
const HEIGHTS = [667, 812, 932];
const STATES = ["leer", "richtig", "lang+Abzeichen"]; // lang: die laengsten echten Namen auf den 4 engsten Positionen, alle Abzeichen
const overlapRect = (a, b, pad = 0) => a.left < b.right - pad && b.left < a.right - pad && a.top < b.bottom - pad && b.top < a.bottom - pad;
for (const width of WIDTHS) {
  for (const height of HEIGHTS) {
    await page.setViewportSize({ width, height });
    for (const formation of formations) {
      for (const state of STATES) {
        const r = await page.evaluate(({ formationName, state }) => {
          const match = [...LINEUP_CHALLENGES, ...DAILY_CHALLENGES].find((c) => c.formation === formationName);
          if (!match) return { error: "keine Aufstellung mit dieser Formation gefunden" };
          profile.hintTokens = 9; profile.drafts = {}; currentLevelContext = null; currentDailyChallenge = null;
          document.querySelectorAll(".screen").forEach((s) => { s.hidden = true; });
          document.getElementById("screen-game").hidden = false;
          navStack = ["start", "game"];
          currentMatch = match;
          startMatch(match);
          renderPitch();
          const root = document.getElementById("spRoot");
          root.classList.remove("intro"); root.classList.add("fitting");
          const inputs = [...root.querySelectorAll(".pos-input")];
          const longNames = ["Lisandro Martínez", "N. Schlotterbeck", "Alexander-Arnold", "Heuer Fernandes", "Wright-Phillips", "Schweinsteiger", "Błaszczykowski"]; // die laengsten echten Namen der Datenbasis
          inputs.forEach((inp, i) => {
            if (state === "richtig") { inp.value = match.players[inp.dataset.abbr]; inp.classList.add("ok"); }
            else if (state === "lang+Abzeichen") {
              const tight = [...inputs].sort((x, y) => (+x.closest(".sp-slot").dataset.maxw) - (+y.closest(".sp-slot").dataset.maxw)).slice(0, 4).includes(inp);
              const cls = ["ok", "near", "revealed", "prefilled"][i % 4];
              inp.value = tight && cls !== "near" ? longNames[i % longNames.length] : match.players[inp.dataset.abbr]; // eigene (falsche) Eingaben koennen nicht gekuerzt werden - die Schild-Anzeige gilt fuer geloeste Namen
              inp.classList.add(cls);
            }
            applyNameFit(inp);
          });
          spFit(root); // neu messen mit den Zustaenden (Dichte-Stufe, Schildbreite)
          inputs.forEach((inp) => { applyNameFit(inp); spSyncSlot(inp, false); });
          root.classList.add("fitting");
          const R = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; };
          const frame = R(root.querySelector("#spFrame")), pitch = R(root.querySelector("#spPitch"));
          const boxes = [...root.querySelectorAll(".sp-slot")].map((s) => {
            const t = R(s.querySelector(".sp-ptag")), i = R(s.querySelector(".pos-input")), bd = s.querySelector(".sp-bdg");
            const inp = s.querySelector(".pos-input");
            return { abbr: s.dataset.a, rects: [t, i, ...(bd ? [R(bd)] : [])], box: { left: Math.min(t.left, i.left), right: Math.max(t.right, i.right), top: Math.min(t.top, i.top), bottom: Math.max(t.bottom, i.bottom) }, textOk: inp.scrollWidth <= inp.clientWidth + 1 };
          });
          const extras = ["#benchBtn", "#comboChip.on"].map((q) => root.querySelector(q)).filter(Boolean).map((e) => R(e));
          const gs = document.getElementById("screen-game");
          return { boxes, extras, frame, pitch, tray: R(root.querySelector(".sp-tray")), cta: R(root.querySelector(".sp-bottom")), top: R(root.querySelector(".lv-top")),
            scroll: gs.scrollHeight > gs.clientHeight + 1, density: root.className, vh: innerHeight, vw: innerWidth };
        }, { formationName: formation, state });
        if (r.error) { console.log(`[${width}x${height}] ${formation}: ${r.error}`); continue; }
        const issues = [];
        for (let i = 0; i < r.boxes.length; i++) {
          const a = r.boxes[i];
          if (!a.textOk) issues.push(`${a.abbr}: Name im Schild abgeschnitten`);
          if (a.box.left < r.frame.left || a.box.right > r.frame.right || a.box.top < r.frame.top || a.box.bottom > r.frame.bottom) issues.push(`${a.abbr}: ausserhalb der Tafel`);
          for (let j = i + 1; j < r.boxes.length; j++) {
            const b = r.boxes[j];
            if (a.rects.some((x) => b.rects.some((y) => overlapRect(x, y)))) issues.push(`${a.abbr} <-> ${b.abbr}`);
          }
          for (const ex of r.extras) if (overlapRect(a.box, ex)) issues.push(`${a.abbr} <-> Bank/Kombo`);
        }
        if (r.scroll) issues.push("Bildschirm scrollt");
        if (overlapRect(r.frame, r.cta, 1) || overlapRect(r.tray, r.cta, 1)) issues.push("Tafel/Leiste und Auswerten ueberlappen");
        if (r.cta.bottom > r.vh + 0.5) issues.push("Auswerten unter dem Bildschirmrand");
        if (issues.length > 0) {
          totalIssues += issues.length;
          console.log(`[${width}x${height}] ${formation} (${state}, ${r.density}): ${[...new Set(issues)].join("; ")}`);
        }
      }
    }
  }
}

// Alle echten Aufstellungen (Kampagne + Tag-Pool) mit ihren echten Namen, alle Positionen richtig (fette Schrift, Abzeichen), je Breite x Hoehe:
// keine Ueberlappung, kein abgeschnittener Name.
{
  const ids = await page.evaluate(() => [...LINEUP_CHALLENGES, ...DAILY_CHALLENGES].map((m) => m.id));
  let n = 0;
  for (const [width, height] of [[360, 667], [375, 812], [402, 874], [430, 932]]) {
    await page.setViewportSize({ width, height });
    for (const id of ids) {
      const r = await page.evaluate((id) => {
        const match = [...LINEUP_CHALLENGES, ...DAILY_CHALLENGES].find((m) => m.id === id);
        profile.hintTokens = 9; profile.drafts = {}; currentLevelContext = null; currentDailyChallenge = null;
        document.querySelectorAll(".screen").forEach((s) => { s.hidden = true; });
        document.getElementById("screen-game").hidden = false; navStack = ["start", "game"];
        currentMatch = match; startMatch(match); renderPitch();
        const root = document.getElementById("spRoot"); root.classList.remove("intro"); root.classList.add("fitting");
        const inputs = [...root.querySelectorAll(".pos-input")];
        inputs.forEach((inp, i) => { if (!inp.disabled) { inp.value = match.players[inp.dataset.abbr]; inp.classList.add(i % 3 === 0 ? "near" : "ok"); } applyNameFit(inp); spSyncSlot(inp, false); });
        const R = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; };
        const slots = [...root.querySelectorAll(".sp-slot")].map((s) => ({ a: s.dataset.a, rects: [".sp-ptag", ".pos-input", ".sp-bdg"].map((q) => s.querySelector(q)).filter(Boolean).map(R), ok: s.querySelector(".pos-input").scrollWidth <= s.querySelector(".pos-input").clientWidth + 1 }));
        const bad = [];
        slots.forEach((a, i) => { if (!a.ok) bad.push(`${a.a} abgeschnitten`); for (let j = i + 1; j < slots.length; j++) if (a.rects.some((x) => slots[j].rects.some((y) => x.left < y.right && y.left < x.right && x.top < y.bottom && y.top < x.bottom))) bad.push(`${a.a}<->${slots[j].a}`); });
        const gs = document.getElementById("screen-game");
        if (gs.scrollHeight > gs.clientHeight + 1) bad.push("scrollt");
        return bad;
      }, id);
      n++;
      if (r.length) { totalIssues += r.length; console.log(`[${width}x${height}] ${id}: ${[...new Set(r)].join("; ")}`); }
    }
  }
  console.log(`Alle echten Aufstellungen: ${n} Pruefungen`);
}

// Level-Pfad (Prompt 51): je Welt x Spielstand (neu / mittendrin mit Entwurf + Lösung gesehen / alles geschafft) x Breite: Knoten, Sterne, Abzeichen,
// "Du"-Magnet und Schild/Zettel ueberlappen sich nicht untereinander, und kein Knoten liegt auf einer Requisite (Baum, Bank, Kamera ...).
const tiers = await page.evaluate(() => ROADMAP_NODES.map((n) => n.tier));
for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  for (const tier of tiers) {
    for (const state of ["neu", "mitte", "fertig"]) {
      const result = await page.evaluate(({ tier, state }) => {
        const matches = getMatchesByTier(tier);
        if (matches.length === 0) return { skip: true };
        profile.campaign.levelPassed = {}; profile.campaign.stars = {}; profile.campaign.solutionSeen = {}; profile.drafts = {};
        const until = state === "neu" ? 0 : state === "fertig" ? matches.length : Math.floor(matches.length / 2);
        for (let i = 0; i < until; i++) { profile.campaign.levelPassed[matches[i].id] = true; profile.campaign.stars[matches[i].id] = (i % 3) + 1; }
        if (state === "mitte") { profile.drafts["c:" + matches[until].id] = { mode: "c", id: matches[until].id, entries: { TW: { v: "x", s: "typed" } }, updated: Date.now() }; profile.campaign.solutionSeen[matches[1].id] = true; }
        document.querySelectorAll(".screen").forEach((s) => { s.hidden = true; });
        document.getElementById("screen-levelpath").hidden = false;
        campaignTier = tier;
        renderCampaignLevels("back");
        lpLayout();
        const R = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
        const parts = [];
        document.querySelectorAll("#lpWorld .lp-node").forEach((nd, i) => {
          nd.querySelectorAll(".lp-nbtn, .lp-nstars, .lp-badge, .lp-du, .lp-wsign").forEach((el) => parts.push({ node: i, kind: el.className.baseVal || el.className.split(" ")[0], ...R(el) }));
        });
        const props = [...document.querySelectorAll("#lpWorld svg.lp-near > g, #lpWorld svg.lp-road > g")].map(R).filter((r) => r.width > 0);
        return { parts, props, sign: R(document.getElementById("lpSign")), note: R(document.getElementById("lpNote")), world: R(document.getElementById("lpWorld")) };
      }, { tier, state });
      if (result.skip) continue;
      const issues = [];
      const parts = result.parts;
      for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
        if (parts[i].node !== parts[j].node && overlap(parts[i], parts[j])) issues.push(`Level ${parts[i].node + 1} ${parts[i].kind} <-> Level ${parts[j].node + 1} ${parts[j].kind}`);
      }
      // Holzschild "Weiter aufstellen" (Prompt 57): nicht auf Teilen des eigenen Knotens, nicht auf Schild/Zettel/Requisiten, im Spielfeld
      for (const ws of parts.filter((x) => x.kind.includes("lp-wsign"))) {
        for (const o of parts) if (o !== ws && o.node === ws.node && overlap(ws, o)) issues.push(`Level ${ws.node + 1} Weiter-Schild <-> ${o.kind}`);
        if (overlap(ws, result.note) || overlap(ws, result.sign)) issues.push(`Level ${ws.node + 1} Weiter-Schild auf Schild/Zettel`);
        // Requisiten (Baeume, Pylonen) duerfen hinter dem Schild stehen - die App weicht ihnen aus, wo es geht (lpPlaceSign), deckt sie sonst aber nur zu
        if (ws.left < result.world.left - 0.5 || ws.left + ws.width > result.world.left + result.world.width + 0.5) issues.push(`Level ${ws.node + 1} Weiter-Schild ausserhalb des Spielfelds`);
      }
      for (const pt of parts) {
        if (pt.kind.includes("lp-du") && (overlap(pt, result.note) || overlap(pt, result.sign))) issues.push(`Level ${pt.node + 1} "Du" auf Schild/Zettel`);
        if (pt.kind.includes("lp-nbtn")) for (const pr of result.props) if (overlap({ left: pt.left + 8, top: pt.top + 8, width: pt.width - 16, height: pt.height - 16 }, pr)) { issues.push(`Level ${pt.node + 1} liegt auf Requisite`); break; }
      }
      if (issues.length > 0) {
        totalIssues += issues.length;
        console.log(`[${width}px] Level-Pfad Welt ${tier} (${state}): ${issues.length} Befund(e): ${[...new Set(issues)].slice(0, 6).join("; ")}`);
      }
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
