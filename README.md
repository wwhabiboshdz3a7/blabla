# GrabDrop ✊ → 🖐

Envoie des photos de ton téléphone vers ton PC avec un geste de la main,
à la manière de la fonction « capture par geste » de Huawei :

1. **Ferme la main** devant la caméra du téléphone → les photos sont « attrapées ».
2. **Pointe vers le PC et ouvre la main** → les photos arrivent sur le PC.

Tout tourne dans le navigateur : pas d'appli à installer, pas de serveur à gérer.

## Déployer sur Netlify

Le site est 100 % statique (pas de build).

- **Glisser-déposer** : va sur <https://app.netlify.com/drop> et dépose le dossier du projet.
- **Depuis GitHub** : Netlify → *Add new site* → *Import an existing project* → choisis ce dépôt.
  Laisse la commande de build vide ; le dossier de publication est `.` (déjà réglé dans `netlify.toml`).

Netlify sert le site en HTTPS, ce qui est obligatoire pour accéder à la caméra.

## Utilisation

1. Sur le **PC**, ouvre le site et clique sur **Mode PC**. Un QR code et un code à 6 caractères s'affichent.
2. Sur le **téléphone**, scanne le QR code (ou ouvre le site → **Mode téléphone** → tape le code).
3. Sur le téléphone : **Choisir des photos**, puis **Activer la caméra** (caméra avant par défaut, bouton ↺ pour changer).
4. ✊ Ferme la main devant le téléphone : les miniatures se « serrent » et le PC affiche les photos tenues.
5. 🖐 Ouvre la main : les photos sont envoyées et apparaissent sur le PC (bouton ⬇ ou **Tout télécharger**).

**Option webcam PC** : sur le PC, clique sur **Activer la webcam**. Le lâcher se fait alors en ouvrant
la main *devant la webcam du PC* (comme si tu jetais les photos sur l'écran) au lieu de devant le téléphone.

Le bouton **Envoyer sans geste** sur le téléphone sert de secours si la détection ne marche pas.

## Comment ça marche

| Partie | Technologie |
| --- | --- |
| Détection des gestes (poing fermé / main ouverte) | [MediaPipe Gesture Recognizer](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer), exécuté localement dans le navigateur |
| Connexion téléphone ↔ PC | WebRTC en pair-à-pair via [PeerJS](https://peerjs.com) (le serveur public PeerJS ne sert qu'à mettre les deux appareils en relation) |
| Transfert | Les photos passent directement d'un appareil à l'autre, découpées en morceaux de 64 Ko — elles ne transitent par aucun serveur |
| QR code | [qrcodejs](https://github.com/davidshimjs/qrcodejs) |

Fichiers :

- `index.html` — les trois écrans (accueil, PC, téléphone)
- `js/app.js` — appairage, états du geste, envoi/réception des fichiers
- `js/gesture.js` — caméra + reconnaissance des gestes
- `style.css` — interface
- `netlify.toml` — configuration Netlify

## Limites

- Les deux appareils doivent avoir Internet (pour charger la page et se trouver via PeerJS). Sur certains
  réseaux très fermés (réseau d'entreprise, 4G avec NAT strict), WebRTC peut ne pas réussir à se connecter
  sans serveur TURN. Dans ce cas, mets le téléphone et le PC sur le même Wi-Fi.
- Pour utiliser ton propre serveur PeerJS, définis `window.GRABDROP_PEER = { host, port, path, secure }`
  avant le chargement de `js/app.js`.
- Les photos HEIC (iPhone) s'affichent seulement dans les navigateurs qui savent les lire, mais restent
  téléchargeables.
