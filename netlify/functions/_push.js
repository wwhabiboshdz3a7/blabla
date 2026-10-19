// Envoi de notifications Web Push à tous les téléphones abonnés (clés VAPID stockées côté
// Netlify uniquement). Utilisé par status-ingest (alertes), watchdog (hors ligne) et push-test.
const webpush = require("web-push");
const { redis } = require("./_upstash");
const { hgetallToObj } = require("./_util");

const SUBS_KEY = "vigie:push:subs";

function configured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

async function sendToAll(title, message, data) {
  if (!configured()) return { sent: 0, skipped: true };
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  const flat = (await redis(["HGETALL", SUBS_KEY])) || [];
  const subs = hgetallToObj(flat);
  const payload = JSON.stringify({ title, message, data: data || {} });
  const dead = [];
  let sent = 0;
  await Promise.all(
    Object.entries(subs).map(async ([endpoint, json]) => {
      try {
        await webpush.sendNotification(JSON.parse(json), payload);
        sent += 1;
      } catch (e) {
        // 404/410 = abonnement expiré (téléphone désinstallé, autorisation retirée) : on nettoie.
        if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(endpoint);
      }
    })
  );
  if (dead.length) await redis(["HDEL", SUBS_KEY, ...dead]);
  return { sent, cleaned: dead.length };
}

module.exports = { sendToAll, configured, SUBS_KEY };
