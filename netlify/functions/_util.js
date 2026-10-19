// Utilitaires communs aux fonctions Netlify de Vigie PC
// (réponses JSON + CORS + protection par code d'accès et par secret de l'agent).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Vigie-Code, X-Vigie-Secret",
  "Access-Control-Max-Age": "86400",
};

function resp(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...CORS,
    },
    body: JSON.stringify(obj),
  };
}

// Réponse à la requête préalable CORS (OPTIONS) envoyée par le navigateur.
function preflight(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  return null;
}

function header(event, name) {
  const h = event.headers || {};
  return h[name] || h[name.toLowerCase()] || h[name.toUpperCase()] || "";
}

// Code d'accès « grand public » : protège le tableau de bord (voir l'état, piloter) contre
// n'importe qui qui tomberait sur l'URL du site. Tu choisis ce code et tu le colles une fois
// dans le site (variable Netlify VIGIE_ACCESS_CODE). Si elle est vide, l'accès reste ouvert
// (pratique pour un premier test, à éviter en usage réel).
function checkCode(event) {
  const want = process.env.VIGIE_ACCESS_CODE || "";
  if (!want) return true;
  return header(event, "x-vigie-code") === want;
}

// Secret « agent » : seul l'agent qui tourne sur ton ordinateur le connaît (agent/config.json).
// Protège les routes internes (envoyer l'état, récupérer les commandes) contre le public.
function checkSecret(event) {
  const want = process.env.VIGIE_SHARED_SECRET || "";
  if (!want) return true;
  return header(event, "x-vigie-secret") === want;
}

// Upstash HGETALL renvoie un tableau plat [clé, valeur, clé, valeur, ...] -> objet.
function hgetallToObj(flatArray) {
  const o = {};
  const arr = flatArray || [];
  for (let i = 0; i < arr.length; i += 2) o[arr[i]] = arr[i + 1];
  return o;
}

module.exports = { resp, preflight, header, checkCode, checkSecret, hgetallToObj };
