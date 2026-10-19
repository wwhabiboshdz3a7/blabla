// Petit client pour Upstash Redis (base de données partagée gratuite, API REST).
// Pourquoi Upstash : gratuit en usage léger, pas de serveur à gérer, et joignable aussi bien
// depuis une fonction Netlify (serverless) que depuis l'agent Python qui tourne sur l'ordinateur.
// Variables d'environnement à définir sur Netlify (Site settings > Environment variables) :
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// (créées gratuitement sur https://console.upstash.com -> Redis -> Create database -> REST API)

async function redis(cmdParts) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Base de données partagée non configurée (variables UPSTASH_REDIS_REST_URL / " +
      "UPSTASH_REDIS_REST_TOKEN manquantes dans les réglages Netlify)."
    );
  }
  const path = cmdParts.map((p) => encodeURIComponent(String(p))).join("/");
  const r = await fetch(url.replace(/\/$/, "") + "/" + path, {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await r.json();
  if (data && data.error) throw new Error(data.error);
  return data.result;
}

// Plusieurs commandes Redis en une seule requête HTTP (pipeline). Renvoie un tableau de résultats.
async function pipeline(commands) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Base de données partagée non configurée (Upstash).");
  const r = await fetch(url.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  const data = await r.json();
  if (data && data.error) throw new Error(data.error);
  return (data || []).map((d) => (d && d.error ? null : d.result));
}

module.exports = { redis, pipeline };
