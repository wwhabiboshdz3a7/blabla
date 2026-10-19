// POST /api/push/unsubscribe {endpoint} — retire l'abonnement Web Push (bouton « Ne plus
// recevoir de notifications » dans le site).
const { redis } = require("./_upstash");
const { resp, preflight, checkCode } = require("./_util");
const { SUBS_KEY } = require("./_push");

exports.handler = async (event) => {
  const pf = preflight(event);
  if (pf) return pf;
  if (event.httpMethod !== "POST") return resp(405, { error: "méthode non autorisée" });
  if (!checkCode(event)) return resp(401, { error: "code d'accès invalide" });
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return resp(400, { error: "JSON invalide" }); }
  const endpoint = body.endpoint || (body.subscription && body.subscription.endpoint);
  if (!endpoint) return resp(400, { error: "endpoint manquant" });
  try {
    await redis(["HDEL", SUBS_KEY, endpoint]);
    return resp(200, { ok: true });
  } catch (e) {
    return resp(500, { error: String(e.message || e) });
  }
};
