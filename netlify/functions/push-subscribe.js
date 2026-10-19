// POST /api/push/subscribe {subscription} — enregistre l'abonnement Web Push du téléphone
// (créé par le navigateur quand on active les notifications dans le site).
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
  const sub = body.subscription;
  if (!sub || !sub.endpoint) return resp(400, { error: "abonnement invalide" });
  try {
    await redis(["HSET", SUBS_KEY, sub.endpoint, JSON.stringify(sub)]);
    return resp(200, { ok: true });
  } catch (e) {
    return resp(500, { error: String(e.message || e) });
  }
};
