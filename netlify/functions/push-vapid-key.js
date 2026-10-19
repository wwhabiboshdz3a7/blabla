// GET /api/push/vapid-key — donne au navigateur la clé publique nécessaire pour s'abonner
// au Web Push (la clé privée, elle, ne quitte jamais les réglages Netlify).
const { resp, preflight } = require("./_util");

exports.handler = async (event) => {
  const pf = preflight(event);
  if (pf) return pf;
  return resp(200, { key: process.env.VAPID_PUBLIC_KEY || "" });
};
