// POST /api/status/ingest  (appelé UNIQUEMENT par l'agent qui tourne sur l'ordinateur,
// protégé par x-vigie-secret).
// Corps : { host, snapshot:{...}, alerts:[{level,title,message,key}] }
// Rôle : mémorise le dernier état de l'ordinateur + un historique court (pour les courbes),
// déclenche une notification push pour chaque alerte, détecte le retour « en ligne », et
// renvoie les commandes déposées depuis le téléphone (ping, message, verrouiller...).
const { redis, pipeline } = require("./_upstash");
const { resp, preflight, checkSecret } = require("./_util");
const { sendToAll } = require("./_push");

const HISTORY_KEEP = 180;   // ~1 h d'historique si l'agent envoie toutes les 20 s
const ALERTS_KEEP = 100;
const HOST_TTL_S = 7 * 24 * 3600;

function safeHost(h) {
  return String(h || "ordinateur").slice(0, 64).replace(/[^\w .@+-]/g, "_");
}

exports.handler = async (event) => {
  const pf = preflight(event);
  if (pf) return pf;
  if (event.httpMethod !== "POST") return resp(405, { error: "méthode non autorisée" });
  if (!checkSecret(event)) return resp(401, { error: "secret invalide" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return resp(400, { error: "JSON invalide" }); }

  const host = safeHost(body.host);
  const now = Date.now();
  const snap = body.snapshot || {};
  snap.host = host;
  snap.received = now;

  try {
    const latestKey = "vigie:latest:" + host;
    const seenKey = "vigie:seen:" + host;
    const histKey = "vigie:history:" + host;
    const offlineKey = "vigie:offline:" + host;

    // Était-il marqué « hors ligne » côté serveur ? Si oui, c'est un retour en ligne.
    const wasOffline = await redis(["GET", offlineKey]);

    const histEntry = JSON.stringify({
      t: now,
      cpu: num(snap.cpu_pct),
      ram: num(snap.ram_pct),
      disk: num(snap.disk_pct),
      batt: num(snap.battery_pct),
    });

    await pipeline([
      ["SET", latestKey, JSON.stringify(snap), "EX", String(HOST_TTL_S)],
      ["SET", seenKey, String(now), "EX", String(HOST_TTL_S)],
      ["SADD", "vigie:hosts", host],
      ["RPUSH", histKey, histEntry],
      ["LTRIM", histKey, String(-HISTORY_KEEP), "-1"],
      ["EXPIRE", histKey, String(HOST_TTL_S)],
      ["DEL", offlineKey],
    ]);

    // Notifications : d'abord le retour en ligne, puis les alertes signalées par l'agent.
    if (wasOffline) {
      await pushAlert({ host, level: "info", title: `🟢 ${host} de retour en ligne`,
                        message: "L'ordinateur redonne signe de vie." }, now);
    }
    const alerts = Array.isArray(body.alerts) ? body.alerts.slice(0, 20) : [];
    for (const a of alerts) {
      const level = ["info", "warn", "critical"].includes(a.level) ? a.level : "warn";
      const title = String(a.title || "Vigie PC").slice(0, 120);
      const message = String(a.message || "").slice(0, 300);
      await pushAlert({ host, level, title, message }, now);
    }

    // Commandes en attente pour cet ordinateur (déposées depuis le téléphone) : on les
    // renvoie à l'agent et on vide la file dans la foulée.
    const cmdKey = "vigie:cmd:" + host;
    const got = await pipeline([["LRANGE", cmdKey, "0", "-1"], ["DEL", cmdKey]]);
    const commands = ((got && got[0]) || []).map((j) => {
      try { return JSON.parse(j); } catch { return null; }
    }).filter(Boolean);

    return resp(200, { ok: true, commands });
  } catch (e) {
    return resp(500, { error: String(e.message || e) });
  }
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

async function pushAlert(a, now) {
  const entry = JSON.stringify({ id: "a" + now + Math.random().toString(36).slice(2, 7), t: now, ...a });
  await pipeline([
    ["LPUSH", "vigie:alerts", entry],
    ["LTRIM", "vigie:alerts", "0", String(ALERTS_KEEP - 1)],
  ]);
  await sendToAll(a.title, a.message, { host: a.host, level: a.level });
}
