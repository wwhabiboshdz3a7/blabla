// POST /api/push/test — envoie une notification de test sur le canal ntfy, pour vérifier
// d'un coup que tout est bien branché (bouton « Tester » dans le site).
const { resp, preflight, checkCode } = require("./_util");
const { sendToAll } = require("./_push");

exports.handler = async (event) => {
  const pf = preflight(event);
  if (pf) return pf;
  if (event.httpMethod !== "POST") return resp(405, { error: "méthode non autorisée" });
  if (!checkCode(event)) return resp(401, { error: "code d'accès invalide" });
  try {
    const r = await sendToAll("Vigie PC ✅", "Notification de test : tout fonctionne.", { level: "info" });
    if (!r.sent) return resp(200, { ok: false, error: "ntfy n'a pas accepté le message (" + (r.error || r.status) + ")." });
    return resp(200, { ok: true, ...r });
  } catch (e) {
    return resp(500, { error: String(e.message || e) });
  }
};
