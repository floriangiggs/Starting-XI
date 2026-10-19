// Toene (Prompt 55): alle 11 Klaenge offline rendern (Pegel, Laenge, keine Fehler), Schalter, Kombo-Tonhoehe, Token-Gutschriften nur einmal,
// Einbindung (ok/final/stars/perfect/coinIn/levelup/kick/walk/duelWin), Einstellung im Scout-Profil, kein Rauschen im Code.
// Aufruf: node tools/test-sound.mjs
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const html = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "startelf_check.html");
const src = fs.readFileSync(html, "utf8");
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra ? ": " + extra : ""}`); } };
// Statische Pruefungen: kein Rauschen/Wisch-Klang, nur die elf Namen
const block = src.slice(src.indexOf("/* ================= TÖNE (Prompt 55)"), src.indexOf("/* ================= INIT ================="));
check("kein createBuffer/Rauschen im Ton-Block", !/createBuffer|Math\.random|noise|crowd/.test(block));
check("keine Audiodateien/externe Quellen", !/\.mp3|\.wav|\.ogg|new Audio\(|fetch\(/.test(block));
for (const n of ["near", "shift", "pick", "coinOut", "reveal", "deny", "load", "pass", "fail", "streak", "trophy", "tick", "roundWin", "roundLose", "duelLose", "sheet"]) check(`Ton "${n}" nicht eingebaut`, !new RegExp(`\\n\\s{2}${n}:\\s*\\(`).test(block));

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
const page = await ctx.newPage(); const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("file://" + html); await page.waitForTimeout(6500);

// 1) Alle Toene offline rendern
const names = ["ok", "wheel", "wheelEnd", "coinIn", "kick", "final", "stars", "perfect", "levelup", "world", "walk", "walkKnock", "duelWin"];
const res = await page.evaluate(async (names) => {
  const out = {}, keep = [sfxCtx, sfxMaster, sfxOut], sr = 44100;
  for (const n of names) {
    const oc = new OfflineAudioContext(1, sr * 12, sr); sfxCtx = oc;
    const comp = oc.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 4;
    sfxMaster = oc.createGain(); sfxMaster.gain.value = 0.7; sfxMaster.connect(comp); comp.connect(oc.destination); sfxOut = sfxMaster;
    const g = oc.createGain(); g.connect(sfxMaster); sfxOut = g;
    SFX[n](0.02, { combo: 2, dur: n === "walk" ? 5 : 4.3 });
    const buf = await oc.startRendering(), d = buf.getChannelData(0); let pk = 0, last = 0, nan = false;
    for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (!isFinite(d[i])) nan = true; if (v > pk) pk = v; if (v > 0.01) last = i; }
    out[n] = { peak: +pk.toFixed(3), len: +(last / sr).toFixed(2), nan };
  }
  [sfxCtx, sfxMaster, sfxOut] = keep; return out;
}, names);
for (const n of names) { const r = res[n]; check(`Ton ${n}: Spitzenpegel 0,05-0,6 (${r.peak})`, r.peak >= 0.05 && r.peak <= 0.6 && !r.nan, JSON.stringify(r)); }
check("Dauer: final ≈ 1,5 s, stars ≈ 1,9 s, world ≈ 3,5-4 s", res.final.len > 1.2 && res.final.len < 1.8 && res.stars.len > 0.9 && res.stars.len < 2.4 && res.world.len > 3 && res.world.len < 4.5, JSON.stringify([res.final.len, res.stars.len, res.world.len]));

// 2) Schalter + Kombo + Token einmal
await page.mouse.click(10, 10); await page.waitForTimeout(300);
const st = await page.evaluate(() => { sfxContext(); return sfxCtx && sfxCtx.state; });
check("AudioContext laeuft nach Nutzer-Geste", st === "running", String(st));
const sw = await page.evaluate(() => {
  const calls = []; const orig = {}; for (const k of Object.keys(SFX)) { orig[k] = SFX[k]; SFX[k] = (t, o) => { calls.push(k + ":" + ((o || {}).combo !== undefined ? o.combo : "")); return orig[k](t, o || {}); }; }
  profile.sound.on = false; const a = sfx("ok", {}); const aN = calls.length;
  profile.sound.on = true; sfxTail = 0; const b = sfx("ok", { combo: 0 }); const bN = calls.length;
  window.__orig = orig; window.__calls = calls; return { aNull: a === null, aN, bNum: typeof b === "number", bN };
});
check("Ton aus: sfx() spielt nichts", sw.aNull && sw.aN === 0, JSON.stringify(sw)); check("Ton an: spielt", sw.bNum && sw.bN === 1);
const pitch = await page.evaluate(() => { const f = []; const ob = sfxBell; sfxBell = (fr, ...r) => { f.push(fr); return ob(fr, ...r); }; sfx("ok", { combo: 0 }); sfx("ok", { combo: 3 }); sfx("ok", { combo: 20 }); sfxBell = ob; return f; });
check("Kombo erhoeht die Tonhoehe (Cap bei Stufe 8)", pitch.length === 3 && pitch[1] > pitch[0] && pitch[2] === 1568 * 2 && pitch[0] === 523.25 * 2, JSON.stringify(pitch));
const coin = await page.evaluate(() => { let n = 0; const o = SFX.coinIn; SFX.coinIn = (t, op) => { n++; return o(t, op); }; sfxLastStart.coinIn = undefined; sfx("coinIn"); sfx("coinIn"); sfx("coinIn", { after: true }); SFX.coinIn = o; return n; });
check("Mehrere Token-Gutschriften = ein Ton", coin === 1, String(coin));
const celeb = await page.evaluate(() => { let n = 0; const o = SFX.perfect; SFX.perfect = (t, op) => { n++; return o(t, op); }; sfxLastStart.perfect = undefined; sfxTail = 0; sfx("perfect"); sfx("perfect"); SFX.perfect = o; return n; });
check("Feiern laufen nie doppelt", celeb === 1, String(celeb));
const queue = await page.evaluate(() => { sfxTail = 0; sfxLastStart.levelup = undefined; sfx("final"); const w = sfx("levelup"); return w; });
check("Fanfare wartet auf den laufenden Abpfiff (>1 s)", queue > 1, String(queue));
const world = await page.evaluate(() => { sfx("final"); sfx("world"); return Object.keys(sfxGroups).includes("world") && !Object.keys(sfxGroups).includes("final"); });
check("Welt-Feier blendet andere Toene aus", world);

// 3) Einbindung: sfx-Aufrufe protokollieren, echtes Level spielen
await page.evaluate(() => { window.__log = []; const o = window.sfx; window.sfx = function (n, op) { window.__log.push(n); return o.call(this, n, op); }; sfx = window.sfx; });
await page.evaluate(() => { profile.level = 12; saveProfile(profile); const m = getMatchesByTier(1)[0]; currentLevelContext = { tier: 1, index: 0, m }; navStack.length = 0; navigate("start"); startMatch(m); });
await page.waitForTimeout(600);
await page.click("#toPitchBtn"); await page.waitForTimeout(600);
let log = await page.evaluate(() => window.__log.slice());
check("Anpfiff-Pfiff beim Tippen auf den Start-Knopf", log.includes("kick"), JSON.stringify(log));
await page.evaluate(() => {
  const m = currentMatch, inputs = [...document.querySelectorAll("#pitchView .pos-input")].filter(i => !i.disabled);
  window.__log.length = 0;
  inputs.slice(0, 3).forEach((i) => { i.value = m.players[i.dataset.abbr]; i.dispatchEvent(new Event("input", { bubbles: true })); });
});
log = await page.evaluate(() => window.__log.slice());
check("ok: ein Ton je richtigem Namen", log.filter(x => x === "ok").length === 3, JSON.stringify(log));
await page.evaluate(() => { window.__log.length = 0; document.querySelector('[data-act="reveal"], #srRevealBtn') && 0; });
// alle richtig -> Auswerten
await page.evaluate(() => { const m = currentMatch; document.querySelectorAll("#pitchView .pos-input").forEach((i) => { if (!i.disabled && !i.classList.contains("ok")) { i.value = m.players[i.dataset.abbr]; i.dispatchEvent(new Event("input", { bubbles: true })); } }); window.__log.length = 0; });
await page.click("#checkBtn"); await page.waitForTimeout(500);
await page.evaluate(() => { const b = [...document.querySelectorAll(".modal-backdrop button")].find((x) => /Auswerten/.test(x.textContent)); if (b) b.click(); });
await page.waitForTimeout(800);
log = await page.evaluate(() => window.__log.slice());
check("Auswerten: final -> stars -> perfect in dieser Reihenfolge", log.indexOf("final") >= 0 && log.indexOf("stars") > log.indexOf("final") && log.indexOf("perfect") > log.indexOf("stars"), JSON.stringify(log));
check("Auswerten: coinIn (Token verdient)", log.includes("coinIn"), JSON.stringify(log));
const starAnim = await page.evaluate(() => [...document.querySelectorAll(".result-stars .star-pop")].map((e) => e.style.animationDelay));
check("Sterne-Animation gestaffelt (0,32 s je Stern)", starAnim.length === 3 && parseFloat(starAnim[1]) - parseFloat(starAnim[0]) > 0.3 && parseFloat(starAnim[2]) - parseFloat(starAnim[1]) > 0.3, JSON.stringify(starAnim));
// 4) Schalter im Scout-Profil
await page.evaluate(() => { document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove()); navStack.length = 0; navigate("start"); openProfileSheet("ov"); });
await page.waitForTimeout(900);
const ui = await page.evaluate(() => ({ tg: !!document.getElementById("sndToggle"), vol: document.getElementById("sndVol") && document.getElementById("sndVol").value, on: sfxOn() }));
check("Ton-Schalter + Regler im Scout-Profil", ui.tg && ui.vol === "70" && ui.on, JSON.stringify(ui));
await page.evaluate(() => { window.__log.length = 0; }); await page.click("#sndToggle"); await page.waitForTimeout(200);
const off = await page.evaluate(() => ({ on: profile.sound.on, dis: document.getElementById("sndVol").disabled, log: window.__log.slice() }));
check("Ausschalten: kein Probeton, Regler gesperrt", off.on === false && off.dis === true && off.log.length === 0, JSON.stringify(off));
await page.click("#sndToggle"); await page.waitForTimeout(200);
const on = await page.evaluate(() => ({ on: profile.sound.on, log: window.__log.slice() }));
check("Einschalten spielt den Probeton \"ok\"", on.on === true && on.log.includes("ok"), JSON.stringify(on));
await page.evaluate(() => { const v = document.getElementById("sndVol"); v.value = 30; v.dispatchEvent(new Event("input", { bubbles: true })); v.dispatchEvent(new Event("change", { bubbles: true })); });
const vol = await page.evaluate(() => ({ v: profile.sound.volume, m: sfxMaster.gain.value, saved: JSON.parse(localStorage.getItem(PROFILE_KEY)).sound.volume }));
check("Lautstaerke wirkt auf Master und wird gespeichert", Math.abs(vol.v - 0.3) < 1e-6 && Math.abs(vol.m - 0.3) < 1e-6 && Math.abs(vol.saved - 0.3) < 1e-6, JSON.stringify(vol));
if (process.argv.includes("--shots")) await page.screenshot({ path: process.argv[process.argv.indexOf("--shots") + 1] + "/ton_profil.png" });
// 6) Duell: Walkout (walk, 3 Klopfer, Pfiff), Runde (ok, final), Sieg (duelWin einmal)
await page.evaluate(() => { document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove()); window.DUEL_TEST_SECONDS = 120; profile.duelName = "Anna"; profile.duelHandle = "anna"; saveProfile(profile);
  const id = createDuel({ rounds: 1, seconds: 120, difficulty: 0 }); profile.duels[id].opponent = { name: "Tim", deviceId: "t9", handle: "tim" }; window.__did = id; navStack.length = 0; navigate("start"); window.__log.length = 0; startDuelRun(id); });
await page.waitForTimeout(17000);
log = await page.evaluate(() => window.__log.slice());
check("Walkout: walk einmal, 3 Countdown-Klopfer, 1 Pfiff", log.filter(x => x === "walk").length === 1 && log.filter(x => x === "walkKnock").length === 3 && log.filter(x => x === "kick").length === 1, JSON.stringify(log));
check("Walkout beendet -> Runde laeuft", await page.evaluate(() => duelRun && duelRun.phase === "play"));
await page.evaluate(() => { window.__log.length = 0; const r = duelRun, d = profile.duels[r.id], m = dailyMatchById(d.lineups[r.round]); [...document.querySelectorAll("#duelPlayView .pos-input")].slice(0, 2).forEach((i) => { i.value = m.players[i.dataset.abbr]; i.dispatchEvent(new Event("input", { bubbles: true })); }); });
log = await page.evaluate(() => window.__log.slice());
check("Duell-Runde: ok je richtigem Namen, Tonhoehe steigt", log.filter(x => x === "ok").length === 2, JSON.stringify(log));
await page.evaluate(() => { window.__log.length = 0; document.getElementById("duelGive").click(); }); await page.waitForTimeout(400);
log = await page.evaluate(() => window.__log.slice());
check("Duell-Runde: Abpfiff (final) beim Abgeben", log.includes("final"), JSON.stringify(log));
await page.evaluate(() => { document.querySelectorAll(".du-next, #duelNext").forEach((b) => b.click()); }); await page.waitForTimeout(700);
await page.evaluate(() => { const id = window.__did, d = profile.duels[id]; d.theirs = [{ correct: 0, seconds: 120, left: 0 }]; evaluateDuel(id); window.__log.length = 0; activeResultId = id; navStack.length = 0; navigate("start"); navigate("duelresult"); }); await page.waitForTimeout(800);
log = await page.evaluate(() => window.__log.slice());
check("Duell gewonnen: duelWin genau einmal", log.filter(x => x === "duelWin").length === 1, JSON.stringify(log));
await page.evaluate(() => { window.__log.length = 0; renderDuelResult(); });
check("Erneutes Zeichnen: kein zweiter Sieges-Ton", (await page.evaluate(() => window.__log.filter(x => x === "duelWin").length)) === 0);
// 5) Migration: altes Profil ohne sound
const mig = await page.evaluate(() => { const raw = JSON.parse(localStorage.getItem(PROFILE_KEY)); delete raw.sound; localStorage.setItem(PROFILE_KEY, JSON.stringify(raw)); return true; });
await page.reload(); await page.waitForTimeout(6500);
check("Migration: Standard an, 70 %", await page.evaluate(() => profile.sound && profile.sound.on === true && profile.sound.volume === 0.7));
check("Konsolenfehler", !errs.length, errs.join("|"));
await browser.close();
console.log(fails ? `\n${fails} von ${total} FALSCH` : `OK - ${total} Ton-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
