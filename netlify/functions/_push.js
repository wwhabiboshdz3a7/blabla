// Envoi des notifications sur le téléphone via ntfy (https://ntfy.sh) : une appli gratuite
// (iPhone / Android) qui reçoit tout message publié sur un « canal » (topic). Aucune clé à
// générer, aucun paquet à installer : un simple appel HTTP.
// Le canal est un nom aléatoire créé automatiquement au premier usage et gardé dans Upstash
// (ou imposé par la variable Netlify NTFY_TOPIC). NTFY_SERVER permet d'utiliser un autre
// serveur ntfy que ntfy.sh. Utilisé par status-ingest (alertes), watchdog (hors ligne) et push-test.
const crypto = require("crypto");
const { redis } = require("./_upstash");

const TOPIC_KEY = "vigie:ntfy:topic";
const PRIORITY = { info: 3, warn: 4, critical: 5 };
const TAGS = { info: "information_source", warn: "warning", critical: "rotating_light" };

function server() {
  return (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/$/, "");
}

function newTopic() {
  return "vigie-" + crypto.randomBytes(12).toString("hex");
}

// Canal ntfy : variable NTFY_TOPIC si définie, sinon celui gardé dans Upstash (créé si absent).
async function getTopic() {
  if (process.env.NTFY_TOPIC) return process.env.NTFY_TOPIC;
  const existing = await redis(["GET", TOPIC_KEY]);
  if (existing) return existing;
  const topic = newTopic();
  await redis(["SET", TOPIC_KEY, topic, "NX"]);
  return (await redis(["GET", TOPIC_KEY])) || topic;
}

// Remplace le canal (si l'ancien a fuité) — sans effet si NTFY_TOPIC est imposé sur Netlify.
async function resetTopic() {
  if (process.env.NTFY_TOPIC) return process.env.NTFY_TOPIC;
  const topic = newTopic();
  await redis(["SET", TOPIC_KEY, topic]);
  return topic;
}

async function sendToAll(title, message, data) {
  const d = data || {};
  const level = PRIORITY[d.level] ? d.level : "info";
  const body = {
    topic: await getTopic(),
    title: String(title || "Vigie PC"),
    message: String(message || " "),
    priority: PRIORITY[level],
    tags: [TAGS[level]],
  };
  // Netlify fournit l'adresse du site : un tap sur la notification ouvre le tableau de bord.
  if (process.env.URL) body.click = process.env.URL;
  try {
    const r = await fetch(server(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { sent: r.ok ? 1 : 0, status: r.status };
  } catch (e) {
    return { sent: 0, error: String(e.message || e) };
  }
}

module.exports = { sendToAll, getTopic, resetTopic, server };
