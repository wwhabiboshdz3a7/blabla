// Chien de garde « hors ligne » — fonction PLANIFIÉE (voir la planification dans netlify.toml).
// S'exécute chaque minute, sans requête : pour chaque ordinateur suivi, si l'agent n'a plus
// donné signe de vie depuis OFFLINE_MS, on envoie une notification « hors ligne » (une seule
// fois par épisode), puis on pose un drapeau. Le retour en ligne est géré par status-ingest.
const { redis } = require("./_upstash");
const { sendToAll } = require("./_push");

const OFFLINE_MS = 150 * 1000;    // ~2 min 30 sans nouvelles -> on alerte

exports.handler = async () => {
  const now = Date.now();
  try {
    const hosts = (await redis(["SMEMBERS", "vigie:hosts"])) || [];
    for (const host of hosts) {
      const seen = Number((await redis(["GET", "vigie:seen:" + host])) || 0);
      if (!seen) {
        // plus d'état du tout (expiré) : on retire l'ordinateur de la liste.
        await redis(["SREM", "vigie:hosts", host]);
        continue;
      }
      const offlineKey = "vigie:offline:" + host;
      const alreadyFlagged = await redis(["GET", offlineKey]);
      if (now - seen > OFFLINE_MS && !alreadyFlagged) {
        await redis(["SET", offlineKey, String(now), "EX", "604800"]);
        const mins = Math.round((now - seen) / 60000);
        const title = `🔴 ${host} hors ligne`;
        const message = `Aucune nouvelle depuis ~${mins} min (ordinateur éteint, en veille, ou coupé du réseau).`;
        await redis(["LPUSH", "vigie:alerts",
          JSON.stringify({ id: "a" + now, t: now, host, level: "critical", title, message })]);
        await redis(["LTRIM", "vigie:alerts", "0", "99"]);
        await sendToAll(title, message, { host, level: "critical" });
      }
    }
    return { statusCode: 200, body: "ok" };
  } catch (e) {
    return { statusCode: 500, body: String(e.message || e) };
  }
};
