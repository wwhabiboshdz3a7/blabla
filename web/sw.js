// Service worker de Vigie PC : indispensable pour (1) installer le site sur l'écran d'accueil
// du téléphone (PWA) et (2) recevoir les notifications push même quand le site n'est pas ouvert.
// Volontairement minimal : pas de mise en cache lourde, juste l'installation + les notifications.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Notification poussée par le serveur (status-ingest / watchdog) : alerte, hors ligne, retour en ligne…
self.addEventListener("push", (event) => {
  let data = { title: "Vigie PC", message: "Mise à jour.", data: {} };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.message = event.data.text();
  }
  const level = (data.data && data.data.level) || "info";
  const options = {
    body: data.message,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: data.data || {},
    tag: (data.data && data.data.host) ? "vigie-" + data.data.host : "vigie",
    renotify: true,
    requireInteraction: level === "critical",
  };
  event.waitUntil(self.registration.showNotification(data.title || "Vigie PC", options));
});

// Un tap sur la notification ramène au tableau de bord (sans ouvrir un onglet de plus).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
