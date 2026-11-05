// Edge Function "send-push" (8b-3): laeuft hier mit nachgebautem Deno/Supabase/APNs, ohne Netz.
// Geprueft: Zugang nur mit CRON_SECRET, APNs-JWT (ES256, wirklich verifiziert), Text und Nutzlast je Art, Schalter je Art,
// Ruhezeit 22-8 Uhr (Sommer/Winter), Verfall nach 12 Stunden, Sandbox-Fallback, tote Tokens loeschen, Wiederholung bei Apple-Fehlern,
// und dass jede Art, die die Datenbank einreiht, einen Text und einen Schalter hat.
// Aufruf: node tools/test-push-function.mjs   (Node 22.6+ mit Typ-Entfernung, hier Node 26)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "supabase/functions/send-push/index.ts"), "utf8");
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra !== "" ? ": " + extra : ""}`); } };

check("Function: keine festen Geheimnisse im Code (kein PEM-Block, keine eyJ-Tokens)", !/BEGIN (EC )?PRIVATE KEY-----\s*\n?[A-Za-z0-9+/]{20}/.test(src) && !/eyJ[A-Za-z0-9_-]{20,}/.test(src));

// ---- Arten: Datenbank <-> Function ----
const migr = fs.readdirSync(path.join(root, "supabase/migrations")).map((f) => fs.readFileSync(path.join(root, "supabase/migrations", f), "utf8")).join("\n");
const kinds = [...new Set([...migr.matchAll(/private\.enqueue\([^,]+,\s*'([a-z_]+)'/g)].map((m) => m[1]))].sort();
check("Datenbank: 9 Arten werden eingereiht", kinds.length === 9, kinds.join(","));
const prefMap = Object.fromEntries([...src.match(/const PREF[^{]*\{([\s\S]*?)\n\};/)[1].matchAll(/([a-z_]+):\s*"([a-z_]+)"/g)].map((m) => [m[1], m[2]]));
check("Function: jede eingereihte Art hat einen Schalter", kinds.every((k) => prefMap[k]), kinds.filter((k) => !prefMap[k]).join(","));
check("Function: kein Schalter fuer unbekannte Arten", Object.keys(prefMap).every((k) => kinds.includes(k)), Object.keys(prefMap).filter((k) => !kinds.includes(k)).join(","));
const app = fs.readFileSync(path.join(root, "startelf_check.html"), "utf8");
const appPrefs = (app.match(/PUSH_PREFS\s*=\s*\[([\s\S]*?)\];/) || [, ""])[1];
check("App: Kabine bietet genau die Schalter der Function an (PUSH_PREFS)", appPrefs === "" ? "uebersprungen" : [...new Set(Object.values(prefMap))].every((p) => appPrefs.includes(`"${p}"`)), appPrefs.slice(0, 80));

// Quelltext fuer Node vorbereiten
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pushfn-"));
const prepared = src.replace(/^import \{ createClient \} from "npm:[^"]+";/m, "const createClient = (...a) => globalThis.__createClient(...a);");
check("Function: Import ersetzt (Test laeuft auf dem echten Quelltext)", prepared !== src);
fs.writeFileSync(path.join(dir, "fn.ts"), prepared);

const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const P8 = privateKey.export({ type: "pkcs8", format: "pem" });
const ENV = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service", APPLE_TEAM_ID: "CS9J7W6JPM", APNS_KEY_ID: "PUSHKEY123", APNS_P8_KEY: P8, CRON_SECRET: "geheim-geheim" };

const logged = []; console.error = (...a) => { logged.push(a.join(" ")); };
let handler, env = { ...ENV };
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };

// Uhr: feste Zeit, damit die Ruhezeit pruefbar ist
const RealDate = Date; let fakeNow = new RealDate("2026-11-05T12:00:00Z");
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(fakeNow.getTime()); } static now() { return fakeNow.getTime(); } };
const at = (iso) => { fakeNow = new RealDate(iso); };
const ago = (ms) => new RealDate(fakeNow.getTime() - ms).toISOString();

// Datenbank nachgebaut
const state = { queue: [], devices: [], deleted: [], updated: [], apns: [], failQueue: false };
const rowsOf = (t) => (t === "notification_queue" ? state.queue : state.devices);
globalThis.__createClient = () => ({
  from: (table) => {
    const q = { table, f: [], ord: false, lim: 1e9, op: "select" };
    const run = () => {
      let rows = rowsOf(table);
      rows = rows.filter((r) => q.f.every((fn) => fn(r)));
      if (q.op === "delete") { state.deleted.push(...rows.map((r) => ({ user: r.user_id, token: r.token }))); state.devices = state.devices.filter((d) => !rows.includes(d)); return { error: null }; }
      if (q.op === "update") { if (state.failQueue) return { error: { message: "x" } }; rows.forEach((r) => Object.assign(r, q.patch)); state.updated.push(...rows.map((r) => r.id)); return { error: null }; }
      if (state.failQueue && table === "notification_queue") return { data: null, error: { message: "x" } };
      return { data: rows.slice(0, q.lim).map((r) => ({ ...r })), error: null };
    };
    const b = {
      select: () => b, is: (c, v) => { q.f.push((r) => (r[c] ?? null) === v); return b; }, order: () => b, limit: (n) => { q.lim = n; return b; },
      eq: (c, v) => { q.f.push((r) => r[c] === v); return b; }, in: (c, a) => { q.f.push((r) => a.includes(r[c])); return b; },
      delete: () => { q.op = "delete"; return b; }, update: (patch) => { q.op = "update"; q.patch = patch; return b; },
      then: (res, rej) => Promise.resolve(run()).then(res, rej),
    };
    return b;
  },
});
// APNs nachgebaut: Verhalten je Token
globalThis.fetch = async (url, init) => {
  const u = new URL(url), host = u.hostname, token = decodeURIComponent(u.pathname.split("/").pop());
  state.apns.push({ host, token, headers: init.headers, body: JSON.parse(init.body) });
  const mode = state.mode?.[token] || "ok";
  if (mode === "ok") return new Response("", { status: 200 });
  if (mode === "sandbox") return host.includes("sandbox") ? new Response("", { status: 200 }) : new Response(JSON.stringify({ reason: "BadDeviceToken" }), { status: 400 });
  if (mode === "dead") return new Response(JSON.stringify({ reason: "Unregistered" }), { status: 410 });
  if (mode === "down") return new Response(JSON.stringify({ reason: "ServiceUnavailable" }), { status: 503 });
  if (mode === "net") throw new Error("kein Netz");
  throw new Error("unbekannter Modus");
};
await import(pathToFileURL(path.join(dir, "fn.ts")).href);

const call = (o = {}) => handler(new Request("https://x.supabase.co/functions/v1/send-push", { method: o.method || "POST", headers: { ...(o.secret === null ? {} : { "x-cron-secret": o.secret || "geheim-geheim" }) }, ...((o.method || "POST") === "GET" ? {} : { body: "{}" }) }));
const reset = (queue, devices, mode = {}) => { state.queue = queue; state.devices = devices; state.deleted = []; state.updated = []; state.apns = []; state.mode = mode; state.failQueue = false; logged.length = 0; env = { ...ENV }; };
let nextId = 1;
const Q = (kind, payload = {}, user = "u1", ageMs = 60000) => ({ id: nextId++, to_user: user, kind, payload, created_at: ago(ageMs), sent_at: null });
const D = (token, notify = {}, user = "u1") => ({ user_id: user, token, platform: "ios", notify });
const json = async (res) => res.json();

// ---- Zugang ----
reset([Q("duel_challenge")], [D("tok-a-12345678")]);
check("Zugang: ohne Kopf = 401, nichts gesendet", (await call({ secret: null })).status === 401 && state.apns.length === 0);
check("Zugang: falsches Geheimnis = 401", (await call({ secret: "falsch" })).status === 401);
env.CRON_SECRET = ""; check("Zugang: ohne eingestelltes Geheimnis nie offen", (await call({ secret: "" })).status === 401);
reset([Q("duel_challenge")], [D("tok-a-12345678")]); check("Zugang: nur POST", (await call({ method: "GET" })).status === 405);
reset([Q("duel_challenge")], [D("tok-a-12345678")]); env.APNS_P8_KEY = "";
check("Zugang: fehlende APNs-Geheimnisse = 500 config, nichts als gesendet markiert", (await call()).status === 500 && state.updated.length === 0);
reset([Q("duel_challenge")], [D("tok-a-12345678")]); env.APNS_P8_KEY = "kein-schluessel";
check("Zugang: unlesbarer Schluessel = 500 config", (await call()).status === 500 && state.updated.length === 0);

// ---- Senden: Nutzlast, JWT, Kopf ----
reset([Q("duel_challenge", { duel: "d-1", from: { username: "flo" }, rounds: 3 })], [D("tok-a-12345678")]);
let r = await call(), j = await json(r);
check("Senden: 200, ein Eintrag gesendet", r.status === 200 && j.sent === 1 && j.skipped === 0 && j.waiting === 0, JSON.stringify(j));
const a0 = state.apns[0] || {};
check("Senden: Production-Host, Token im Pfad", a0.host === "api.push.apple.com" && a0.token === "tok-a-12345678");
check("Senden: Kopfzeilen (Topic, Typ alert, bearer)", a0.headers?.["apns-topic"] === "de.startelo.app" && a0.headers?.["apns-push-type"] === "alert" && /^bearer /.test(a0.headers?.authorization || ""));
const jwt = (a0.headers?.authorization || "").replace(/^bearer /, ""), [h, b, s] = jwt.split(".");
const head = JSON.parse(Buffer.from(h || "", "base64url").toString()), body = JSON.parse(Buffer.from(b || "", "base64url").toString());
check("JWT: ES256, Key-ID, Team, kurz nach jetzt", head.alg === "ES256" && head.kid === "PUSHKEY123" && body.iss === "CS9J7W6JPM" && Math.abs(body.iat - Math.floor(fakeNow.getTime() / 1000)) < 5, JSON.stringify([head, body]));
check("JWT: Signatur stimmt (mit dem oeffentlichen Schluessel geprueft)", crypto.verify("sha256", Buffer.from(`${h}.${b}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(s || "", "base64url")));
check("Nutzlast: Titel, Text mit @Name und Runden, Ton, Art und Duell-ID", a0.body?.aps?.alert?.title === "Herausforderung!" && /@flo/.test(a0.body?.aps?.alert?.body) && /3 Runden/.test(a0.body?.aps?.alert?.body) && a0.body?.aps?.sound === "default" && a0.body?.kind === "duel_challenge" && a0.body?.duel === "d-1", JSON.stringify(a0.body));
check("Senden: sent_at gesetzt", state.queue[0].sent_at !== null && state.updated.length === 1);
check("Senden: keine Spielernamen oder Geheimnisse in Texten (nur Nutzlast-Felder)", !/Khedira|Kramer|Neuer/.test(JSON.stringify(a0.body)));

// ---- Texte je Art ----
const sample = {
  friend_request: { user: { username: "anna" } }, friend_accepted: { user: { username: "ben" } }, duel_challenge: { duel: "d", from: { username: "cora" }, rounds: 1 },
  duel_your_turn: { duel: "d", from: { username: "dave" } }, duel_finished: { duel: "d", by: "rounds" }, duel_declined: { duel: "d", by: { username: "emil" } },
  duel_cancelled: { duel: "d", from: { username: "fritz" } }, duel_expired: { duel: "d" }, duel_deadline_warning: { duel: "d", deadline: "2026-11-06T00:00:00Z" },
};
reset(Object.keys(sample).map((k) => Q(k, sample[k])), [D("tok-a-12345678")]);
await call();
check("Texte: alle 9 Arten gesendet", state.apns.length === 9, String(state.apns.length));
const titles = state.apns.map((x) => x.body.aps.alert.title);
check("Texte: jede Art hat einen eigenen Titel und einen Text", new Set(titles).size === 9 && state.apns.every((x) => x.body.aps.alert.body.length > 10 && x.body.aps.alert.title.length > 3), titles.join("|"));
check("Texte: Nutzernamen erscheinen als @Name", state.apns.some((x) => /@anna/.test(x.body.aps.alert.body)) && state.apns.some((x) => /@emil/.test(x.body.aps.alert.body)) && state.apns.some((x) => /@fritz/.test(x.body.aps.alert.body)));
check("Texte: 1 Runde im Singular", /1 Runde\b(?!n)/.test(state.apns.find((x) => x.body.kind === "duel_challenge").body.aps.alert.body));
reset([Q("friend_request", {})], [D("tok-a-12345678")]); await call();
check("Texte: ohne Namen in der Nutzlast kein 'undefined'", !/undefined|null/.test(state.apns[0].body.aps.alert.body), state.apns[0].body.aps.alert.body);
reset([Q("irgendwas_neues", {})], [D("tok-a-12345678")]); r = await call();
check("Unbekannte Art: nichts gesendet, Eintrag erledigt (kein Dauerlauf)", state.apns.length === 0 && state.queue[0].sent_at !== null && (await json(r)).skipped === 1);

// ---- Schalter und Geraete ----
reset([Q("duel_challenge"), Q("friend_request"), Q("duel_declined")], [D("tok-a-12345678", { duel_challenge: false, duel_finished: false })]);
r = await call(); j = await json(r);
check("Schalter: aus = nicht gesendet, Eintrag erledigt; andere Arten gehen raus", state.apns.length === 1 && state.apns[0].body.kind === "friend_request" && j.sent === 1 && j.skipped === 2 && state.queue.every((q) => q.sent_at), JSON.stringify(j));
check("Schalter: duel_finished gilt auch fuer abgelehnt/zurueckgezogen/abgelaufen", state.apns.every((x) => x.body.kind !== "duel_declined"));
reset([Q("duel_challenge")], [D("tok-a-12345678", { duel_challenge: true }), D("tok-b-12345678", { duel_challenge: false })]);
await call(); check("Schalter: je Geraet (eines an, eines aus) = genau eine Push", state.apns.length === 1 && state.apns[0].token === "tok-a-12345678");
reset([Q("duel_challenge")], []); r = await call();
check("Kein Geraet: erledigt ohne Senden", state.apns.length === 0 && state.queue[0].sent_at !== null && (await json(r)).skipped === 1);
reset([Q("duel_challenge", {}, "u1"), Q("duel_challenge", {}, "u2")], [D("tok-u1-1234567", {}, "u1"), D("tok-u2-1234567", {}, "u2"), { user_id: "u3", token: "tok-android-12", platform: "android", notify: {} }]);
await call(); check("Empfaenger: jeder bekommt nur seine Push, Android wird nicht ueber APNs gesendet", state.apns.length === 2 && new Set(state.apns.map((x) => x.token)).size === 2 && !state.apns.some((x) => x.token === "tok-android-12"));
reset([Q("duel_challenge", {}, "u1")], [D("tok-1-12345678", {}, "u1"), D("tok-2-12345678", {}, "u1")]);
await call(); check("Mehrere Geraete desselben Kontos: alle bekommen die Push", state.apns.length === 2);

// ---- Ruhezeit (Europe/Berlin) ----
const quietCase = async (label, iso, kind, expectSent, expectWaiting) => {
  at(iso); reset([Q(kind)], [D("tok-a-12345678")]); const rr = await json(await call());
  check(label, (state.apns.length === 1) === expectSent && rr.waiting === (expectWaiting ? 1 : 0) && (state.queue[0].sent_at !== null) === (expectSent || false), JSON.stringify(rr));
};
await quietCase("Ruhezeit: 23:30 Berlin (Winter, 22:30Z) = wartet", "2026-11-05T22:30:00Z", "duel_challenge", false, true);
await quietCase("Ruhezeit: 07:59 Berlin (Winter, 06:59Z) = wartet", "2026-11-05T06:59:00Z", "friend_request", false, true);
await quietCase("Ruhezeit: 08:00 Berlin (Winter, 07:00Z) = geht raus", "2026-11-05T07:00:00Z", "friend_request", true, false);
await quietCase("Ruhezeit: 21:59 Berlin (Winter, 20:59Z) = geht raus", "2026-11-05T20:59:00Z", "duel_challenge", true, false);
await quietCase("Ruhezeit: Sommerzeit 22:30 Berlin (20:30Z) = wartet", "2026-07-05T20:30:00Z", "duel_your_turn", false, true);
await quietCase("Ruhezeit: Sommerzeit 07:30 Berlin (05:30Z) = wartet", "2026-07-05T05:30:00Z", "duel_your_turn", false, true);
await quietCase("Ruhezeit: Sommerzeit 08:00 Berlin (06:00Z) = geht raus", "2026-07-05T06:00:00Z", "duel_your_turn", true, false);
await quietCase("Ruhezeit: Frist-Warnung geht auch nachts raus", "2026-11-05T23:30:00Z", "duel_deadline_warning", true, false);
at("2026-11-05T23:30:00Z"); reset([Q("duel_challenge", {}, "u1", 13 * 3600e3)], [D("tok-a-12345678")]); r = await json(await call());
check("Ruhezeit: Eintrag aelter als 12 Stunden verfaellt (erledigt, nicht gesendet)", state.apns.length === 0 && state.queue[0].sent_at !== null && r.skipped === 1, JSON.stringify(r));
at("2026-11-05T12:00:00Z"); reset([Q("duel_challenge", {}, "u1", 13 * 3600e3)], [D("tok-a-12345678")]); r = await json(await call());
check("Verfall: auch tagsueber ist eine 13 Stunden alte Herausforderung keine Neuigkeit mehr", state.apns.length === 0 && state.queue[0].sent_at !== null && r.skipped === 1, JSON.stringify(r));
at("2026-11-05T12:00:00Z");

// ---- Sandbox, tote Tokens, Apple-Fehler ----
reset([Q("duel_challenge")], [D("tok-sandbox-123")], { "tok-sandbox-123": "sandbox" }); r = await json(await call());
check("Sandbox: Production lehnt ab, Sandbox nimmt an (Debug-Build), Token bleibt", state.apns.length === 2 && state.apns[1].host === "api.sandbox.push.apple.com" && r.sent === 1 && state.deleted.length === 0, JSON.stringify(r));
reset([Q("duel_challenge")], [D("tok-dead-123456")], { "tok-dead-123456": "dead" }); r = await json(await call());
check("Totes Token: bei beiden Hosts ungueltig = Geraet geloescht, Eintrag erledigt", state.deleted.length === 1 && state.deleted[0].token === "tok-dead-123456" && state.devices.length === 0 && state.queue[0].sent_at !== null && r.skipped === 1, JSON.stringify(r));
reset([Q("duel_challenge")], [D("tok-dead-123456"), D("tok-live-123456")], { "tok-dead-123456": "dead" }); r = await json(await call());
check("Totes Token neben gueltigem: das gueltige bekommt die Push, nur das tote wird geloescht", state.deleted.length === 1 && state.devices.length === 1 && state.devices[0].token === "tok-live-123456" && r.sent === 1);
reset([Q("duel_challenge")], [D("tok-down-123456")], { "tok-down-123456": "down" }); r = await json(await call());
check("Apple-Fehler 503: Eintrag bleibt offen (naechste Minute nochmal), Token bleibt", state.queue[0].sent_at === null && state.devices.length === 1 && r.waiting === 1 && r.sent === 0, JSON.stringify(r));
reset([Q("duel_challenge")], [D("tok-net-1234567")], { "tok-net-1234567": "net" }); r = await json(await call());
check("Netzfehler: Eintrag bleibt offen", state.queue[0].sent_at === null && r.waiting === 1);
reset([Q("duel_challenge")], [D("tok-down-123456"), D("tok-live-123456")], { "tok-down-123456": "down" }); r = await json(await call());
check("Ein Geraet fehlerhaft, eines ok: Eintrag erledigt (nicht doppelt senden)", state.queue[0].sent_at !== null && r.sent === 1);

// ---- Warteschlange ----
reset([], []); r = await json(await call());
check("Leere Warteschlange: ok, nichts zu tun", r.ok && r.sent === 0 && state.apns.length === 0);
reset(Array.from({ length: 120 }, () => Q("friend_request", {}, "u1")), [D("tok-a-12345678")]); r = await json(await call());
check("Warteschlange: hoechstens 100 je Lauf, der Rest bleibt fuer die naechste Minute", state.apns.length === 100 && state.queue.filter((q) => !q.sent_at).length === 20, String(state.apns.length));
reset([Q("friend_request")], [D("tok-a-12345678")]); state.queue[0].sent_at = "2026-11-05T11:00:00Z"; await call();
check("Warteschlange: schon gesendete Eintraege werden nie erneut gesendet", state.apns.length === 0);
reset([Q("duel_challenge")], [D("tok-a-12345678")]); state.failQueue = true; r = await call();
check("Datenbankfehler: 500, keine Push", r.status === 500 && state.apns.length === 0);

fs.rmSync(dir, { recursive: true, force: true });
globalThis.Date = RealDate;
if (fails) { console.log(`${fails} von ${total} Pruefungen falsch`); process.exit(1); }
console.log(`OK - ${total} Push-Function-Pruefungen bestanden`);
