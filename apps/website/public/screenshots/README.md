# Captures d'écran (optionnel)

> **Note :** le site utilise désormais des **démos interactives** (et non des
> captures statiques) dans le Hero, la section Différenciateurs et le Workflow.
> Voir `src/marketing/demos/` (`GradeEntryDemo`, `RulesEngineDemo`,
> `DeliberationDemo`) affichées via `DemoFrame`.

Ce dossier et le composant `src/marketing/Showcase.tsx` restent **disponibles**
si tu veux insérer de vraies captures ailleurs (ex. une page produit dédiée).

## Utiliser une capture avec `<Showcase>`

1. Dépose ton image ici, ex. `screenshots/ma-vue.png`.
2. Dans le composant voulu :

   ```tsx
   import { Showcase } from "@/marketing/Showcase";

   <Showcase
     src="/screenshots/ma-vue.png"
     variant="browser"
     width={1800}
     height={1080}
     alt="Description de la vue"
   />
   ```

Tant que `src` est absent, `Showcase` affiche un placeholder élégant indiquant
le chemin et les dimensions attendus.
