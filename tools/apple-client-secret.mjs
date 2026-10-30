// Erzeugt das "Client-Secret" fuer Sign in with Apple (Supabase-Dashboard -> Authentication -> Providers -> Apple -> Secret Key).
// Es ist ein JWT (ES256), von Apple hoechstens 6 Monate gueltig - Erneuerung im Kalender notieren.
// Aufruf: node tools/apple-client-secret.mjs <Pfad-zur-AuthKey_XXXX.p8> <KeyID>
// Die .p8-Datei wird nur lokal gelesen. Das Ergebnis geht in die Zwischenablage (macOS) und wird NICHT ausgegeben.
// Niemals die .p8-Datei oder das erzeugte Secret ins Repo legen oder in einen Chat kopieren.
import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const TEAM_ID = "CS9J7W6JPM";              // Apple Team ID (nicht geheim)
const SERVICES_ID = "de.startelo.login.web"; // Services ID = Client ID fuer die Web-Anmeldung
const MAX_TAGE = 180;                       // Apple erlaubt hoechstens ca. 6 Monate

const [p8Pfad, keyId] = process.argv.slice(2);
if (!p8Pfad || !keyId) { console.error("Aufruf: node tools/apple-client-secret.mjs <Pfad-zur-.p8-Datei> <KeyID>"); process.exit(1); }
if (!/^[A-Z0-9]{10}$/.test(keyId)) { console.error("Die Key ID hat 10 Zeichen (Grossbuchstaben/Ziffern), z. B. ABC123DEFG."); process.exit(1); }

const b64u = (b) => Buffer.from(b).toString("base64url");
const jetzt = Math.floor(Date.now() / 1000);
const ablauf = jetzt + MAX_TAGE * 24 * 3600;
const kopf = { alg: "ES256", kid: keyId, typ: "JWT" };
const nutzlast = { iss: TEAM_ID, iat: jetzt, exp: ablauf, aud: "https://appleid.apple.com", sub: SERVICES_ID };
const daten = `${b64u(JSON.stringify(kopf))}.${b64u(JSON.stringify(nutzlast))}`;
const schluessel = crypto.createPrivateKey(fs.readFileSync(p8Pfad, "utf8"));
const signatur = crypto.sign("sha256", Buffer.from(daten), { key: schluessel, dsaEncoding: "ieee-p1363" });
const jwt = `${daten}.${b64u(signatur)}`;

const kopie = spawnSync("pbcopy", { input: jwt });
if (kopie.status !== 0) { console.error("pbcopy nicht verfuegbar - Secret konnte nicht in die Zwischenablage gelegt werden."); process.exit(1); }
const bis = new Date(ablauf * 1000).toLocaleDateString("de-DE");
console.log(`Client-Secret ist in der Zwischenablage (${jwt.length} Zeichen). Gueltig bis ${bis}.`);
console.log(`Im Kalender eintragen: neues Secret erzeugen spaetestens am ${new Date((ablauf - 14 * 24 * 3600) * 1000).toLocaleDateString("de-DE")}.`);
