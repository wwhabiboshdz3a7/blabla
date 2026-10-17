# Ocula

Site vitrine d'un moteur d'animation JavaScript **fictif**, dans l'esprit du site d'anime.js :
un télescope en 3D (anneaux et tubes en CSS 3D) qui se déploie à l'ouverture, puis se pilote au scroll
jusqu'à une transition « à travers la lentille » vers la suite de la page.

Toutes les animations utilisent [anime.js](https://animejs.com) v4.5, inclus dans `assets/vendor/`
(licence MIT, voir `assets/vendor/ANIMEJS-LICENSE.md`).

## Lancer le site

Ouvrir `index.html` directement dans le navigateur suffit. Pour un serveur local :

```sh
cd ocula
python3 -m http.server 8000
# puis http://localhost:8000
```

## Ce que contient la page

| Section | Fonctions anime.js utilisées |
| --- | --- |
| Télescope (intro + scroll épinglé en 4 phases : déployer, pointer, aligner, plonger) | `createTimeline`, `onScroll({ sync })`, `stagger`, `createAnimatable`, `splitText`, `scrambleText`, `createTimer` |
| Six démos interactives | `animate`, `stagger({ grid })`, `createTimeline`, `spring`, `svg.createDrawable`, `scrambleText` |
| Atelier : timeline avec lecture, pause, sens inverse, vitesse et curseur | `createTimeline`, `svg.createMotionPath`, `seek`, `alternate` |
| Fiche technique, défilé de noms, pied de page | compteurs sur objets JS, `animate` en boucle, ressorts au survol |

Les réglages « réduire les animations » du système sont respectés : la page devient statique et le scroll n'est plus épinglé.

## Fichiers

- `index.html` : structure et contenu
- `assets/css/style.css` : styles (palette, typographie, scène 3D)
- `assets/js/main.js` : construction du télescope et toutes les animations
- `assets/vendor/anime.umd.min.js` : anime.js v4.5.0
