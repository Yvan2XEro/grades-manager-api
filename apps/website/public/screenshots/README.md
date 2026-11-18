# Screenshots (optional)

> **Note:** the site now uses **interactive demos** (not static
> screenshots) in the Hero, the Differentiators section and the Workflow.
> See `src/marketing/demos/` (`GradeEntryDemo`, `RulesEngineDemo`,
> `DeliberationDemo`), displayed via `DemoFrame`.

This folder and the `src/marketing/Showcase.tsx` component remain **available**
if you want to insert real screenshots elsewhere (e.g. a dedicated product page).

## Using a screenshot with `<Showcase>`

1. Drop your image here, e.g. `screenshots/ma-vue.png`.
2. In the target component:

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

As long as `src` is missing, `Showcase` displays a clean placeholder showing
the expected path and dimensions.
