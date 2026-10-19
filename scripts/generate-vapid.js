#!/usr/bin/env node
// Génère une paire de clés VAPID pour les notifications Web Push.
// À lancer une seule fois. Colle ensuite les deux clés dans les variables d'environnement
// Netlify VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY (voir le README).
//
//   cd netlify/functions && npm install        (une fois, pour avoir web-push)
//   node ../../scripts/generate-vapid.js
//
// La clé privée ne doit JAMAIS être mise dans le site ni dans l'agent : seulement dans Netlify.
let webpush;
try {
  webpush = require("web-push");
} catch (e) {
  console.error("Le paquet « web-push » est introuvable.");
  console.error("Installe-le d'abord :  cd netlify/functions && npm install");
  process.exit(1);
}
const keys = webpush.generateVAPIDKeys();
console.log("Clés VAPID générées — à coller dans les variables d'environnement Netlify :\n");
console.log("VAPID_PUBLIC_KEY  =", keys.publicKey);
console.log("VAPID_PRIVATE_KEY =", keys.privateKey);
console.log("VAPID_SUBJECT     = mailto:ton-email@exemple.com   (ton adresse, pour le standard Web Push)");
