// Edge Function "delete-account" (8b-2): laeuft hier mit nachgebautem Deno/Supabase/Apple, ohne Netz.
// Geprueft: Anmeldung, Apple-Tausch mit gueltigem Client-Secret (ES256, wirklich verifiziert), Widerruf VOR dem Loeschen,
// kein Loeschen bei Apple-Fehlern/falschem Apple-Konto, Konto ohne Apple-Identitaet, Geheimnisse fehlen.
// Aufruf: node tools/test-delete-function.mjs   (Node 22.6+ mit Typ-Entfernung, hier Node 26)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = path.join(root, "supabase/functions/delete-account/index.ts");
const src = fs.readFileSync(srcPath, "utf8");
let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra !== "" ? ": " + extra : ""}`); } };

check("Function: keine festen Geheimnisse im Code (kein PEM-Block, keine eyJ-Tokens)", !/BEGIN (EC )?PRIVATE KEY-----\s*\n?[A-Za-z0-9+/]{20}/.test(src) && !/eyJ[A-Za-z0-9_-]{20,}/.test(src));
check("Function: Loeschen erst nach dem Widerruf (Reihenfolge im Code)", src.indexOf("auth/revoke") > 0 && src.indexOf("auth/revoke") < src.indexOf("admin.deleteUser"));

// Quelltext fuer Node vorbereiten: Supabase-Import durch Platzhalter ersetzen, Deno nachbauen
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "delfn-"));
const prepared = src.replace(/^import \{ createClient \} from "npm:[^"]+";/m, "const createClient = (...a) => globalThis.__createClient(...a);");
check("Function: Import ersetzt (Test laeuft auf dem echten Quelltext)", prepared !== src);
fs.writeFileSync(path.join(dir, "fn.ts"), prepared);

const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const P8 = privateKey.export({ type: "pkcs8", format: "pem" });
const ENV = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "service", APPLE_TEAM_ID: "CS9J7W6JPM", APPLE_KEY_ID: "ABC123DEFG", APPLE_P8_KEY: P8 };

const logged = []; console.error = (...a) => { logged.push(a.join(" ")); }; // erwartete Fehlerfaelle nicht in die Ausgabe
let handler, env = { ...ENV };
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };
const state = { user: null, deleted: [], calls: [], apple: {} };
globalThis.__createClient = (url, key) => ({
  auth: {
    getUser: async (jwt) => (jwt === "good" && state.user ? { data: { user: state.user }, error: null } : { data: { user: null }, error: { message: "bad" } }),
    admin: { deleteUser: async (id) => { state.calls.push("delete"); state.deleted.push(id); return { error: state.deleteError ? { message: "x" } : null }; } },
  },
});
const idToken = (sub) => "h." + Buffer.from(JSON.stringify({ sub })).toString("base64url") + ".s";
globalThis.fetch = async (url, init) => {
  const form = Object.fromEntries(new URLSearchParams(init.body));
  state.calls.push(url.endsWith("/token") ? "token" : "revoke"); state.last = { url, form };
  if (url.endsWith("/auth/token")) { state.tokenForm = form; return state.apple.tokenFail ? new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }) : new Response(JSON.stringify({ refresh_token: "RT1", access_token: "AT1", id_token: idToken(state.apple.sub || "apple-sub-1") }), { status: 200 }); }
  if (url.endsWith("/auth/revoke")) { state.revokeForm = form; return new Response("", { status: state.apple.revokeFail ? 400 : 200 }); }
  throw new Error("unerwartete Adresse " + url);
};
await import(pathToFileURL(path.join(dir, "fn.ts")).href);

const call = (o = {}) => handler(new Request("https://x.supabase.co/functions/v1/delete-account", { method: o.method || "POST", headers: { ...(o.auth === null ? {} : { Authorization: "Bearer " + (o.auth || "good") }) }, body: o.method === "OPTIONS" ? undefined : JSON.stringify(o.body === undefined ? { authorizationCode: "CODE1" } : o.body) }));
const reset = (u) => { state.user = u; state.deleted = []; state.calls = []; state.apple = {}; state.deleteError = false; env = { ...ENV }; state.tokenForm = state.revokeForm = null; };
const appleUser = { id: "user-1", identities: [{ provider: "apple", id: "apple-sub-1", identity_data: { sub: "apple-sub-1" } }] };

reset(appleUser);
let r = await call({ method: "OPTIONS" }); check("OPTIONS: CORS-Antwort fuer die App", r.status === 200 && r.headers.get("Access-Control-Allow-Origin") === "*");
r = await call({ auth: null }); check("ohne Anmeldung: 401, nichts passiert", r.status === 401 && state.calls.length === 0);
r = await call({ auth: "schlecht" }); check("ungueltige Anmeldung: 401, nichts passiert", r.status === 401 && state.calls.length === 0);

reset(appleUser);
r = await call({ body: {} }); let j = await r.json();
check("Apple-Konto ohne Code: 400 code_required, nichts geloescht, Apple nicht gefragt", r.status === 400 && j.error === "code_required" && state.deleted.length === 0 && state.calls.length === 0, JSON.stringify([r.status, j]));

reset(appleUser);
r = await call(); j = await r.json();
check("Apple-Konto mit Code: ok, widerrufen, geloescht", r.status === 200 && j.ok === true && j.revoked === true && JSON.stringify(state.deleted) === '["user-1"]', JSON.stringify([r.status, j]));
check("Reihenfolge: erst Token tauschen, dann widerrufen, dann loeschen", JSON.stringify(state.calls) === '["token","revoke","delete"]', JSON.stringify(state.calls));
check("Tausch: client_id = Bundle-ID, grant_type authorization_code, Code durchgereicht", state.tokenForm.client_id === "de.startelo.app" && state.tokenForm.grant_type === "authorization_code" && state.tokenForm.code === "CODE1");
check("Widerruf: Refresh-Token, Hint refresh_token, client_id Bundle-ID", state.revokeForm.token === "RT1" && state.revokeForm.token_type_hint === "refresh_token" && state.revokeForm.client_id === "de.startelo.app");
{ // Client-Secret wirklich pruefen
  const [h, p, s] = state.tokenForm.client_secret.split("."), head = JSON.parse(Buffer.from(h, "base64url")), body = JSON.parse(Buffer.from(p, "base64url"));
  const sigOk = crypto.verify("sha256", Buffer.from(h + "." + p), { key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"));
  check("Client-Secret: ES256, kid = Key-ID, Unterschrift mit dem Schluessel gueltig", head.alg === "ES256" && head.kid === "ABC123DEFG" && sigOk, JSON.stringify(head));
  const now = Math.floor(Date.now() / 1000);
  check("Client-Secret: iss = Team-ID, sub = Bundle-ID, aud = Apple, kurz gueltig (hoechstens 10 Minuten)", body.iss === "CS9J7W6JPM" && body.sub === "de.startelo.app" && body.aud === "https://appleid.apple.com" && body.exp - now <= 600 && body.exp > now, JSON.stringify(body));
}

reset(appleUser); state.apple.tokenFail = true;
r = await call(); j = await r.json();
check("Apple lehnt den Code ab: 502 apple, NICHTS geloescht", r.status === 502 && j.error === "apple" && state.deleted.length === 0 && !state.calls.includes("revoke"), JSON.stringify([r.status, j, state.calls]));

reset(appleUser); state.apple.revokeFail = true;
r = await call(); j = await r.json();
check("Widerruf scheitert: 502 apple, NICHTS geloescht", r.status === 502 && j.error === "apple" && state.deleted.length === 0, JSON.stringify([r.status, j, state.calls]));

reset(appleUser); state.apple.sub = "anderer-apple-nutzer";
r = await call(); j = await r.json();
check("Anderes Apple-Konto bestaetigt: 403 wrong_account, nichts widerrufen, nichts geloescht", r.status === 403 && j.error === "wrong_account" && state.deleted.length === 0 && !state.calls.includes("revoke"), JSON.stringify([r.status, j, state.calls]));

reset({ id: "user-2", identities: [{ provider: "email", id: "x", identity_data: {} }] });
r = await call({ body: {} }); j = await r.json();
check("Konto ohne Apple-Identitaet: wird ohne Apple-Aufruf geloescht", r.status === 200 && j.ok && j.revoked === false && JSON.stringify(state.deleted) === '["user-2"]' && state.calls.join() === "delete", JSON.stringify([r.status, j, state.calls]));

reset(appleUser); delete env.APPLE_P8_KEY;
r = await call(); j = await r.json();
check("Geheimnisse fehlen: 500 config, nichts geloescht", r.status === 500 && j.error === "config" && state.deleted.length === 0, JSON.stringify([r.status, j]));
reset(appleUser); env.APPLE_P8_KEY = "kein-schluessel";
r = await call(); j = await r.json();
check("Schluessel unlesbar: 500 config, nichts geloescht", r.status === 500 && j.error === "config" && state.deleted.length === 0, JSON.stringify([r.status, j]));

reset(appleUser); state.deleteError = true;
r = await call(); j = await r.json();
check("Loeschen scheitert nach Widerruf: 500 delete (Spieler kann erneut versuchen)", r.status === 500 && j.error === "delete", JSON.stringify([r.status, j]));

fs.rmSync(dir, { recursive: true, force: true });
console.log(fails ? `${fails} von ${total} Pruefungen FALSCH` : `OK - ${total} Loesch-Function-Pruefungen bestanden`);
process.exit(fails ? 1 : 0);
