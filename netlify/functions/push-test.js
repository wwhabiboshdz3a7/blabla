// POST /api/push/test — envoie une notification de test à tous les téléphones abonnés,
// pour vérifier d'un coup que tout est bien branché (bouton « Tester » dans le site).
const { resp, preflight, checkCode } = require("./_util");
const { sendToAll, configured } = require("./_push");

exports.handler = async (event) => {
  const pf = preflight(event);
  if (pf) return pf;
  if (event.httpMethod !== "POST") return resp(405, { error: "méthode non autorisée" });
  if (!checkCode(event)) return resp(401, { error: "code d'accès invalide" });
  if (!configured()) {
    return resp(200, { ok: false, error: "Web Push non configuré sur Netlify (clés VAPID manquantes)." });
  }
  try {
    const r = await sendToAll("Vigie PC ✅", "Notification de test : tout fonctionne.", { test: true });
    return resp(200, { ok: true, ...r });
  } catch (e) {
    return resp(500, { error: String(e.message || e) });
  }
};
