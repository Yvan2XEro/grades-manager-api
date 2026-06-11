# Captures d'écran du site marketing TKAMS

Dépose ici tes captures produit. Tant qu'un fichier est absent, le site affiche
un **placeholder éditorial** (cadre + dimensions recommandées) à l'emplacement
prévu — rien ne casse. Dès que le fichier existe et que `src` est renseigné dans
le composant correspondant, la vraie image s'affiche.

## Emplacements

| Fichier attendu                        | Dimensions (px) | Section / composant                     | Sujet recommandé |
| -------------------------------------- | --------------- | --------------------------------------- | ---------------- |
| `screenshots/hero-dashboard.png`       | **2400 × 1300** | Hero — `src/marketing/sections/Hero.tsx`       | Vue principale : tableau de bord / délibérations en cours (la plus large, plein cadre) |
| `screenshots/feature-rules.png`        | **1800 × 1080** | Features — `src/marketing/sections/Features.tsx` | Différenciateur clé : moteur de règles / délibération automatique |
| `screenshots/workflow-pv.png`          | **1800 × 1100** | Workflow — `src/marketing/sections/Workflow.tsx` | Génération du PV / relevés officiels en un clic |

> Tu peux ajouter d'autres emplacements n'importe où avec le composant
> `<Showcase>` (`src/marketing/Showcase.tsx`).

## Comment activer une capture

1. Exporte ta capture aux dimensions indiquées (ratio respecté ; PNG ou WebP).
   - Astuce : un léger arrondi/ombre est déjà appliqué par le cadre `Showcase`,
     exporte donc une capture **nette, sans ombre ni coins arrondis**.
2. Place le fichier dans `apps/website/public/screenshots/` avec le nom attendu.
3. Dans le composant de la section, ajoute la prop `src` au `<Showcase>` :

   ```tsx
   <Showcase
     src="/screenshots/hero-dashboard.png"   // ← ajoute cette ligne
     variant="browser"
     width={2400}
     height={1300}
     alt="Tableau de bord TKAMS — délibérations en cours"
     ...
   />
   ```

C'est tout — le placeholder disparaît et ta capture s'affiche dans le cadre.

## Variantes de cadre (`variant`)

- `browser` — fenêtre d'application avec barre d'URL (défaut, idéal captures app).
- `frame` — cadre simple arrondi avec ombre.
- `bare` — image sans cadre.

## Formats & qualité

- Préfère **WebP** (plus léger) ou PNG. Évite le JPEG pour les UI (texte net).
- Capture en **@2x** (densité rétina) puis exporte à la taille indiquée : netteté maximale.
- Garde un fond clair cohérent avec l'UI réelle du produit.
