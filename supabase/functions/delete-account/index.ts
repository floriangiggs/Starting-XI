// Edge Function "delete-account" (8b-2): Konto loeschen MIT Widerruf des Apple-Tokens (App-Store-Pflicht 5.1.1(v)).
//
// Ablauf: Die App laesst den Spieler beim Loeschen noch einmal bei Apple bestaetigen und schickt den frischen authorizationCode.
// 1. Anmeldung pruefen (JWT aus dem Kopf "Authorization").
// 2. Hat das Konto eine Apple-Identitaet: Code bei Apple gegen ein Refresh-Token tauschen (client_id = Bundle-ID der App),
//    pruefen, dass der Apple-Nutzer derselbe ist wie im Konto, dann das Token bei Apple widerrufen.
// 3. Erst danach das Konto loeschen (auth.users, Kaskade wie public.delete_account()).
// Scheitert Apple, wird NICHTS geloescht und die App meldet es; der Spieler kann es erneut versuchen.
//
// Geheimnisse (Supabase -> Edge Functions -> Secrets, nie ins Repo):
//   APPLE_TEAM_ID   Team-ID (z. B. CS9J7W6JPM)
//   APPLE_KEY_ID    Key-ID des Schluessels mit "Sign in with Apple"
//   APPLE_P8_KEY    kompletter Inhalt der .p8-Datei (mit BEGIN/END-Zeilen)
//   APPLE_BUNDLE_ID optional, Standard de.startelo.app
// SUPABASE_URL, SUPABASE_ANON_KEY und SUPABASE_SERVICE_ROLE_KEY stellt Supabase selbst bereit.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const b64u = (data: ArrayBuffer | Uint8Array | string): string => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Client-Secret fuer Apple: JWT (ES256), kurz gueltig, nur fuer diesen Aufruf.
async function appleClientSecret(teamId: string, keyId: string, p8: string, clientId: string): Promise<string> {
  const pem = p8.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const body = b64u(JSON.stringify({ iss: teamId, iat: now, exp: now + 300, aud: "https://appleid.apple.com", sub: clientId }));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64u(sig)}`;
}

const jwtSub = (jwt: string): string | null => {
  try {
    const p = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(p + "=".repeat((4 - (p.length % 4)) % 4))).sub ?? null;
  } catch { return null; }
};

const appleForm = (url: string, fields: Record<string, string>) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields) });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { ok: false, error: "method" });

  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { ok: false, error: "auth" });
  const asUser = createClient(url, anon, { auth: { persistSession: false } });
  const { data: u, error: ue } = await asUser.auth.getUser(jwt);
  if (ue || !u?.user) return json(401, { ok: false, error: "auth" });
  const user = u.user;

  const apple = (user.identities || []).find((i) => i.provider === "apple");
  if (apple) {
    let code = "";
    try { code = String((await req.json())?.authorizationCode || ""); } catch { /* leer */ }
    if (!code) return json(400, { ok: false, error: "code_required" });

    const teamId = Deno.env.get("APPLE_TEAM_ID"), keyId = Deno.env.get("APPLE_KEY_ID"), p8 = Deno.env.get("APPLE_P8_KEY");
    const clientId = Deno.env.get("APPLE_BUNDLE_ID") || "de.startelo.app";
    if (!teamId || !keyId || !p8) { console.error("delete-account: Apple-Geheimnisse fehlen"); return json(500, { ok: false, error: "config" }); }

    let secret: string;
    try { secret = await appleClientSecret(teamId, keyId, p8, clientId); }
    catch (e) { console.error("delete-account: Schluessel nicht lesbar", String(e)); return json(500, { ok: false, error: "config" }); }

    const tok = await appleForm("https://appleid.apple.com/auth/token", { client_id: clientId, client_secret: secret, code, grant_type: "authorization_code" });
    const tj = await tok.json().catch(() => ({}));
    if (!tok.ok || !tj.refresh_token) { console.error("delete-account: Apple-Tausch", tok.status, tj?.error); return json(502, { ok: false, error: "apple" }); }

    const idSub = typeof tj.id_token === "string" ? jwtSub(tj.id_token) : null;
    const accountSub = (apple.identity_data as Record<string, unknown> | undefined)?.sub ?? apple.id;
    if (idSub && accountSub && idSub !== accountSub) return json(403, { ok: false, error: "wrong_account" });

    const rev = await appleForm("https://appleid.apple.com/auth/revoke", { client_id: clientId, client_secret: secret, token: tj.refresh_token, token_type_hint: "refresh_token" });
    if (!rev.ok) { console.error("delete-account: Apple-Widerruf", rev.status); return json(502, { ok: false, error: "apple" }); }
  }

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: de } = await admin.auth.admin.deleteUser(user.id);
  if (de) { console.error("delete-account: Loeschen", de.message); return json(500, { ok: false, error: "delete" }); }
  return json(200, { ok: true, revoked: !!apple });
});
