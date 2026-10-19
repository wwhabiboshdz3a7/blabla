// POST /api/command/add {host, action, arg} — déposé depuis le téléphone pour piloter
// l'ordinateur à distance. La commande attend dans la file ; l'agent la récupère à son
// prochain passage (toutes les ~20 s) et l'exécute SI elle fait partie de sa liste autorisée
// (agent/config.json > allow_commands). Actions prévues :
//   ping      -> l'ordinateur émet un son + une bulle (« où es-tu ? »)
//   notify    -> affiche un message (arg) à l'écran de l'ordinateur
//   refresh   -> renvoie son état tout de suite
//   lock      -> verrouille la session (désactivé par défaut, à autoriser dans la config)
//   sleep     -> met l'ordinateur en veille (désactivé par défaut)
const { redis } = require("./_upstash");
const { resp, preflight, checkCode } = require("./_util");

const KNOWN = ["ping", "notify", "refresh", "lock", "sleep"];

exports.handler = async (event) => {
  const pf = preflight(event);
  if (pf) return pf;
  if (event.httpMethod !== "POST") return resp(405, { error: "méthode non autorisée" });
  if (!checkCode(event)) return resp(401, { error: "code d'accès invalide" });
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return resp(400, { error: "JSON invalide" }); }

  const host = String(body.host || "").slice(0, 64);
  const action = String(body.action || "");
  if (!host) return resp(400, { error: "ordinateur manquant" });
  if (!KNOWN.includes(action)) return resp(400, { error: "action inconnue" });

  const cmd = {
    id: "c" + Date.now() + Math.random().toString(36).slice(2, 6),
    action,
    arg: String(body.arg || "").slice(0, 300),
    t: Date.now(),
  };
  try {
    const key = "vigie:cmd:" + host;
    await redis(["LPUSH", key, JSON.stringify(cmd)]);
    await redis(["LTRIM", key, "0", "19"]);   // au cas où l'ordinateur serait éteint
    await redis(["EXPIRE", key, "86400"]);
    return resp(200, { ok: true, command: cmd });
  } catch (e) {
    return resp(500, { error: String(e.message || e) });
  }
};
