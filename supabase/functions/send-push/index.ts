// Edge Function "send-push" (8b-3): schickt die Eintraege aus public.notification_queue als Push (iOS, APNs direkt).
//
// Aufgerufen jede Minute von pg_cron (siehe supabase/migrations/0011_push.sql) mit dem geheimen Kopf "x-cron-secret".
// Ablauf je offenem Eintrag (sent_at is null, aelteste zuerst, hoechstens 100):
// 1. Geraete des Empfaengers (devices, platform = ios), Schalter je Art (devices.notify, fehlender Schluessel = an).
// 2. Ruhezeit 22-8 Uhr (Europe/Berlin): nichts, ausser "duel_deadline_warning"; der Rest wartet bis 8 Uhr, nach 12 Stunden verfaellt er.
// 3. APNs: JWT (ES256) mit dem Push-Schluessel, Production, bei BadDeviceToken Sandbox (Debug-Builds); tote Tokens werden geloescht.
// 4. sent_at wird gesetzt, wenn gesendet wurde, nichts zu senden war (kein Geraet, Schalter aus) oder der Eintrag verfallen ist.
//    Bei einem Fehler auf Apples Seite (5xx, Netz) bleibt er offen und wird in der naechsten Minute erneut versucht.
//
// Geheimnisse (Supabase -> Edge Functions -> Secrets, nie ins Repo):
//   APNS_KEY_ID     Key-ID des Schluessels mit "Apple Push Notifications service (APNs)"
//   APNS_P8_KEY     kompletter Inhalt der .p8-Datei dieses Schluessels
//   APPLE_TEAM_ID   Team-ID (gibt es schon fuer delete-account)
//   CRON_SECRET     langer Zufallstext; derselbe Wert steht im pg_cron-Aufruf (private.app_secret)
//   APNS_TOPIC      optional, Standard de.startelo.app
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY stellt Supabase selbst bereit.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret" };
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const b64u = (data: ArrayBuffer | Uint8Array | string): string => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// APNs-Anmelde-JWT: ES256, "iss" = Team, "kid" = Key-ID. Apple verlangt eine Erneuerung spaetestens nach 60 Minuten, wir bauen es je Aufruf neu.
async function apnsJwt(teamId: string, keyId: string, p8: string): Promise<string> {
  const pem = p8.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64u(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const body = b64u(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64u(sig)}`;
}

// Gruppen der Schalter (Kabine -> Einstellungen -> Benachrichtigungen). Mehrere Arten teilen sich einen Schalter.
const PREF: Record<string, string> = {
  friend_request: "friend_request", friend_accepted: "friend_accepted",
  duel_challenge: "duel_challenge", duel_your_turn: "duel_your_turn",
  duel_finished: "duel_finished", duel_declined: "duel_finished", duel_cancelled: "duel_finished", duel_expired: "duel_finished",
  duel_deadline_warning: "duel_deadline_warning",
};

type Row = { id: number; to_user: string; kind: string; payload: Record<string, any>; created_at: string };
const nameOf = (p: any): string => (p && typeof p.username === "string" && p.username ? "@" + p.username : "Ein Freund");

// Text je Art. Nur @Name und Zahlen aus der Nutzlast, nie Spielernamen der gefragten Elf.
function textFor(r: Row): { title: string; body: string } | null {
  const p = r.payload || {};
  switch (r.kind) {
    case "friend_request": return { title: "Neue Freundschaftsanfrage", body: `${nameOf(p.user)} möchte dein Freund sein.` };
    case "friend_accepted": return { title: "Anfrage angenommen", body: `${nameOf(p.user)} ist jetzt dein Freund.` };
    case "duel_challenge": {
      const n = Number(p.rounds) || 0;
      return { title: "Herausforderung!", body: `${nameOf(p.from)} fordert dich zum Duell heraus${n ? ` – ${n} ${n === 1 ? "Runde" : "Runden"}` : ""}. Wer kennt die Elf besser?` };
    }
    case "duel_your_turn": return { title: "Du bist dran", body: `${nameOf(p.from)} hat seine Runde gespielt. Jetzt du!` };
    case "duel_finished": return { title: "Duell beendet", body: "Das Ergebnis steht fest. Schau nach, wer die Elf besser kannte." };
    case "duel_declined": return { title: "Duell abgelehnt", body: `${nameOf(p.by)} hat dein Duell abgelehnt.` };
    case "duel_cancelled": return { title: "Duell zurückgezogen", body: `${nameOf(p.from)} hat die Herausforderung zurückgezogen.` };
    case "duel_expired": return { title: "Duell abgelaufen", body: "Niemand hat rechtzeitig geantwortet. Das Duell ist beendet." };
    case "duel_deadline_warning": return { title: "Die Frist läuft ab", body: "Dein Duell endet in Kürze. Jetzt noch spielen!" };
    default: return null;
  }
}

// Stunde in Berlin (Sommer-/Winterzeit automatisch)
function berlinHour(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", hour12: false }).format(d)) % 24;
}
const quiet = (d: Date) => { const h = berlinHour(d); return h >= 22 || h < 8; };

const MAX_AGE_MS = 12 * 3600 * 1000;

// Eine Push an ein Geraet. "ok" | "dead" (Token ungueltig) | "retry" (Apple/Netz, spaeter nochmal)
async function sendOne(jwt: string, topic: string, token: string, payload: string): Promise<"ok" | "dead" | "retry"> {
  let dead = 0;
  for (const host of ["api.push.apple.com", "api.sandbox.push.apple.com"]) {
    let res: Response;
    try {
      res = await fetch(`https://${host}/3/device/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { authorization: `bearer ${jwt}`, "apns-topic": topic, "apns-push-type": "alert", "apns-priority": "10", "content-type": "application/json" },
        body: payload,
      });
    } catch (e) { console.error("send-push: Netz", host, String(e)); return "retry"; }
    if (res.ok) return "ok";
    const reason = (await res.json().catch(() => ({})))?.reason || "";
    if (res.status === 410 || reason === "Unregistered" || reason === "BadDeviceToken" || reason === "DeviceTokenNotForTopic") { dead++; continue; } // anderes Umfeld probieren
    console.error("send-push: APNs", host, res.status, reason);
    return "retry";
  }
  return dead ? "dead" : "retry";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { ok: false, error: "method" });

  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return json(401, { ok: false, error: "auth" });

  const url = Deno.env.get("SUPABASE_URL")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const teamId = Deno.env.get("APPLE_TEAM_ID"), keyId = Deno.env.get("APNS_KEY_ID"), p8 = Deno.env.get("APNS_P8_KEY");
  const topic = Deno.env.get("APNS_TOPIC") || "de.startelo.app";
  if (!teamId || !keyId || !p8) { console.error("send-push: APNs-Geheimnisse fehlen"); return json(500, { ok: false, error: "config" }); }

  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: rows, error: qe } = await db.from("notification_queue").select("id,to_user,kind,payload,created_at").is("sent_at", null).order("id", { ascending: true }).limit(100);
  if (qe) { console.error("send-push: Warteschlange", qe.message); return json(500, { ok: false, error: "queue" }); }
  const open = (rows || []) as Row[];
  if (!open.length) return json(200, { ok: true, sent: 0, skipped: 0, waiting: 0 });

  let jwt = "";
  try { jwt = await apnsJwt(teamId, keyId, p8); }
  catch (e) { console.error("send-push: Schluessel nicht lesbar", String(e)); return json(500, { ok: false, error: "config" }); }

  const now = new Date(), isQuiet = quiet(now);
  const users = [...new Set(open.map((r) => r.to_user))];
  const { data: devs } = await db.from("devices").select("user_id,token,notify").eq("platform", "ios").in("user_id", users);
  const byUser = new Map<string, { token: string; notify: Record<string, boolean> }[]>();
  for (const d of (devs || []) as any[]) (byUser.get(d.user_id) || byUser.set(d.user_id, []).get(d.user_id)!).push({ token: d.token, notify: d.notify || {} });

  const done: number[] = []; let sent = 0, skipped = 0, waiting = 0;
  for (const r of open) {
    const age = now.getTime() - new Date(r.created_at).getTime();
    const txt = textFor(r), pref = PREF[r.kind];
    if (!txt || !pref) { done.push(r.id); skipped++; continue; } // unbekannte Art: verwerfen
    if (isQuiet && r.kind !== "duel_deadline_warning") { if (age > MAX_AGE_MS) { done.push(r.id); skipped++; } else waiting++; continue; }
    if (age > MAX_AGE_MS && r.kind !== "duel_deadline_warning") { done.push(r.id); skipped++; continue; } // zu alt, die Nachricht waere keine Neuigkeit mehr
    const targets = (byUser.get(r.to_user) || []).filter((d) => d.notify[pref] !== false);
    if (!targets.length) { done.push(r.id); skipped++; continue; }

    const payload = JSON.stringify({ aps: { alert: { title: txt.title, body: txt.body }, sound: "default" }, kind: r.kind, duel: r.payload?.duel ?? null });
    let retry = false, any = false;
    for (const t of targets) {
      const res = await sendOne(jwt, topic, t.token, payload);
      if (res === "ok") any = true;
      else if (res === "dead") await db.from("devices").delete().eq("user_id", r.to_user).eq("token", t.token);
      else retry = true;
    }
    if (retry && !any) { waiting++; continue; } // Apple/Netz-Problem: naechste Minute nochmal
    done.push(r.id); if (any) sent++; else skipped++;
  }
  if (done.length) {
    const { error: ue } = await db.from("notification_queue").update({ sent_at: now.toISOString() }).in("id", done);
    if (ue) { console.error("send-push: sent_at", ue.message); return json(500, { ok: false, error: "queue" }); }
  }
  return json(200, { ok: true, sent, skipped, waiting });
});
