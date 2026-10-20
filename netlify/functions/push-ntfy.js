// GET  /api/push/ntfy               — donne au site le canal ntfy à suivre dans l'appli.
// POST /api/push/ntfy {reset:true}  — crée un nouveau canal (l'ancien ne reçoit plus rien).
const { resp, preflight, checkCode } = require("./_util");
const { getTopic, resetTopic, server } = require("./_push");

exports.handler = async (event) => {
  const pf = preflight(event);
  if (pf) return pf;
  if (!checkCode(event)) return resp(401, { error: "code d'accès invalide" });
  try {
    let topic;
    if (event.httpMethod === "POST") {
      let body;
      try { body = JSON.parse(event.body || "{}"); } catch { return resp(400, { error: "JSON invalide" }); }
      if (!body.reset) return resp(400, { error: "action inconnue" });
      topic = await resetTopic();
    } else if (event.httpMethod === "GET") {
      topic = await getTopic();
    } else {
      return resp(405, { error: "méthode non autorisée" });
    }
    const base = server();
    return resp(200, {
      server: base,
      topic,
      url: base + "/" + topic,
      app: "ntfy://" + base.replace(/^https?:\/\//, "") + "/" + topic,
      fixed: Boolean(process.env.NTFY_TOPIC),
    });
  } catch (e) {
    return resp(500, { error: String(e.message || e) });
  }
};
