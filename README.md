# Vigie PC

**Un agrégateur qui surveille ton ordinateur et t'envoie des notifications sur le téléphone,
avec un site dédié pour tout suivre à distance** — même en 4G/5G, loin de la maison.

L'agent tourne sur ton ordinateur (Mac, Windows ou Linux), relève en continu son état
(processeur, mémoire, disque, batterie, réseau, applications surveillées) et le pousse vers un
petit site gratuit. Depuis ton téléphone, tu ouvres ce site (installable comme une app) et tu
vois tout en direct. Dès qu'il se passe quelque chose — disque presque plein, appli qui plante,
batterie faible, ordinateur qui s'éteint ou revient en ligne — tu reçois une **notification
push**. Tu peux aussi, depuis le téléphone, **le faire sonner, lui afficher un message, le
rafraîchir** (et le verrouiller / mettre en veille si tu l'autorises).

```
   Ton ordinateur                 Site gratuit (Netlify + Upstash)              Ton téléphone
 ┌───────────────┐   état/alertes  ┌──────────────────────────────┐   notif push  ┌──────────────┐
 │  agent.py     │ ───────────────▶│  fonctions + base partagée    │ ─────────────▶│  Vigie PC    │
 │ (surveille)   │◀─────────────── │  (état, alertes, file cmd)    │◀───────────── │  (site/PWA)  │
 └───────────────┘   commandes     └──────────────────────────────┘   consultation └──────────────┘
```

Tout repose sur des **offres gratuites** (Netlify + Upstash + l'appli ntfy) et ne demande aucun serveur à gérer.
Les notifications passent par **[ntfy](https://ntfy.sh)** : aucune clé à générer, rien à installer côté site.

---

## Ce qu'il y a dans ce dossier

| Dossier / fichier | Rôle |
|---|---|
| `agent/agent.py` | L'agent qui tourne sur l'ordinateur (Python, multiplateforme). |
| `agent/vigie-mac.command` · `vigie-windows.bat` · `vigie-linux.sh` | Lanceurs « double-clic » par système. |
| `agent/config.example.json` | Modèle de configuration (à copier en `config.json`). |
| `web/` | Le site / tableau de bord (PWA installable sur le téléphone). |
| `netlify/functions/` | Les fonctions serverless (état, notifications, file de commandes, chien de garde). |
| `netlify.toml` | Configuration Netlify (sert `web/` + les fonctions + la planification du chien de garde). |

---

## Mise en place (≈ 15 min, une seule fois)

Il y a trois morceaux : **le site** (dans le cloud), **l'agent** (sur l'ordinateur), **le téléphone**.

### 1) Le site (Netlify + Upstash)

1. **Base de données partagée (Upstash, gratuit)** — crée un compte sur
   <https://console.upstash.com>, puis *Redis → Create database*. Dans l'onglet *REST API*,
   note `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.

2. **Déploie sur Netlify (gratuit)** — crée un compte sur <https://netlify.com>, installe
   l'outil une fois (`npm install -g netlify-cli`), puis depuis ce dossier :
   ```
   netlify login
   netlify deploy --prod
   ```
   Accepte les réglages par défaut (`publish = web`, `functions = netlify/functions`, déjà
   écrits dans `netlify.toml`). Note l'adresse obtenue, par ex. `https://vigie-daniel.netlify.app`.
   *(Tu peux aussi connecter un dépôt Git à Netlify au lieu de la ligne de commande.)*

3. **Variables d'environnement** — dans Netlify, *Site settings → Environment variables*,
   ajoute :

   | Variable | Valeur |
   |---|---|
   | `UPSTASH_REDIS_REST_URL` | (étape 1) |
   | `UPSTASH_REDIS_REST_TOKEN` | (étape 1) |
   | `VIGIE_ACCESS_CODE` | un **code d'accès** que tu choisis (protège le site) |
   | `VIGIE_SHARED_SECRET` | un **secret** que tu choisis (connu seulement de l'agent) |

   Puis redéploie (`netlify deploy --prod`) pour que les variables soient prises en compte.

   *Facultatif* : `NTFY_TOPIC` pour imposer toi-même le nom du canal de notifications (sinon un
   nom aléatoire est créé tout seul et gardé dans Upstash), `NTFY_SERVER` pour utiliser ton
   propre serveur ntfy au lieu de `https://ntfy.sh`.

### 2) L'agent (sur l'ordinateur à surveiller)

1. Copie `agent/config.example.json` en `agent/config.json` et renseigne au moins :
   ```json
   {
     "site_url": "https://vigie-daniel.netlify.app",
     "shared_secret": "le-meme-que-VIGIE_SHARED_SECRET",
     "watch_processes": ["ltx", "Studio Vidéo IA"]
   }
   ```
2. Lance l'agent :
   - **Mac** : double-clic sur `agent/vigie-mac.command`
     *(au tout premier lancement sur Mac : `xattr -dr com.apple.quarantine agent && chmod +x agent/*.command` dans Terminal)*
   - **Windows** : double-clic sur `agent/vigie-windows.bat`
   - **Linux** : `./agent/vigie-linux.sh`

   Les lanceurs préparent tout seuls un petit environnement Python isolé avec `psutil`
   (mesures détaillées). Laisse la fenêtre ouverte : tant qu'elle tourne, l'ordinateur est suivi.

### 3) Le téléphone

1. Ouvre l'adresse du site (`https://vigie-daniel.netlify.app`) dans le navigateur.
2. Ouvre les **Réglages** (roue dentée) et saisis le **code d'accès** (`VIGIE_ACCESS_CODE`).
3. Installe l'appli gratuite **ntfy** ([iPhone](https://apps.apple.com/app/ntfy/id1625396347) ·
   [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)).
4. Sur le site, carte **« Notifications »** : appuie sur **« S'abonner dans ntfy »** (ouvre l'appli
   sur le bon canal), ou dans l'appli **+** puis colle le canal affiché (`vigie-…`).
   Appuie ensuite sur **« Tester »** : la notification doit arriver.
   *(Pas besoin d'installer le site sur l'écran d'accueil pour les notifications : c'est l'appli
   ntfy qui les reçoit.)*

C'est fait. Tu suis ton ordinateur depuis le téléphone, où que tu sois.

---

## Ce que le site affiche et permet

- **Par ordinateur** : état en ligne / hors ligne, jauges Processeur / Mémoire / Disque /
  Batterie, temps allumé, débit réseau, courbe du processeur sur la dernière heure,
  applications surveillées (🟢/🔴), et le détail des applications les plus gourmandes.
- **Fil d'alertes** : l'historique des événements marquants, avec leur heure.
- **Pilotage** : boutons **Faire sonner**, **Message**, **Rafraîchir** par ordinateur.
- **Notifications** sur le téléphone (appli ntfy) pour chaque alerte (et retour à la normale).

### Quand reçois-tu une notification ?

- Processeur saturé ou mémoire pleine **durablement** (plusieurs mesures d'affilée, pour éviter
  les fausses alertes), et quand ça revient à la normale.
- Disque presque plein. Batterie faible (et pas branché).
- Une **application surveillée** s'arrête ou redémarre (`watch_processes` dans la config).
- L'ordinateur passe **hors ligne** (plus de nouvelles depuis ~2 min 30) ou **revient en ligne**.
- Tout **événement** déposé par un autre outil (voir ci-dessous).

Les seuils se règlent dans `agent/config.json` (`thresholds`).

---

## Le côté « agrégateur » : brancher tes autres outils

N'importe quel programme sur l'ordinateur peut faire remonter un événement sur ton téléphone :
il lui suffit d'**ajouter une ligne JSON** au fichier `agent/events.ndjson`. L'agent la lit au
tour suivant, l'envoie en notification, puis repart propre.

```bash
# Depuis un script shell, à la fin d'une tâche :
echo '{"level":"info","title":"Sauvegarde terminée","message":"42 Go copiés"}' >> /chemin/vers/agent/events.ndjson

# level : "info" | "warn" | "critical"
```

```python
# Depuis du Python (ex. à intégrer dans VideoIA-Mac quand une vidéo est prête) :
import json, pathlib
ev = {"level": "info", "title": "Vidéo prête 🎬", "message": "ep12.mp4 (3 min)"}
with open(pathlib.Path("agent/events.ndjson"), "a", encoding="utf-8") as f:
    f.write(json.dumps(ev, ensure_ascii=False) + "\n")
```

C'est ce qui rend Vigie PC « agrégateur » : il centralise l'état de la machine **et** les
événements de tes différents outils, et pousse le tout au même endroit, sur ton téléphone.

---

## Laisser l'agent démarrer tout seul (optionnel)

- **Mac** — place le lanceur dans *Réglages Système → Général → Ouverture* (éléments au
  démarrage), ou crée un *LaunchAgent* qui exécute `python3 .../agent/agent.py`.
- **Windows** — *Planificateur de tâches* → nouvelle tâche « Au démarrage » exécutant
  `agent/vigie-windows.bat` (coche « exécuter même si l'utilisateur n'est pas connecté » si besoin).
- **Linux** — un service *systemd* utilisateur :
  ```ini
  # ~/.config/systemd/user/vigie.service
  [Unit]
  Description=Vigie PC agent
  [Service]
  ExecStart=%h/Vigie/agent/.venv/bin/python %h/Vigie/agent/agent.py
  Restart=always
  [Install]
  WantedBy=default.target
  ```
  ```
  systemctl --user enable --now vigie.service
  ```

---

## Piloter l'ordinateur à distance (verrouiller / mettre en veille)

Par sécurité, seules les actions `ping`, `notify` et `refresh` sont autorisées par défaut.
Pour permettre le verrouillage ou la mise en veille depuis le téléphone, ajoute-les dans
`agent/config.json` :

```json
"allow_commands": ["ping", "notify", "refresh", "lock", "sleep"]
```

L'agent n'exécute **que** les actions présentes dans cette liste : c'est lui qui a le dernier mot.

---

## Sécurité, confidentialité, coût

- **Deux secrets distincts** : le *code d'accès* (`VIGIE_ACCESS_CODE`) protège la consultation
  et le pilotage depuis le téléphone ; le *secret agent* (`VIGIE_SHARED_SECRET`) protège l'envoi
  de l'état et ne quitte jamais ton ordinateur. Si tu les laisses vides, l'accès est ouvert
  (pratique pour un premier test, **déconseillé** ensuite).
- Les données (état de la machine, abonnements push) vivent dans **ta** base Upstash, et
  expirent toutes seules après quelques jours d'inactivité. Rien n'est partagé avec des tiers.
- Le **canal ntfy** est un nom aléatoire impossible à deviner, affiché seulement aux personnes
  qui ont le code d'accès. Quiconque le connaît peut lire les notifications : s'il a fuité,
  *Réglages → « Changer de canal ntfy »* en crée un nouveau (réabonne-toi ensuite dans l'appli).
- **Coût** : nul en usage normal. Les offres gratuites de Netlify et Upstash suffisent
  largement pour quelques ordinateurs qui envoient leur état toutes les 20 s.

---

## En cas de souci

- *« secret invalide » / 401 côté agent* → `shared_secret` (config) ≠ `VIGIE_SHARED_SECRET` (Netlify).
- *« code d'accès requis » sur le téléphone* → saisis le code dans Réglages.
- *Pas de notification* → vérifie dans l'appli ntfy que tu es abonné au **même canal** que
  celui affiché sur le site, et que les notifications de l'appli ntfy sont autorisées dans les
  réglages du téléphone. Le bouton « Tester » du site doit faire arriver un message.
- *Le canal affiche une erreur* → les variables `UPSTASH_*` manquent ou sont fausses dans Netlify.
- *Mesures pauvres (CPU/applis manquants)* → `psutil` n'a pas pu s'installer ; relance le
  lanceur, ou installe-le à la main (`pip install psutil`). L'agent fonctionne quand même.
- *L'ordinateur reste « hors ligne »* → l'agent n'est pas lancé, ou `site_url` est erroné.
