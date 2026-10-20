// Regeltests der Datenbank (Prompt K1) gegen PGlite (Postgres im Projekt, ohne Docker/Supabase).
// Prueft: Zugriffsregeln (RLS), Username-Regeln, Freunde, Spielstand, Tages-Ergebnis, Duell inkl. Versiegelung/Fristen/Doppeltes Senden, Rechte.
// Aufruf: node tools/test-db.mjs
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "supabase");
const db = new PGlite();
await db.exec(fs.readFileSync(path.join(root, "tests", "shim_supabase.sql"), "utf8"));
for (const f of fs.readdirSync(path.join(root, "migrations")).sort()) await db.exec(fs.readFileSync(path.join(root, "migrations", f), "utf8"));
await db.exec(fs.readFileSync(path.join(root, "seed.sql"), "utf8"));

let total = 0, fails = 0;
const check = (label, cond, extra = "") => { total++; if (!cond) { fails++; console.log(`FALSCH ${label}${extra !== "" ? ": " + extra : ""}`); } };
const asRole = async (role, uid, fn) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid || ""}', false);`);
  try { return await fn(); } finally { await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false);"); }
};
const sqlAs = (uid, sql, params = []) => asRole("authenticated", uid, () => db.query(sql, params));
// Funktion als Nutzer aufrufen: gibt den Rueckgabewert zurueck, bei Fehler { error: "<message>" }
const call = async (uid, fn, args = [], types = []) => {
  const ph = args.map((_, i) => `$${i + 1}${types[i] ? "::" + types[i] : ""}`).join(", ");
  try { const r = await sqlAs(uid, `select public.${fn}(${ph}) as v`, args); return r.rows[0].v; } catch (e) { return { error: String(e.message || e) }; }
};
const callService = async (fn, args = []) => asRole("service_role", "", async () => (await db.query(`select public.${fn}(${args.map((_, i) => "$" + (i + 1)).join(",")}) as v`, args)).rows[0].v);
const isVoid = (v) => v === null || v === "";
const err = (r, code) => r && typeof r === "object" && typeof r.error === "string" && r.error.includes(code);
const one = async (sql, params = []) => (await db.query(sql, params)).rows;

const U = {}; // Nutzer
for (const n of ["anna", "ben", "cora", "dave", "emil", "fritz"]) { const r = await one("insert into auth.users (email) values ($1) returning id", [n + "@test.de"]); U[n] = r[0].id; }

/* ---------- Rechte & Zugriffsregeln ---------- */
{
  const direct = await sqlAs(U.anna, "insert into public.profiles (id, username, friend_code) values ($1, 'hack', 'XI-HACK')", [U.anna]).then(() => "ok", (e) => e.message);
  check("Direkt in Tabelle schreiben ist verboten", /permission denied/.test(direct), direct);
  const del = await sqlAs(U.anna, "delete from public.app_config").then(() => "ok", (e) => e.message);
  check("Direkt loeschen ist verboten", /permission denied/.test(del), del);
  const cfg = await sqlAs(U.anna, "select * from public.app_config").then(() => "ok", (e) => e.message);
  check("Konfig fuer Nutzer unsichtbar", /permission denied/.test(cfg), cfg);
  for (const t of ["notification_queue", "rate_events", "name_rules", "reports", "username_history"]) {
    const r = await sqlAs(U.anna, `select * from public.${t}`).then(() => "ok", (e) => e.message);
    check(`Tabelle ${t} nur fuer den Server`, /permission denied/.test(r), r);
  }
  const anon = await asRole("anon", "", () => db.query("select public.my_profile()")).then(() => "ok", (e) => e.message);
  check("Gast (anon) darf keine Funktion aufrufen", /permission denied/.test(anon), anon);
  const anonT = await asRole("anon", "", () => db.query("select * from public.lineup_catalog")).then(() => "ok", (e) => e.message);
  check("Gast (anon) darf keine Tabelle lesen", /permission denied/.test(anonT), anonT);
  const adm = await call(U.anna, "process_deadlines");
  check("Zeitplaner nicht fuer Nutzer", err(adm, "permission denied"), JSON.stringify(adm));
  const adm2 = await call(U.anna, "admin_reset_username", [U.ben], ["uuid"]);
  check("Moderation nicht fuer Nutzer", err(adm2, "permission denied"));
  const priv = await sqlAs(U.anna, "select private.cfg('max_friends')").then(() => "ok", (e) => e.message);
  check("private-Funktionen nicht aufrufbar", /permission denied/.test(priv), priv);
  const noauth = await asRole("authenticated", "", async () => db.query("select public.my_profile()").then(() => "ok", (e) => e.message));
  check("Ohne Anmeldung (keine ID) -> not_authenticated", /not_authenticated/.test(noauth), noauth);
  check("Katalog fuer Angemeldete lesbar", (await sqlAs(U.anna, "select count(*)::int as n from public.lineup_catalog")).rows[0].n > 100);
}

/* ---------- Username ---------- */
const claim = (u, name, crest, legacy) => call(u, "claim_username", [name, crest ?? null, legacy ?? null]);
{
  check("Profil vor dem Namen: my_profile leer", (await call(U.anna, "my_profile")) === null);
  const bad = {};
  for (const [n, code] of [["ab", "length"], ["abcdefghijklmnop", "length"], ["Ab!cd", "format"], ["_anna", "format"], ["anna_", "format"], ["a b c", "format"], ["admin", "reserved"], ["support", "reserved"], ["startingxi", "reserved"], ["startelo", "reserved"], ["starteloxi", "reserved"], ["startelo_xi", "reserved"], ["startelo.xi", "reserved"], ["n4z1boy", "blocked"], ["fuck_you", "blocked"], ["hitler99", "blocked"]]) {
    bad[n] = await claim(U.anna, n); check(`Name "${n}" -> ${code}`, bad[n].ok === false && bad[n].error === code, JSON.stringify(bad[n]));
  }
  const person = await one("select word from public.name_rules where kind = 'person' and word in ('neuer','messi','mueller','lewandowski') limit 1");
  if (person.length) { const r = await claim(U.anna, person[0].word); check(`Bekannter Spielername "${person[0].word}" gesperrt`, r.ok === false && r.error === "person", JSON.stringify(r)); }
  else check("Personen-Namensregeln im Seed vorhanden", false);
  const ok = await claim(U.anna, "Anna.Kickt", "#F2A0B4", "dev-anna-1");
  check("Aehnlicher Name startelo99 bleibt erlaubt (nicht reserviert)", (await one("select private.username_error('startelo99') as e"))[0].e === null);
  check("Gueltiger Name (Gross/klein egal) wird klein gespeichert", ok.ok === true && ok.username === "anna.kickt", JSON.stringify(ok));
  const p = await call(U.anna, "my_profile");
  check("Profil: Farbe, Code XI-xxxx, sichtbar fuer alle, ohne Geraete-ID", p.crest_color === "#F2A0B4" && /^XI-[A-Z2-9]{4}$/.test(p.friend_code) && p.discoverable === "all" && p.legacy_device_id === undefined, JSON.stringify(p));
  check("Oeffentliche Werte wurden angelegt", (await one("select count(*)::int n from public.public_stats where user_id = $1", [U.anna]))[0].n === 1);
  const taken = await claim(U.ben, "ANNA.kickt");
  check("Vergeben (auch anders geschrieben) -> 3 Vorschlaege", taken.ok === false && taken.error === "taken" && taken.suggestions.length === 3 && new Set(taken.suggestions).size === 3, JSON.stringify(taken));
  check("Vorschlaege sind gueltig und frei", (await Promise.all(taken.suggestions.map((s) => one("select private.username_error($1) as e, exists(select 1 from public.profiles where username = $1) as t", [s])))).every((r) => r[0].e === null && !r[0].t));
  check("Wappenfarbe ungueltig abgelehnt", (await claim(U.anna, "anna.kickt", "rot")).error === "crest");
  check("Gleicher Name: nur Farbe aendern", (await claim(U.anna, "anna.kickt", "#7FE0A8")).ok === true);
  check("Rename sofort moeglich (erste Aenderung)", (await claim(U.anna, "anna_xi")).ok === true);
  const soon = await claim(U.anna, "anna_neu");
  check("Zweite Aenderung innerhalb 30 Tagen -> too_soon", soon.ok === false && soon.error === "too_soon" && !!soon.next_change_at, JSON.stringify(soon));
  const old = await claim(U.ben, "anna.kickt");
  check("Alter Name bleibt 30 Tage fuer andere gesperrt", old.ok === false && old.error === "taken", JSON.stringify(old));
  await db.exec(`update public.profiles set username_changed_at = now() - interval '31 days' where id = '${U.anna}'`);
  await db.exec("update public.username_history set released_at = now() - interval '31 days'");
  check("Nach 30 Tagen darf Anna wieder aendern", (await claim(U.anna, "anna_neu")).ok === true);
  check("Alter Name nach 30 Tagen wieder frei", (await claim(U.ben, "anna.kickt")).ok === true);
  check("Name wechselt zurueck zu Ben", (await call(U.ben, "my_profile")).username === "anna.kickt");
  check("Ben aendert Namen (erste Aenderung)", (await claim(U.ben, "ben.bolzt")).ok === true);
  for (const [u, n] of [["cora", "cora_c"], ["dave", "dave88"], ["emil", "emil.e"], ["fritz", "fritz_f"]]) check(`Nutzer ${u} legt Namen an`, (await claim(U[u], n)).ok === true);
  const codes = (await one("select friend_code from public.profiles")).map((r) => r.friend_code);
  check("Freundescodes eindeutig", new Set(codes).size === codes.length);
  const fremd = await sqlAs(U.ben, "select id from public.profiles");
  check("Fremde Profile nicht lesbar (nur das eigene)", fremd.rows.length === 1 && fremd.rows[0].id === U.ben, String(fremd.rows.length));
  check("Sichtbarkeit setzen", isVoid((await call(U.cora, "set_discoverable", ["code"]))));
  check("Sichtbarkeit: falscher Wert", err(await call(U.cora, "set_discoverable", ["alle"]), "bad_mode"));
  check("Legacy-Geraete-ID bleibt unsichtbar fuer andere", (await one("select legacy_device_id from public.profiles where id = $1", [U.anna]))[0].legacy_device_id === "dev-anna-1");
}

/* ---------- Freunde ---------- */
const ids = (arr) => arr.map((x) => x.id);
{
  const s1 = await call(U.ben, "search_users", ["ann"]);
  check("Suche ab 3 Zeichen findet @Namen (nur oeffentliche Werte)", Array.isArray(s1) && s1.length === 1 && s1[0].id === U.anna && Object.keys(s1[0]).sort().join() === "crest_color,id,rank,username", JSON.stringify(s1));
  check("Ohne Profil keine Suche (no_profile)", err(await call("00000000-0000-0000-0000-0000000000bb", "search_users", ["ann"]), "no_profile") && err(await call("00000000-0000-0000-0000-0000000000bb", "find_by_code", ["XI-AAAA"]), "no_profile"));
  check("Suche unter 3 Zeichen -> too_short", err(await call(U.ben, "search_users", ["an"]), "too_short"));
  check("Suche findet mich selbst nicht", (await call(U.anna, "search_users", ["ann"])).length === 0);
  check("Suche: LIKE-Zeichen werden nicht als Platzhalter gedeutet", (await call(U.ben, "search_users", ["%%%"])).length === 0 && (await call(U.ben, "search_users", ["a_n"])).length === 0);
  check("Sichtbarkeit 'code': nicht per Suche", (await call(U.ben, "search_users", ["cora"])).length === 0);
  check("Sichtbarkeit 'code': per Freundescode", ((await call(U.ben, "find_by_code", [(await one("select friend_code from public.profiles where id = $1", [U.cora]))[0].friend_code.toLowerCase()]))?.id) === U.cora);
  await call(U.cora, "set_discoverable", ["none"]);
  check("Sichtbarkeit 'none': weder Suche noch Code", (await call(U.ben, "search_users", ["cora"])).length === 0 && (await call(U.ben, "find_by_code", [(await one("select friend_code from public.profiles where id = $1", [U.cora]))[0].friend_code])) === null);
  await call(U.cora, "set_discoverable", ["all"]);
  check("Unbekannter Code -> null", (await call(U.ben, "find_by_code", ["XI-0000"])) === null);

  // Rate-Limit Suche
  await db.exec("update public.app_config set value = 4 where key = 'search_per_minute'");
  let limited = false; for (let i = 0; i < 6; i++) { const r = await call(U.dave, "search_users", ["ann"]); if (err(r, "rate_limited")) limited = true; }
  check("Suche pro Minute begrenzt", limited);
  await db.exec("update public.app_config set value = 20 where key = 'search_per_minute'");
  await db.exec("delete from public.rate_events");

  check("Anfrage senden -> sent", (await call(U.ben, "send_request", [U.anna], ["uuid"])) === "sent");
  check("Nochmal senden -> already_sent", (await call(U.ben, "send_request", [U.anna], ["uuid"])) === "already_sent");
  check("Push 'friend_request' eingereiht", (await one("select count(*)::int n from public.notification_queue where to_user = $1 and kind = 'friend_request'", [U.anna]))[0].n === 1);
  check("Eingehende Anfragen bei Anna", ids(await call(U.anna, "incoming_requests")).join() === U.ben);
  check("Ausgehende bei Ben", ids(await call(U.ben, "outgoing_requests")).join() === U.anna);
  check("Anfrage an mich selbst -> self", err(await call(U.anna, "send_request", [U.anna], ["uuid"]), "self"));
  check("Unbekannte ID verraet nichts (sent)", (await call(U.anna, "send_request", ["00000000-0000-0000-0000-000000000009"], ["uuid"])) === "sent");
  check("Annehmen nur der Empfaenger (Ben kann seine eigene nicht annehmen)", err(await call(U.ben, "answer_request", [U.anna, true], ["uuid", "boolean"]), "no_request"));
  await call(U.anna, "answer_request", [U.ben, true], ["uuid", "boolean"]);
  check("Beide sind Freunde, keine offene Anfrage mehr", ids(await call(U.anna, "friends_list")).join() === U.ben && ids(await call(U.ben, "friends_list")).join() === U.anna && (await call(U.anna, "incoming_requests")).length === 0);
  check("Push 'friend_accepted' an Ben", (await one("select count(*)::int n from public.notification_queue where to_user = $1 and kind = 'friend_accepted'", [U.ben]))[0].n === 1);
  check("Schon befreundet -> already_friends", (await call(U.ben, "send_request", [U.anna], ["uuid"])) === "already_friends");

  // gegenseitig anfragen = sofort Freunde
  await call(U.cora, "send_request", [U.dave], ["uuid"]);
  check("Gegenseitige Anfrage -> sofort accepted", (await call(U.dave, "send_request", [U.cora], ["uuid"])) === "accepted");
  // ablehnen: still, Zeile weg
  await call(U.emil, "send_request", [U.anna], ["uuid"]);
  await call(U.anna, "answer_request", [U.emil, false], ["uuid", "boolean"]);
  check("Ablehnen loescht die Anfrage, keine Nachricht", (await call(U.anna, "incoming_requests")).length === 0 && (await one("select count(*)::int n from public.notification_queue where to_user = $1 and kind <> 'friend_request'", [U.emil]))[0].n === 0);
  check("Danach kann neu angefragt werden", (await call(U.emil, "send_request", [U.anna], ["uuid"])) === "sent");
  await call(U.anna, "answer_request", [U.emil, false], ["uuid", "boolean"]);

  // Sichtbarkeit der Werte
  await call(U.anna, "put_public_stats", [12, "Zweite Liga", 64, 9, 5, 9, 71, 140], ["int", "text", "int", "int", "int", "int", "int", "int"]);
  const fs1 = await call(U.ben, "friend_stats", [U.anna], ["uuid"]);
  check("Freund sieht Werte", fs1.level === 12 && fs1.campaign_stars === 64 && fs1.profile.username === "anna_neu", JSON.stringify(fs1));
  check("Fremder sieht Werte NICHT (Funktion)", err(await call(U.fritz, "friend_stats", [U.anna], ["uuid"]), "not_friends"));
  check("Fremder sieht Werte NICHT (Tabelle)", (await sqlAs(U.fritz, "select * from public.public_stats where user_id = $1", [U.anna])).rows.length === 0);
  check("Freund sieht Werte (Tabelle)", (await sqlAs(U.ben, "select * from public.public_stats where user_id = $1", [U.anna])).rows.length === 1);
  check("Werte ausserhalb des Bereichs -> bad_stats", err(await call(U.anna, "put_public_stats", [0, "x", 0, 0, 0, 0, 50, 0], ["int", "text", "int", "int", "int", "int", "int", "int"]), "bad_stats") && err(await call(U.anna, "put_public_stats", [5, "x", 0, 0, 0, 0, 150, 0], ["int", "text", "int", "int", "int", "int", "int", "int"]), "bad_stats"));

  // Limits
  await db.exec("update public.app_config set value = 1 where key = 'max_outgoing_requests'");
  await call(U.fritz, "send_request", [U.emil], ["uuid"]);
  check("Offene ausgehende Anfragen begrenzt", err(await call(U.fritz, "send_request", [U.dave], ["uuid"]), "too_many_requests"));
  await db.exec("update public.app_config set value = 20 where key = 'max_outgoing_requests'");
  await db.exec("update public.app_config set value = 2 where key = 'max_requests_per_day'");
  await db.exec("delete from public.rate_events");
  await call(U.emil, "send_request", [U.dave], ["uuid"]); await call(U.emil, "send_request", [U.cora], ["uuid"]);
  check("Neue Anfragen pro Tag begrenzt", err(await call(U.emil, "send_request", [U.ben], ["uuid"]), "rate_limited"));
  await db.exec("update public.app_config set value = 50 where key = 'max_requests_per_day'");
  await db.exec("delete from public.friendships where status = 'pending'; delete from public.rate_events");
  await db.exec("update public.app_config set value = 1 where key = 'max_friends'");
  check("Freundes-Limit", err(await call(U.anna, "send_request", [U.cora], ["uuid"]), "friend_limit"));
  await db.exec("update public.app_config set value = 200 where key = 'max_friends'");

  // Blockieren
  check("Blockieren (Ben blockiert Anna)", isVoid((await call(U.ben, "block_user", [U.anna], ["uuid"]))));
  check("Freundschaft endet beim Blockieren", (await call(U.anna, "friends_list")).length === 0);
  check("Blockierter findet den Blockierenden nicht (Suche)", (await call(U.anna, "search_users", ["ben.b"])).length === 0);
  check("Blockierter findet ihn nicht per Code", (await call(U.anna, "find_by_code", [(await one("select friend_code from public.profiles where id = $1", [U.ben]))[0].friend_code])) === null);
  check("Blockierter fragt an: scheinbar gesendet, aber nichts passiert", (await call(U.anna, "send_request", [U.ben], ["uuid"])) === "sent" && (await call(U.ben, "incoming_requests")).length === 0);
  check("Blockierender selbst darf nicht anfragen", err(await call(U.ben, "send_request", [U.anna], ["uuid"]), "you_blocked_user"));
  check("Blockierliste", ids(await call(U.ben, "blocked_list")).join() === U.anna);
  await call(U.ben, "unblock_user", [U.anna], ["uuid"]);
  check("Entblockieren", (await call(U.ben, "blocked_list")).length === 0);
  await call(U.ben, "send_request", [U.anna], ["uuid"]); await call(U.anna, "answer_request", [U.ben, true], ["uuid", "boolean"]);

  // Melden
  check("Melden", isVoid((await call(U.anna, "report_user", [U.cora, "Beleidigender Name"], ["uuid", "text"]))));
  await call(U.anna, "report_user", [U.cora, "nochmal"], ["uuid", "text"]);
  check("Hoechstens eine offene Meldung je Paar", (await one("select count(*)::int n from public.reports where reporter = $1 and target = $2", [U.anna, U.cora]))[0].n === 1);
  check("Nutzer sehen Meldungen nicht", /permission denied/.test(await sqlAs(U.anna, "select * from public.reports").then(() => "ok", (e) => e.message)));
  const reset = await callService("admin_reset_username", [U.cora]);
  check("Moderation: Name -> spieler_####, Meldung erledigt", /^spieler_\d{4}$/.test(reset) && (await one("select status from public.reports where target = $1", [U.cora]))[0].status === "actioned", reset);
  await claim(U.cora, "cora_c"); // zu frueh? (username_changed_at null nach Reset -> erlaubt)
  // Legacy-Gegner
  const lm = await call(U.fritz, "match_legacy", [["dev-anna-1", "dev-unbekannt"]], ["text[]"]);
  check("Bekannte Duell-Gegner werden vorgeschlagen", Array.isArray(lm) && lm.length === 1 && lm[0].id === U.anna, JSON.stringify(lm));
}

/* ---------- Spielstand ---------- */
{
  check("Kein Spielstand -> null", (await call(U.ben, "get_save")) === null);
  check("Anlegen mit Version 0 -> 1", (await call(U.ben, "put_save", [{ level: 3 }, 0], ["jsonb", "int"])) === 1);
  check("Falsche Version -> save_conflict", err(await call(U.ben, "put_save", [{ level: 9 }, 0], ["jsonb", "int"]), "save_conflict"));
  check("Aktualisieren mit richtiger Version", (await call(U.ben, "put_save", [{ level: 4 }, 1, "iPhone"], ["jsonb", "int", "text"])) === 2);
  const g = await call(U.ben, "get_save");
  check("Spielstand lesen", g.version === 2 && g.data.level === 4 && g.device === "iPhone");
  check("Anderer sieht fremden Spielstand nicht", (await sqlAs(U.anna, "select * from public.saves")).rows.length === 0 && (await call(U.anna, "get_save")) === null);
  check("Kein Objekt -> bad_data", err(await call(U.ben, "put_save", [[1, 2], 2], ["jsonb", "int"]), "bad_data"));
  await db.exec("update public.app_config set value = 50 where key = 'max_save_bytes'");
  check("Zu gross -> too_large", err(await call(U.ben, "put_save", [{ x: "y".repeat(80) }, 2], ["jsonb", "int"]), "too_large"));
  await db.exec("update public.app_config set value = 2000000 where key = 'max_save_bytes'");
  check("Ohne Profil kein Speichern", err(await call("00000000-0000-0000-0000-0000000000aa", "put_save", [{}, 0], ["jsonb", "int"]), "no_profile"));
}

/* ---------- Tages-Ergebnis ---------- */
{
  const today = (await one("select (now() at time zone 'Europe/Berlin')::date::text as d"))[0].d;
  const planned = (await one("select lineup_id from public.daily_lineups where day = $1::date", [today]))[0]?.lineup_id;
  const other = (await one("select id from public.lineup_catalog where id <> $1 limit 1", [planned || ""]))[0].id;
  const sub = (u, day, lu, c, s) => call(u, "submit_daily", [day, lu, c, s], ["date", "text", "int", "int"]);
  check("Heutige Aufstellung ist im Plan", !!planned);
  check("Ergebnis speichern", (await sub(U.anna, today, planned, 9, 140)).recorded === true);
  check("Zweiter Versuch aendert nichts (erstes zaehlt)", (await sub(U.anna, today, planned, 11, 60)).recorded === false && (await one("select correct from public.daily_results where user_id = $1 and day = $2::date", [U.anna, today]))[0].correct === 9);
  check("Falsche Aufstellung abgelehnt", err(await sub(U.ben, today, other, 5, 100), "wrong_lineup"));
  check("Unbekannte Aufstellung abgelehnt", err(await sub(U.ben, today, "gibts-nicht", 5, 100), "wrong_lineup"));
  check("Richtige > 11 abgelehnt", err(await sub(U.ben, today, planned, 12, 100), "bad_correct"));
  check("Zu schnell (unter Mindestzeit) abgelehnt", err(await sub(U.ben, today, planned, 11, 5), "bad_seconds"));
  check("Zukunft abgelehnt", err(await sub(U.ben, (await one("select ((now() at time zone 'Europe/Berlin')::date + 1)::text d"))[0].d, planned, 5, 100), "bad_day"));
  check("Zu lange her abgelehnt", err(await sub(U.ben, (await one("select ((now() at time zone 'Europe/Berlin')::date - 10)::text d"))[0].d, planned, 5, 100), "bad_day"));
  check("Ben speichert", (await sub(U.ben, today, planned, 7, 200)).recorded === true);
  await sub(U.fritz, today, planned, 11, 300);
  const fd = await call(U.anna, "friends_daily", [today], ["date"]);
  check("Heute unter Freunden: ich + Freund, sortiert, ohne Aufstellung", fd.length === 2 && fd[0].username === "anna_neu" && fd[0].mine === true && fd[1].username === "ben.bolzt" && fd.every((r) => r.lineup_id === undefined), JSON.stringify(fd));
  check("Fremder (Fritz) taucht nicht auf, sieht aber nur sich selbst", (await call(U.fritz, "friends_daily", [today], ["date"])).length === 1);
  check("Tages-Ergebnis fremder Nutzer nicht lesbar (Tabelle)", (await sqlAs(U.fritz, "select * from public.daily_results where user_id = $1", [U.anna])).rows.length === 0);
}

/* ---------- Duell ---------- */
const crd = (u, opp, rounds = 3, sec = 120, diff = 0) => call(u, "create_duel", [opp, rounds, sec, diff], ["uuid", "int", "int", "int"]);
const sr = (u, duel, round, c, s, solved = null, mask = null, left = 0) => call(u, "submit_round", [duel, round, c, s, solved, mask, left], ["uuid", "int", "int", "int", "jsonb", "int", "int"]);
{
  // Anna + Ben sind Freunde (oben wiederhergestellt), Cora + Dave sind Freunde
  check("Duell nur gegen Freunde", err(await crd(U.anna, U.fritz), "not_friends"));
  check("Duell gegen mich selbst nicht", err(await crd(U.anna, U.anna), "not_friends"));
  check("Ungueltige Einstellungen", err(await crd(U.anna, U.ben, 2), "bad_settings") && err(await crd(U.anna, U.ben, 3, 45), "bad_settings") && err(await crd(U.anna, U.ben, 3, 120, 9), "bad_settings"));
  const d1 = await crd(U.anna, U.ben, 3, 120, 0);
  check("Duell angelegt (uuid)", typeof d1 === "string" && d1.length === 36, JSON.stringify(d1));
  const rd = await one("select lineup_id from public.duel_rounds where duel_id = $1 order by round", [d1]);
  check("3 verschiedene Aufstellungen aus dem Katalog", rd.length === 3 && new Set(rd.map((r) => r.lineup_id)).size === 3);
  check("Push 'duel_challenge' an Ben", (await one("select count(*)::int n from public.notification_queue where to_user = $1 and kind = 'duel_challenge'", [U.ben]))[0].n === 1);
  const dd = await crd(U.anna, U.ben, 3, 120, 4);
  check("Stufe wird beachtet", (await one("select bool_and(c.difficulty = 4) ok from public.duel_rounds r join public.lineup_catalog c on c.id = r.lineup_id where r.duel_id = $1", [dd]))[0].ok === true);
  await call(U.anna, "cancel_duel", [dd], ["uuid"]);
  check("Abbrechen (Herausforderer, Gegner nicht gespielt)", (await one("select status from public.duels where id = $1", [dd]))[0].status === "cancelled");

  check("Fremder sieht das Duell nicht", err(await call(U.fritz, "get_duel", [d1], ["uuid"]), "no_duel") && (await sqlAs(U.fritz, "select * from public.duels")).rows.length === 0 && (await sqlAs(U.fritz, "select * from public.duel_rounds")).rows.length === 0);
  check("Fremder kann keine Runde abgeben", err(await sr(U.fritz, d1, 1, 5, 100), "no_duel"));
  check("Rundennummer ausserhalb", err(await sr(U.anna, d1, 4, 5, 100), "bad_round") && err(await sr(U.anna, d1, 0, 5, 100), "bad_round"));
  check("Richtige > 11 / < 0", err(await sr(U.anna, d1, 1, 12, 100), "bad_correct") && err(await sr(U.anna, d1, 1, -1, 100), "bad_correct"));
  check("Zeit ueber Limit", err(await sr(U.anna, d1, 1, 5, 200), "bad_seconds"));
  check("Zu schnell fuer die Richtigen", err(await sr(U.anna, d1, 1, 11, 10), "too_fast"));
  check("Ungueltige Loesungszeiten", err(await sr(U.anna, d1, 1, 5, 100, [1, "x"]), "bad_solved") && err(await sr(U.anna, d1, 1, 5, 100, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), "bad_solved") && err(await sr(U.anna, d1, 1, 5, 100, null, 5000), "bad_mask"));

  // Anna spielt alle 3 Runden: 9/80, 8/100, 7/110
  const a1 = await sr(U.anna, d1, 1, 9, 80, [3, 8, null, 20], 511, 0);
  check("Runde abgegeben", a1.recorded === true && a1.finished === false, JSON.stringify(a1));
  check("Doppeltes Senden zaehlt nicht doppelt", (await sr(U.anna, d1, 1, 11, 50)).recorded === false && (await one("select correct from public.duel_results where duel_id = $1 and round = 1 and user_id = $2", [d1, U.anna]))[0].correct === 9);
  await sr(U.anna, d1, 2, 8, 100); await sr(U.anna, d1, 3, 7, 110);

  // Versiegelung: Ben hat noch nichts gespielt -> sieht Annas Ergebnisse nicht
  check("Versiegelt: Ben sieht Annas Ergebnis nicht (Funktion)", (await call(U.ben, "get_duel", [d1], ["uuid"])).rounds_list.every((r) => r.theirs === null && r.mine === null));
  check("Versiegelt: Ben sieht Annas Ergebnis nicht (Tabelle)", (await sqlAs(U.ben, "select * from public.duel_results")).rows.length === 0);
  check("Anna sieht ihre eigenen Ergebnisse", (await call(U.anna, "get_duel", [d1], ["uuid"])).rounds_list.every((r) => r.mine && r.theirs === null));
  check("Ben darf Duell nicht mehr abbrechen (nicht Herausforderer)", err(await call(U.ben, "cancel_duel", [d1], ["uuid"]), "not_allowed"));

  // Ben spielt Runde 1 -> sieht Runde 1 von Anna, aber noch nicht 2 und 3
  await sr(U.ben, d1, 1, 7, 90);
  const bv = await call(U.ben, "get_duel", [d1], ["uuid"]);
  check("Nach eigener Runde 1: nur Annas Runde 1 sichtbar", bv.rounds_list[0].theirs?.correct === 9 && bv.rounds_list[1].theirs === null && bv.rounds_list[2].theirs === null, JSON.stringify(bv.rounds_list.map((r) => !!r.theirs)));
  const bt = await sqlAs(U.ben, "select round from public.duel_results where user_id = $1 order by round", [U.anna]);
  check("Tabellen-Zugriff genauso versiegelt", bt.rows.length === 1 && bt.rows[0].round === 1);
  check("Annas Loesungszeiten sichtbar nach Runde", JSON.stringify(bv.rounds_list[0].theirs.solved) === "[3,8,null,20]" && bv.rounds_list[0].theirs.mask === 511);
  check("Herausforderer kann nach Spielbeginn des Gegners nicht abbrechen", err(await call(U.anna, "cancel_duel", [d1], ["uuid"]), "already_played"));
  check("Gegner kann nach eigener Runde nicht ablehnen", err(await call(U.ben, "decline_duel", [d1], ["uuid"]), "already_played"));
  await sr(U.ben, d1, 2, 8, 111);   // gleiche Richtige, Ben langsamer -> Anna gewinnt Runde 2
  const last = await sr(U.ben, d1, 3, 8, 120);
  check("Letzte Runde beendet das Duell", last.recorded === true && last.finished === true, JSON.stringify(last));
  const fin = await call(U.anna, "get_duel", [d1], ["uuid"]);
  check("Ergebnis: Anna 2 Runden, Ben 1, Sieger Anna, nach Runden", fin.status === "finished" && fin.result.winner === U.anna && fin.result.by === "rounds" && fin.result.creator_rounds === 2 && fin.result.opponent_rounds === 1, JSON.stringify(fin.result));
  check("Rundenwertung: Anna (Richtige), Anna (Zeit), Ben (Richtige)", fin.result.rounds.map((r) => r.w + ":" + r.by).join() === "creator:correct,creator:time,opponent:correct", JSON.stringify(fin.result.rounds));
  check("Beide sehen dasselbe Ergebnis", JSON.stringify((await call(U.ben, "get_duel", [d1], ["uuid"])).result) === JSON.stringify(fin.result));
  check("Nach Ende: alles sichtbar", (await call(U.ben, "get_duel", [d1], ["uuid"])).rounds_list.every((r) => r.mine && r.theirs));
  check("Push 'duel_finished' an beide (je einmal)", (await one("select count(*)::int n from public.notification_queue where kind = 'duel_finished' and payload->>'duel' = $1", [d1]))[0].n === 2);
  check("Nach Ende keine Abgabe mehr", err(await sr(U.ben, d1, 3, 8, 120), "duel_closed"));
  check("Nach Ende wird nichts doppelt beendet/benachrichtigt", (await one("select count(*)::int n from public.notification_queue where kind = 'duel_finished' and payload->>'duel' = $1", [d1]))[0].n === 2);
  const lst = await call(U.ben, "list_duels");
  check("Liste: beendetes Duell mit Gegner und Zaehlern", lst[0].id === d1 && lst[0].status === "finished" && lst[0].other.username === "anna_neu" && lst[0].my_done === 3 && lst[0].their_done === 3 && lst[0].i_am === "opponent");

  // Wertung: Gesamt-Richtige (Runden gleich), Zeit, Remis
  const mkDuel = async (resA, resB) => { const d = await crd(U.cora, U.dave, 3, 120, 0); for (let i = 0; i < 3; i++) { await sr(U.cora, d, i + 1, resA[i][0], resA[i][1]); await sr(U.dave, d, i + 1, resB[i][0], resB[i][1]); } return (await call(U.cora, "get_duel", [d], ["uuid"])).result; };
  let r = await mkDuel([[9, 90], [5, 100], [8, 100]], [[8, 90], [6, 100], [6, 100]]);
  check("Runden 2:1 fuer Cora -> nach Runden", r.by === "rounds" && r.winner === U.cora && r.creator_rounds === 2, JSON.stringify(r));
  r = await mkDuel([[10, 90], [5, 100], [7, 100]], [[8, 90], [6, 100], [7, 100]]);
  check("Runden 1:1 (+ Remis-Runde) -> mehr Richtige gesamt (22:21) gewinnt", r.by === "correct" && r.winner === U.cora && r.rounds[2].w === "draw", JSON.stringify(r));
  r = await mkDuel([[9, 90], [5, 100], [7, 100]], [[8, 80], [6, 100], [7, 100]]);
  check("Runden 1:1, Richtige gleich (21:21) -> Gesamtzeit entscheidet (Dave 280 s)", r.by === "time" && r.winner === U.dave, JSON.stringify(r));
  r = await mkDuel([[7, 90], [6, 100], [7, 100]], [[7, 91], [6, 101], [7, 101]]);
  check("Cora in jeder Runde schneller -> Runden 3:0", r.winner === U.cora && r.by === "rounds" && r.creator_rounds === 3 && r.opponent_rounds === 0, JSON.stringify(r));
  r = await mkDuel([[7, 90], [6, 100], [7, 100]], [[7, 90], [6, 100], [7, 100]]);
  check("Komplett gleich -> Remis", r.winner === null && r.by === "draw", JSON.stringify(r));

  // Bo1, Ablehnen und Fristen
  const d2 = await crd(U.cora, U.dave, 1, 60, 1);
  await call(U.dave, "decline_duel", [d2], ["uuid"]);
  check("Ablehnen (Gegner, vor dem Spielen)", (await one("select status from public.duels where id = $1", [d2]))[0].status === "declined" && (await one("select count(*)::int n from public.notification_queue where to_user = $1 and kind = 'duel_declined'", [U.cora]))[0].n === 1);
  check("Abgelehntes Duell: keine Abgabe", err(await sr(U.dave, d2, 1, 5, 50), "duel_closed"));
  const d3 = await crd(U.cora, U.dave, 3, 120);
  await sr(U.cora, d3, 1, 5, 100); await sr(U.cora, d3, 2, 5, 100);
  await db.exec(`update public.duels set deadline = now() + interval '5 hours' where id = '${d3}'`);
  const w1 = await callService("enqueue_deadline_warnings");
  check("Erinnerung 6 h vor Ablauf an beide mit offenen Runden", w1 >= 2 && (await one("select count(*)::int n from public.notification_queue where kind = 'duel_deadline_warning' and payload->>'duel' = $1", [d3]))[0].n === 2);
  check("Erinnerung nur einmal je Duell", (await callService("enqueue_deadline_warnings")) === 0);
  await db.exec(`update public.duels set deadline = now() - interval '1 minute' where id = '${d3}'`);
  check("Nach Ablauf keine Abgabe mehr", err(await sr(U.dave, d3, 1, 5, 100), "deadline_passed"));
  const n = await callService("process_deadlines");
  const f3 = await call(U.dave, "get_duel", [d3], ["uuid"]);
  check("Frist: Sieg fuer den, der gespielt hat (Cora), by=forfeit", n >= 1 && f3.status === "finished" && f3.result.winner === U.cora && f3.result.by === "forfeit", JSON.stringify(f3.result));
  check("Frist: Dave sieht Coras Runden nach Ende", f3.rounds_list[0].theirs?.correct === 5);
  check("Frist: Push an beide", (await one("select count(*)::int n from public.notification_queue where kind = 'duel_finished' and payload->>'duel' = $1 and payload->>'by' = 'deadline'", [d3]))[0].n === 2);
  check("Zeitplaner zweimal = nichts doppelt", (await callService("process_deadlines")) === 0);
  const d4 = await crd(U.cora, U.dave, 1, 60); await db.exec(`update public.duels set deadline = now() - interval '1 hour' where id = '${d4}'`);
  await callService("process_deadlines");
  check("Niemand gespielt -> abgelaufen (expired), Push an Herausforderer", (await one("select status from public.duels where id = $1", [d4]))[0].status === "expired" && (await one("select count(*)::int n from public.notification_queue where kind = 'duel_expired' and to_user = $1", [U.cora]))[0].n === 1);
  const d5 = await crd(U.cora, U.dave, 3, 120);
  await sr(U.cora, d5, 1, 6, 100); await sr(U.dave, d5, 1, 7, 100); await sr(U.cora, d5, 2, 6, 100); await sr(U.dave, d5, 2, 4, 100);
  await db.exec(`update public.duels set deadline = now() - interval '1 hour' where id = '${d5}'`);
  await callService("process_deadlines");
  const f5 = (await call(U.cora, "get_duel", [d5], ["uuid"])).result;
  check("Gleich viele Runden, Frist ab -> gemeinsame Runden entscheiden (1:1, Cora mehr Richtige)", f5.by === "correct" && f5.winner === U.cora && f5.creator_rounds === 1 && f5.opponent_rounds === 1, JSON.stringify(f5));

  // Blockieren/Freund entfernen beendet offene Duelle
  const d6 = await crd(U.anna, U.ben, 3, 120);
  await call(U.ben, "block_user", [U.anna], ["uuid"]);
  check("Blockieren beendet offenes Duell sauber (cancelled)", (await one("select status from public.duels where id = $1", [d6]))[0].status === "cancelled" && err(await sr(U.anna, d6, 1, 5, 100), "duel_closed"));
  await call(U.ben, "unblock_user", [U.anna], ["uuid"]); await call(U.ben, "send_request", [U.anna], ["uuid"]); await call(U.anna, "answer_request", [U.ben, true], ["uuid", "boolean"]);
  const d7 = await crd(U.anna, U.ben, 1, 60);
  await call(U.anna, "remove_friend", [U.ben], ["uuid"]);
  check("Freund entfernen beendet offenes Duell", (await one("select status from public.duels where id = $1", [d7]))[0].status === "cancelled");
  check("Ohne Freundschaft kein neues Duell", err(await crd(U.anna, U.ben), "not_friends"));
  await call(U.ben, "send_request", [U.anna], ["uuid"]); await call(U.anna, "answer_request", [U.ben, true], ["uuid", "boolean"]);
  // Limits
  await db.exec("update public.app_config set value = 1 where key = 'max_open_duels'");
  const d8 = await crd(U.anna, U.ben, 1, 60); await db.exec("update public.duels set status = 'cancelled' where id <> '" + d8 + "' and status = 'open'");
  check("Zu viele offene Duelle", err(await crd(U.anna, U.ben, 1, 60), "too_many_duels"));
  await db.exec("update public.app_config set value = 30 where key = 'max_open_duels'");
  await db.exec("update public.app_config set value = 1 where key = 'create_duel_per_minute'"); await db.exec("delete from public.rate_events");
  await crd(U.anna, U.ben, 1, 60); check("Duelle pro Minute begrenzt", err(await crd(U.anna, U.ben, 1, 60), "rate_limited"));
  await db.exec("update public.app_config set value = 10 where key = 'create_duel_per_minute'"); await db.exec("delete from public.rate_events");
  // Aufstellungen wiederholen sich gegen denselben Gegner nicht, solange genug da sind
  const prev = new Set((await one("select r.lineup_id from public.duel_rounds r join public.duels d on d.id = r.duel_id where d.created_by in ($1, $2) and d.opponent in ($1, $2)", [U.anna, U.ben])).map((x) => x.lineup_id));
  const dn = await crd(U.anna, U.ben, 5, 120, 0);
  const now5 = (await one("select lineup_id from public.duel_rounds where duel_id = $1", [dn])).map((x) => x.lineup_id);
  check("Neue Aufstellungen gegen denselben Gegner (soweit moeglich)", now5.filter((x) => !prev.has(x)).length >= 3, String(now5.filter((x) => !prev.has(x)).length));
}

/* ---------- Geraete / Push ---------- */
{
  check("Geraet registrieren", isVoid((await call(U.anna, "register_device", ["tok-anna-123456", "ios"]))));
  check("Ungueltige Plattform", /check|violates/i.test((await call(U.anna, "register_device", ["tok-anna-654321", "windows"])).error || ""));
  await call(U.ben, "register_device", ["tok-anna-123456", "android"]);
  check("Ein Token gehoert nur einem Konto (Handywechsel)", (await one("select user_id from public.devices where token = 'tok-anna-123456'")).map((r) => r.user_id).join() === U.ben);
  check("Schalter je Art", isVoid(await call(U.ben, "set_notify", [{ duel_challenge: true, friend_request: false }], ["jsonb"])) && (await one("select notify from public.devices where user_id = $1", [U.ben]))[0].notify.friend_request === false);
  check("Schalter ungueltig", err(await call(U.ben, "set_notify", [{ a: "ja" }], ["jsonb"]), "bad_prefs"));
  check("Geraete anderer unsichtbar", (await sqlAs(U.anna, "select * from public.devices")).rows.length === 0);
}

/* ---------- Konto loeschen ---------- */
{
  const before = (await one("select count(*)::int n from public.duels where $1 in (created_by, opponent)", [U.dave]))[0].n;
  check("Dave hat Duelle", before > 0);
  check("Konto loeschen", isVoid((await call(U.dave, "delete_account"))));
  check("Alles weg: Profil, Duelle, Ergebnisse, Freundschaften, Geraete, Spielstand, Tages-Ergebnisse", (await one(`select
      (select count(*) from public.profiles where id = $1) + (select count(*) from public.duels where $1 in (created_by, opponent)) + (select count(*) from public.duel_results where user_id = $1)
      + (select count(*) from public.friendships where $1 in (user_a, user_b)) + (select count(*) from public.devices where user_id = $1) + (select count(*) from public.saves where user_id = $1)
      + (select count(*) from public.daily_results where user_id = $1) + (select count(*) from public.public_stats where user_id = $1) + (select count(*) from auth.users where id = $1) as n`, [U.dave]))[0].n == 0);
  check("Name wird frei", (await claim(U.fritz, "dave88")).ok === true);
  check("Cora bleibt (Duelle mit Dave sind mit ihm weg)", (await call(U.cora, "my_profile")).username === "cora_c");
}

console.log(fails ? `\n${fails} von ${total} FALSCH` : `OK - ${total} Datenbank-Prüfungen bestanden`);
process.exit(fails ? 1 : 0);
