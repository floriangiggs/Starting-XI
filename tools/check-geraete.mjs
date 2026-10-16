// Geraete-Matrix (Prompt 50): fuehrt tools/check-safearea.mjs fuer acht Geraete mit simulierten Safe-Areas aus und gibt eine Tabelle aus.
// Aufruf: node tools/check-geraete.mjs
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "check-safearea.mjs");
const DEVICES = [["iPhone SE", "375,667,0,0"], ["iPhone 13 mini", "375,812,50,34"], ["iPhone 16", "393,852,59,34"], ["iPhone 16 Pro Max", "440,956,62,34"],
  ["Android klein", "360,780,24,0"], ["Android gross (Gesten)", "412,915,24,24"], ["Android 3-Tasten", "412,869,24,0"], ["Tablet hochkant", "768,1024,24,0"]];
let bad = 0; const rows = [];
for (const [name, dev] of DEVICES) {
  const r = spawnSync("node", [script], { env: { ...process.env, SA_DEVICE: dev }, encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || ""), probs = out.split("\n").filter((l) => /^\s{2}\S/.test(l) && !/^\(/.test(l.trim()));
  const blue = (out.match(/noch blau bei: (.*)/) || [])[1];
  rows.push(`${name.padEnd(24)} ${dev.padEnd(15)} ${r.status === 0 ? "ok" : "BEFUND"}${blue ? "  (blau: " + blue + ")" : ""}`);
  if (r.status !== 0) { bad++; probs.slice(0, 6).forEach((l) => rows.push("      " + l.trim())); }
}
console.log(rows.join("\n"));
console.log(bad ? `\n${bad} Geraet(e) mit Befund` : "\nOK - alle Geraete ohne Befund");
process.exit(bad ? 1 : 0);
