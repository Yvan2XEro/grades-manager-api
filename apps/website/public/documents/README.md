# Documents téléchargeables

Dépose ici les documents proposés au téléchargement sur le site (brochure /
présentation TKAMS).

## Présentation TKAMS (brochure)

| Fichier attendu                       | Utilisé par                                              |
| ------------------------------------- | ------------------------------------------------------- |
| `documents/tkams-presentation.pdf`    | Section « Ressources » (`src/marketing/sections/Trust.tsx`) — composant `BrochureDownload` |

Tant que le fichier est absent, le bouton affiche **« Bientôt disponible »** et
une note indiquant le chemin attendu. Rien ne casse.

### Pour activer le téléchargement

1. Place ton document ici sous le nom **`tkams-presentation.pdf`**
   (ou un autre nom — adapte alors la prop `href`).
2. Dans `src/marketing/sections/Trust.tsx`, passe `available` au composant :

   ```tsx
   <BrochureDownload brochure={d.brochure} available />
   ```

   (et, si tu as changé le nom du fichier :
   `<BrochureDownload brochure={d.brochure} href="/documents/mon-fichier.pdf" available />`)

Le bouton « Télécharger la présentation » devient alors actif, et le bouton
**« Voir la brochure »** du hero pointe déjà vers cette section (ancre
`#ressources`).

> Astuce : un PDF léger (< 5–8 Mo) se télécharge mieux. Exporte en qualité écran
> si le document contient beaucoup d'images.
