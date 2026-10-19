// GET /api/status/get  (appelé par le site/tableau de bord, protégé par le code d'accès).
// Renvoie, pour chaque ordinateur suivi : son dernier état, un court historique (pour les
// courbes CPU/RAM/disque), et le fil des dernières alertes. Le site rafraîchit toutes les ~10 s.
const { redis, pipeline } = require("./_upstash");
const { resp, preflight, checkCode } = require("./_util");

const STALE_MS = 90 * 1000;   // sans nouvelles depuis 90 s -> considéré hors ligne

exports.handler = async (event) => {
  const pf = preflight(event);
  if (pf) return pf;
  if (event.httpMethod !== "GET") return resp(405, { error: "méthode non autorisée" });
  if (!checkCode(event)) return resp(401, { error: "code d'accès invalide" });

  const now = Date.now();
  try {
    const hostNames = (await redis(["SMEMBERS", "vigie:hosts"])) || [];
    const hosts = [];
    for (const host of hostNames) {
      const got = await pipeline([
        ["GET", "vigie:latest:" + host],
        ["GET", "vigie:seen:" + host],
        ["LRANGE", "vigie:history:" + host, "-80", "-1"],
      ]);
      const latest = got[0];
      const seen = Number(got[1] || 0);
      if (!latest && !seen) continue;   // ordinateur expiré : on l'oublie
      let snapshot = null;
      try { snapshot = latest ? JSON.parse(latest) : null; } catch {}
      const history = ((got[2]) || []).map((j) => { try { return JSON.parse(j); } catch { return null; } }).filter(Boolean);
      hosts.push({ host, seen, online: now - seen < STALE_MS, snapshot, history });
    }
    hosts.sort((a, b) => b.seen - a.seen);

    const rawAlerts = (await redis(["LRANGE", "vigie:alerts", "0", "49"])) || [];
    const alerts = rawAlerts.map((j) => { try { return JSON.parse(j); } catch { return null; } }).filter(Boolean);

    return resp(200, { now, hosts, alerts });
  } catch (e) {
    return resp(500, { error: String(e.message || e) });
  }
};
