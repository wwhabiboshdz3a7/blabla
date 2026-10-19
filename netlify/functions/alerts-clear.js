// POST /api/alerts/clear — vide le fil des alertes affichées dans le site (bouton « Effacer »).
const { redis } = require("./_upstash");
const { resp, preflight, checkCode } = require("./_util");

exports.handler = async (event) => {
  const pf = preflight(event);
  if (pf) return pf;
  if (event.httpMethod !== "POST") return resp(405, { error: "méthode non autorisée" });
  if (!checkCode(event)) return resp(401, { error: "code d'accès invalide" });
  try {
    await redis(["DEL", "vigie:alerts"]);
    return resp(200, { ok: true });
  } catch (e) {
    return resp(500, { error: String(e.message || e) });
  }
};
