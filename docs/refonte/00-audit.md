# TKAMS — Audit de phase 0

> Livrable exigé par le brief de refonte, §1.3. **Aucun code n'a été modifié.**
> Rédigé le 11 septembre 2026, sur la branche `feat/accueil-la-regle`.
>
> **Ce document ne demande pas seulement la validation de l'audit. Il demande
> un arbitrage préalable : le brief de refonte entre en conflit frontal avec une
> direction artistique déjà écrite, déjà validée et déjà en cours d'exécution
> dans ce dépôt.** Voir §0.

---

## 0. Alerte bloquante — deux directions contradictoires coexistent

Le brief demande d'attendre la validation de cet audit avant la PR 1. Cet audit
recommande de ne pas ouvrir la PR 1 du tout tant que le point suivant n'est pas tranché.

### 0.1 Ce qui existe déjà

Le dépôt contient `docs/refonte-accueil/`, non suivi par git, composé de :

| Fichier | Taille | Nature |
|---|---|---|
| `DIRECTION-ACCUEIL-TKAMS.md` | 325 000 signes | Direction artistique complète, dite **« LA RÈGLE »** |
| `CONTENU-ACCUEIL.md` | 74 000 signes | Contenu FR/EN extrait, chiffres revérifiés dans le dépôt serveur |

La branche courante s'appelle **`feat/accueil-la-regle`**. Le nom de la branche est
le nom de cette direction. Le travail est engagé.

`DIRECTION-ACCUEIL-TKAMS.md` se présente comme le produit de « 4 auditeurs,
3 directeurs artistiques, 9 critiques adversariaux et 7 rédacteurs », avec une
notation comparative de trois axes concurrents (REGISTRE 6,4 / PLENUM 6,5 /
Contre-jour 6,4) et une direction retenue par hybridation. Il contient un système
de design complet à deux thèmes avec ratios de contraste mesurés, une doctrine de
motion, une spécification section par section (14 sections), un budget de
performance, et un plan d'implémentation en lots avec portes de sortie.

### 0.2 Les contradictions, point par point

| Sujet | Brief de refonte (§3) | LA RÈGLE (§4) | Compatible ? |
|---|---|---|---|
| **Couleur primaire** | `#1F4E8C` bleu institutionnel — `oklch(0.426 0.115 257)` | `--color-accent` `oklch(0.470 0.105 55)` `#874814`, un brun-sceau | **Non** — 200° d'écart de teinte |
| **Typographie titres** | Source Serif 4 (serif) | Archivo Variable (sans, axe `wght` seul) | **Non** |
| **Typographie texte** | IBM Plex Sans | Archivo Variable | **Non** |
| **Mono** | non prévue | IBM Plex Mono 400, plafond 110 Ko | **Non** |
| **Nombre de sections** | 10 chapitres, contenu inchangé | 14 sections, **contenu refondu** | **Non** |
| **Contenu éditorial** | « ne change pas », §0.2 | Refonte explicite : « `Modules.tsx`… il disparaît » | **Non** |
| **Chiffres affichés** | conserver `45+ / 30+ / 7 / 5` | « **aucun comptage de catalogue en typographie de titre** » ; chiffres jugés faux | **Non** |
| **Démos** | figer les 6 existantes | en ajoute 3 inédites : `BatchRollbackDemo`, `FeeReconciliationDemo`, `GateDemo` | **Non** |
| **Thème sombre** | non mentionné | palette sombre complète, art-dirigée | Extension |

Les deux documents ne divergent pas sur des détails de goût : ils divergent sur la
palette, les deux familles de caractères, le nombre de sections, le sort du contenu
éditorial et la liste des démos. **Ils ne peuvent pas être exécutés tous les deux.**

### 0.3 Point de fait mesuré — la couleur primaire

Le brief (§3.1) impose que la primaire soit **échantillonnée sur `public/logo-tkams.png`**,
et donne `#1F4E8C` comme simple « valeur de travail » à remplacer si le logo diffère.
J'ai échantillonné le fichier (775 × 200, RGBA) en ignorant le blanc, le noir et les gris :

| Couleur dominante chromatique | Occurrences | OKLCH |
|---|---|---|
| **`#6060FF`** | 43 383 px | `oklch(0.584 0.230 276.6)` |
| `#000018` (quasi-noir) | 30 915 px | — |
| `#C0C0FF` (dégradé clair) | 448 px | — |

Le logo est **violet-bleu, teinte 276,6°**. Or le site définit déjà
`--tk-primary: oklch(0.48 0.2 277)` (`globals.css:129`) — **teinte 277°**.

**La primaire actuelle du site est donc déjà échantillonnée sur le logo, exactement
comme le brief l'exige.** La valeur `#1F4E8C` proposée par le brief est à 257° : elle
s'écarte du logo de 20° et désaligne la marque. Appliquer le brief à la lettre sur ce
point reviendrait à violer sa propre règle §3.1.

*(Note : LA RÈGLE choisit `#874814`, un brun, encore plus éloigné du logo — mais elle
l'assume comme une décision chromatique motivée, documentée en §4.3 « décisions
chromatiques négatives, assumées ». C'est un choix, pas un oubli.)*

### 0.4 Ce que je recommande

**Ne pas commencer l'implémentation.** Trancher d'abord :

- **(A) LA RÈGLE fait foi** — le brief est archivé. C'est le document le plus abouti,
  le plus argumenté et le plus ancré dans le produit ; la branche porte son nom.
  L'audit ci-dessous reste utile : il documente le point de départ.
- **(B) Le brief fait foi** — LA RÈGLE est archivée, et il faut assumer d'abandonner
  325 000 signes de direction validée pour une direction qui, sur la couleur, contredit
  sa propre règle d'échantillonnage.
- **(C) Fusion arbitrée** — on garde le diagnostic et le plan de lots de LA RÈGLE, et
  on ne retient du brief que ce qui ne la contredit pas (§0.5).

Ma recommandation : **(A) ou (C)**.

### 0.5 Ce qui est commun aux deux, donc exécutable sans arbitrage

Quatre chantiers sont demandés par le brief **et** par LA RÈGLE, et ne dépendent
d'aucun choix de palette ou de typographie :

1. **Metadata Payload résiduelles** (brief PR 1 ; §4 ci-dessous) — 7 lignes dans 2 fichiers.
2. **Suppression des emojis de déploiement** `☁ ⚡ ⚙ 🏛` au profit d'icônes Lucide.
3. **Tests de non-régression des démos** (brief PR 0 ; §5 ci-dessous) — aucun n'existe.
4. **Corrections de finition** : doublon de chapitre `05` sur `/solutions`, `AttendanceDemo`
   affichée deux fois, `★` mort dans le hero, chaînes FR codées en dur servies en EN.

Ces quatre lots sont sans regret quel que soit l'arbitrage. Ils peuvent démarrer
immédiatement après validation de cet audit.

---

## 1. Cartographie du dépôt

### 1.1 Localisation

Le site tkams.com **n'est pas** dans un dépôt séparé : il vit dans le monorepo
`grades-manager-api`, sous **`apps/website/`**. Le répertoire voisin
`Desktop/OverBrand/overbrand-website` est un autre projet (Supabase, `next-intl`) —
ce n'est pas tkams.com.

### 1.2 Stack réelle

| Élément | Valeur |
|---|---|
| Framework | Next.js **16.2.6**, App Router, React **19.2.6** |
| CMS | Payload **3.85.0**, adaptateur `@payloadcms/db-postgres` |
| CSS | Tailwind **v4**, configuration *CSS-first* via `@theme` dans `globals.css` |
| Icônes | `lucide-react` **0.563.0** — **déjà installé**, aucune dépendance à ajouter |
| Polices | `next/font/google` : Sora, Inter, JetBrains Mono (+ Geist hérité du template) |
| i18n | **fait maison** — deux objets TS + cookie. Ni next-intl, ni localisation Payload |
| Tests | Playwright 1.58.2 + Vitest 4.0.18 |

`tailwind.config.mjs` ne contient qu'une extension `typography` (prose) : **il ne
définit ni couleur ni police**. Tout le thème est dans `@theme` de
`src/app/(frontend)/globals.css`. Le brief §3 demande de « mapper les tokens dans
`theme.extend` » : en Tailwind v4 CSS-first, c'est inutile et contre-idiomatique —
les tokens `@theme` génèrent déjà les utilitaires.

### 1.3 Composition de la page d'accueil

**La page d'accueil n'est pas composée de blocs Payload.** C'est un composant serveur
codé en dur : `src/app/(frontend)/page.tsx:19-33` importe et empile onze sections
depuis `src/marketing/sections/`. `RenderBlocks` existe mais ne sert qu'aux pages CMS
(`[slug]`). Le brief §1.1 envisage les deux cas ; c'est le second.

### 1.4 Le système de design existant

Contrairement à ce que suppose le brief (« la police Inter par défaut du template »,
« valeurs codées en dur »), **un système de tokens existe déjà et est massivement adopté** :

| Token | Occurrences dans `src/**/*.tsx` |
|---|---|
| `tk-primary` | 254 |
| `tk-ink` | 229 |
| `tk-muted` | 176 |
| `tk-surface` | 59 |
| `tk-accent-emerald` | 36 |
| `tk-dark` | 6 |
| `tk-accent-gold` | **1** |

Dette réelle mesurée : **147 littéraux `oklch(...)` codés en dur** dans les `.tsx`,
concentrés dans le dashboard (`InstanceDetailClient` 20, `billing/page` 14) et, plus
gênant pour nous, **dans les démos elles-mêmes** (GradeEntry 5, Approvals 5, Rules 4).

`src/marketing/AnimateIn.tsx` implémente déjà exactement ce que le brief §3.5 demande :
`IntersectionObserver`, révélation unique, respect de `prefers-reduced-motion`, et même
un filet de sécurité pour la restauration de scroll bfcache. **Il n'y a rien à
reconstruire ici.**

---

## 2. Sections de la page d'accueil

Ordre réel : Hero → Stats → Pain → Features → Modules → Workflow → Pricing →
Deployment → Trust → Faq → Cta.

| Section | Fichier | L. | Chapitre | Source du n° | Démo | `DemoFrame` |
|---|---|---|---|---|---|---|
| Hero | `sections/Hero.tsx` | 81 | `01` | littéral L17 | `GradeEntryDemo` | oui, L54 |
| Stats | `sections/Stats.tsx` | 47 | **aucun** | — | — | — |
| Pain | `sections/Pain.tsx` | 185 | `02` | littéral L131 | — | — |
| Features | `sections/Features.tsx` | 146 | `03` | prop défaut L82 | `RulesEngineDemo` | oui, L133 |
| Modules | `sections/Modules.tsx` | 53 | `04` | prop défaut L11 | — | — |
| Workflow | `sections/Workflow.tsx` | 70 | `05` | prop défaut L13 | `DeliberationDemo` | oui, L57 |
| Pricing | `sections/Pricing.tsx` | 156 | `06` | prop défaut L12 | — | — |
| Deployment | `sections/Deployment.tsx` | 53 | `07` | prop défaut L11 | — | — |
| Trust | `sections/Trust.tsx` | 48 | `08` | littéral L16 | — | — |
| Faq | `sections/Faq.tsx` | 77 | `09` | prop défaut L13 | — | — |
| Cta | `sections/Cta.tsx` | 70 | `10` | prop défaut L11 | — | — |

### 2.1 Défauts de numérotation

- **`Stats` ne rend aucun label de chapitre.** La séquence visible est donc 01, *(trou)*,
  02, 03… Une section existe sans numéro. Le brief §4.3 veut que `SectionHeader` soit
  « le seul composant autorisé à rendre les numéros » — il faudra décider si Stats en reçoit un.
- **Deux mécanismes coexistent** : Hero/Pain/Trust encodent la chaîne en dur, les huit
  autres acceptent une prop `number`. Toute renumérotation touche les deux.
- `SectionLabel` est dans `Editorial.tsx:36-62`, `EditorialSection` (L115-160) n'est
  utilisé que par 4 sections sur 11 — les 6 autres réimplémentent la même grille en ligne.

### 2.2 Emojis — confirmé, mais pas là où le brief le croit

Les quatre pictogrammes **ne sont pas dans le composant** : ils sont **dans le dictionnaire i18n**.

- `src/i18n/fr.ts:261` `icon: "☁"` · `:267` `"⚡"` · `:273` `"⚙"` · `:279` `"🏛"`
- `src/i18n/en.ts:261 / 267 / 273 / 279` — mêmes glyphes.
- Rendus bruts par `Deployment.tsx:33`.

Registre mixte à noter : ☁ ⚡ ⚙ sont des dingbats monochromes (U+2601/26A1/2699),
**🏛 est un vrai emoji couleur** (U+1F3DB) — d'où l'incohérence visuelle.

Autres glyphes :
- `Hero.tsx:18` : `{d.hero.kicker.replace(/^★\s*/, "")}` — le ★ est stocké dans le dict
  puis **retiré au rendu**. Décoration morte, à supprimer du dict.
- `ContactPage.tsx:18` : `<SectionLabel number="✶">` — étoile là où toutes les autres
  pages ont un nombre à deux chiffres.
- **Flèches `→` `←` intégrées aux chaînes traduites** (`fr.ts:22, 471, 788, 789, 1011,
  1014, 1024, 1063` et équivalents EN). ⚠️ **Tension avec le brief** : §0.6 interdit les
  pictogrammes, mais §12 interdit de modifier le contenu éditorial. Ces flèches sont
  les deux à la fois. Recommandation : les sortir des chaînes et les rendre comme
  icônes `ArrowRight` Lucide — c'est un changement de présentation, pas de contenu.

---

## 3. i18n et parité FR/EN

Système **fait maison**, 4 fichiers : `index.ts` (36 l.), `fr.ts` (1207 l.),
`en.ts` (1209 l.), `actions.ts` (13 l.).

```ts
// src/i18n/index.ts:4-11
export type Dict = typeof fr;           // FR est la source du type
export function getDict(locale: Locale): Dict {
    return locale === "en" ? (en as unknown as Dict) : fr;   // ⚠️ cast
}
```

### 3.1 Risque majeur — le cast désactive tout contrôle de type sur l'anglais

`en as unknown as Dict` (`index.ts:10`) signifie qu'**une clé EN manquante ou mal formée
ne fait pas échouer le build : elle rend `undefined` en production.** Les deux fichiers
dérivent déjà (`legal` à `fr.ts:891` vs `en.ts:893`). C'est le plus gros risque i18n du
dépôt, et il aggrave mécaniquement toute refonte qui ajoute des chaînes.

À corriger par `export const en: Dict = { … }`, qui fera remonter les écarts au build.

### 3.2 Pas de locale dans l'URL

Résolution par cookie `tkams_locale`, sinon `accept-language`, sinon `fr`. **Aucun
segment `[locale]`, aucun middleware.** FR et EN partagent donc la même URL : pas de
`hreflang`, pas de canonical par langue. Conséquence SEO directe, et c'est
précisément le point 4 du LOT 0 de LA RÈGLE.

### 3.3 Chaînes FR codées en dur, servies aussi aux anglophones

Rupture de parité réelle, hors dictionnaire :

| Fichier | Ligne | Chaîne |
|---|---|---|
| `Hero.tsx` | 21 | `Douala · Yaoundé` |
| `Hero.tsx` | 56 | légende `Démo en direct · modifie une note…` |
| `Features.tsx` | 90 / 135 | `Différenciateurs` / légende de démo |
| `Modules.tsx` | 16, 40, 43, 47 | `Couverture fonctionnelle`, `Un module manque ?`, … |
| `Workflow.tsx` | 21 / 59 | `Le flux` / légende de démo |
| `Pricing.tsx` | 19 | `Tarification` |
| `Deployment.tsx` | 16 | `Déploiement` |
| `Cta.tsx` | 19, 61-63 | `Démarrer`, `OverBrand · Douala · Yaoundé · contact@tkams.com` |
| `Stats.tsx` | 10-13 | les valeurs `45+`, `30+`, `7`, `5` |

⚠️ **Les trois légendes de `DemoFrame` que le brief §6.1 ordonne de conserver
« identiques au texte actuel » sont dans cette liste** : elles n'existent qu'en
français. Les conserver à l'identique, c'est figer une rupture de parité que le
brief §0.4 interdit par ailleurs. À arbitrer (§7, point 6).

---

## 4. Metadata — résidus du template Payload

### 4.1 Origine — 2 fichiers, 7 lignes

**`src/utilities/mergeOpenGraph.ts`**
- L6 `description: "An open-source website built with Payload and Next.js."`
- L9 `url: ${getServerSideURL()}/website-template-OG.webp`
- L12 `siteName: "Payload Website Template"`
- L13 `title: "Payload Website Template"`

**`src/utilities/generateMeta.ts`**
- L10 image OG de repli `website-template-OG.webp`
- L29 suffixe `| Payload Website Template` sur **tout** document CMS
- L30 titre nu `"Payload Website Template"` si le doc n'a pas de meta

*(`src/plugins/index.ts:21-22` répète le suffixe côté plugin SEO ;
`src/endpoints/seed/*` contient les mêmes chaînes mais ce sont des données de seed,
sans impact sur le `<head>`.)*

### 4.2 Pages affectées

| Page | Fichier:ligne | Fuite |
|---|---|---|
| **Layout racine** (référence de tout le site) | `layout.tsx:89` — `mergeOpenGraph()` **sans argument** | les 4 défauts, hérités par toute page sans `openGraph` propre |
| Article de blog | `posts/[slug]/page.tsx:91` | titre suffixé + image de repli |
| Pages CMS `[slug]` | `[slug]/page.tsx:91` | idem, et titre nu si pas de meta |

**Partiellement propres** — `title`/`description` surchargés, mais `og:siteName` et
`og:image` héritent encore du template : `/solutions` (L114), `/produit` (L91),
`/tarifs` (L77), `/contact` (L47), `/about` (L87), `/posts` (L75),
`/posts/page/[n]` (L76, sans description), `/search` (L86, sans description ni OG),
`/legal/privacy` (L358), `/legal/terms` (L312).

**Seule page entièrement propre** : la page d'accueil, `page.tsx:36-48`, qui définit
son propre `openGraph` avec `siteName: "TKAMS"`.

`layout.tsx:92` définit `twitter.creator` mais ni `twitter.title` ni `twitter.images` :
**les cartes Twitter affichent donc « Payload Website Template » sur toutes les pages
sauf l'accueil.**

> Corriger les 7 lignes de §4.1 nettoie l'intégralité du site d'un coup. C'est le
> chantier le moins risqué et le plus rentable du lot — et il ne dépend d'aucun arbitrage.

---

## 5. Inventaire des démos (périmètre protégé)

Les six composants sont dans `src/marketing/demos/`, tous `"use client"`.

| Démo | Fichier | L. | Interaction |
|---|---|---|---|
| Saisie | `GradeEntryDemo.tsx` | 267 | 2 champs/ligne, clamp 0–20, moyenne `CC*0.4+EXAM*0.6`, décision ≥10 / ≥8 / échec |
| Règles | `RulesEngineDemo.tsx` | 218 | 2 `range` (seuil 8–14, élim. 0–9) + bascule compensation, cohorte de 10 réévaluée |
| Délibération | `DeliberationDemo.tsx` | 204 | `setTimeout` 750 ms/étape, puis grille de stats + boutons PV |
| Présences | `AttendanceDemo.tsx` | 115 | bascule par ligne, bouton d'alerte désactivé si 0 sélectionné |
| Validations | `ApprovalsDemo.tsx` | 168 | Approuver/Rejeter par ligne + tout approuver |
| Documents | `DocExportDemo.tsx` | 148 | 3 onglets, génération, puis téléchargement + ligne « vérifié » |

### 5.1 Résultat central — les démos sont déjà immunisées contre l'héritage

**Chacun des six composants fixe explicitement la famille, la taille, la graisse et la
couleur sur *chaque* nœud de texte.** Aucun texte ne dépend d'une typographie héritée :
toujours une classe `font-code` / `font-body` / `font-display`, toujours une taille en
valeur arbitraire (`text-[0.8125rem]`, `text-[0.7rem]`…), jamais une taille nommée
Tailwind, toujours un token de couleur explicite.

**Conséquence directe : le travail de neutralisation `--demo-font-*` exigé par le brief
§6.2 est en grande partie sans objet.** La surface de risque totale se réduit à
**six variables CSS** :

1. `--font-display` / `--font-body` / `--font-code` (`globals.css:50-52`) — les repointer
   change les six démos.
2. `--color-tk-*` (`globals.css:129-140`).
3. **`line-height` — la seule vraie faille.** Seuls 3 nœuds sur ~150 le fixent
   (`DeliberationDemo:129,142`, `RulesEngineDemo:183`). Un changement global d'interligne
   déplacerait le rythme vertical dans tous les tableaux.

### 5.2 Couleurs codées en dur dans les démos

Il n'existe **aucun token rouge/destructif**. Le rouge est écrit en littéral
`oklch(0.65 0.2 25)` / `oklch(0.55 0.2 25)` dans 4 fichiers, et l'or est écrit
`oklch(0.72 0.16 86)` **alors que `--tk-accent-gold` contient exactement cette valeur**.
Si la refonte retokenise les couleurs, ces littéraux **dériveront silencieusement**.

⚠️ **Contradiction avec le brief §3.1 / §12** : le brief exige que `--c-success` et
`--c-danger` « n'existent qu'à l'intérieur des démos ». Or `tk-accent-emerald` est
utilisé **36 fois**, largement hors démos (`DemoFrame` lui-même L60, `TrustBadges`…).
Satisfaire cette règle impose de toucher à des composants hors périmètre.

### 5.3 `ghost.tsx` — le point critique pour les tests

150 lignes, importé par **les six démos**. Un curseur fantôme qui, via un
`IntersectionObserver` à `threshold: 0.55`, **déclenche automatiquement un scénario
scripté 500 ms après l'entrée en vue** : les démos **mutent leur propre état sans
action de l'utilisateur**.

Il s'arrête sous `prefers-reduced-motion: reduce` (L36) et au premier `pointerdown`
ou `keydown` réel (L46-47).

> **Sans `reducedMotion: 'reduce'`, toute capture Playwright sera non déterministe.**

Bonne nouvelle : chaque cible porte un attribut stable `data-cursor`
(`cc-4`, `exam-5`, `gen`, `comp`, `run`, `flag-3`, `alert`, `ap-1`, `rej-3`, `all`,
`tab-attestation`) — ce sont des sélecteurs de test idéaux.

### 5.4 Sites d'instanciation — 11, et non 6

Le brief suppose 6 emplacements. Il y en a **11**, dont 5 hors de son périmètre :

| Page | Démos |
|---|---|
| Accueil | Hero → GradeEntry · Features → RulesEngine · Workflow → Deliberation (seules légendes passées) |
| `/produit` | GradeEntry, RulesEngine, Deliberation — **et RulesEngine une 2ᵉ fois** via `Features` (L84) |
| `/solutions` | Attendance, Approvals, DocExport |
| **Auth** (`AuthShell.tsx:61`) | Signup → GradeEntry · Login, ForgotPassword, ResetPassword → Deliberation |

**Les pages d'authentification embarquent des démos et ne sont mentionnées nulle part
dans le brief.** Toute modification du `DemoFrame` les affecte.

### 5.5 Doublon `presences` — confirmé, et c'est un bug d'indexation

`solutions/page.tsx:60` : `const demo = demos[i % demos.length]` avec **3** démos pour
**4** rôles (`fr.ts:520-582`). Donc : Enseignants → Attendance, Doyens → Approvals,
Administration → DocExport, **DSI → Attendance à nouveau**.

Le désaccord est aussi sémantique : le texte DSI parle de RBAC et de gestion des accès
(`fr.ts:569`), la démo montre un appel de présences ; le texte Enseignants parle de
saisie de notes (`fr.ts:524`) mais est apparié à la présence, **pas** à `GradeEntryDemo`.
**L'appariement démo/rôle est positionnel et accidentel, pas intentionnel.**

Conforme au brief §6.2, je ne corrige pas : je signale. → §7, point 2.

### 5.6 Second doublon, non repéré par le brief

`/solutions` affiche **deux chapitres `05` consécutifs** : le 4ᵉ rôle rend
`String(3+2).padStart(2,"0")` = `05` (L60) et `Testimonials` est codé en dur `number="05"`
(L106). Séquence visible : ✶, 01, 02, 03, 04, **05, 05**, 06.

---

## 6. Tests — état des lieux

| Sujet | État |
|---|---|
| Playwright | 1.58.2 installé, `testDir: ./tests/e2e`, projet `chromium` unique |
| `baseURL` | **commenté** (`playwright.config.ts:25`) — les tests codent l'URL en dur |
| `webServer` | `pnpm dev`, `reuseExistingServer: true` **non conditionné à CI** |
| `reducedMotion` | **absent** — cf. §5.3 |
| Régression visuelle | **aucune.** Zéro `toHaveScreenshot` / `toMatchSnapshot` dans tout le dépôt |
| `@axe-core/playwright` | **absent** — à ajouter (autorisé par le brief §9) |
| Vitest | `include: tests/int/**/*.int.spec.ts` — **`.ts` seulement**, à élargir pour tester des composants |
| `@testing-library/react` | installé (16.3.0) mais **importé par aucun test** |

⚠️ **`tests/e2e/frontend.e2e.spec.ts` est cassé/obsolète** : il attend
`toHaveTitle(/Payload Website Template/)` et un `h1` « Payload Website Template ».
Il teste le template, pas TKAMS — **et il passera au rouge dès la correction des
metadata (§4)**. À corriger dans la même PR.

---

## 7. Points à faire trancher (extension du §13 du brief)

| # | Point | Recommandation |
|---|---|---|
| **1** | **🔴 Brief vs LA RÈGLE** (§0) — deux directions incompatibles | **Bloquant. Trancher avant toute PR.** |
| **2** | Couleur primaire : le logo mesure `oklch(0.584 0.230 276.6)`, `--tk-primary` est déjà à 277°. `#1F4E8C` est à 257° | **Conserver la primaire actuelle** — elle satisfait déjà §3.1 |
| **3** | Doublon `presences` sur `/solutions` (§5.5) | Apparier explicitement rôle → démo ; Enseignants mérite `GradeEntryDemo` |
| **4** | Double chapitre `05` sur `/solutions` (§5.6) — non vu par le brief | Corriger : bug de finition visible |
| **5** | Flèches `→` dans les chaînes i18n : §0.6 les interdit, §12 interdit d'y toucher | Les sortir des chaînes, les rendre en icônes Lucide |
| **6** | Les 3 légendes de `DemoFrame` à « conserver identiques » n'existent qu'en FR (§3.3) | Les porter au dictionnaire et les traduire |
| **7** | `--c-success`/`--c-danger` « uniquement dans les démos » : `tk-accent-emerald` est utilisé 36× hors démos (§5.2) | Assouplir la règle, ou accepter un chantier hors périmètre |
| **8** | Démos sur les pages d'auth, hors périmètre du brief (§5.4) | Étendre explicitement le périmètre |
| **9** | `en as unknown as Dict` masque toute erreur de traduction (§3.1) | Typer `en: Dict` — prérequis à tout ajout de chaîne |
| **10** | Pas de locale en URL : ni `hreflang` ni canonical par langue (§3.2) | Chantier SEO à planifier (LOT 0 de LA RÈGLE) |
| **11** | Mapping des filtres de modules (brief §5.4) | À confirmer par l'équipe produit — inchangé |
| **12** | Image OG (brief §13.5) | `next/og` aux couleurs de la marque |

---

## 8. Plan de PR révisé

Le plan §11 du brief reste valable **dans sa structure**, sous réserve de l'arbitrage §0.
Écarts recommandés :

| PR | Contenu | Écart vs brief |
|---|---|---|
| **0** | Cet audit + captures Playwright de référence des 6 démos | `reducedMotion: 'reduce'` **obligatoire** ; `baseURL` à décommenter ; corriger `frontend.e2e.spec.ts` |
| **1** | Metadata (7 lignes, §4.1) + OG de marque + `sitemap`/`robots` | Sans regret — exécutable immédiatement |
| **2** | Tokens + polices | **Suspendu à l'arbitrage §0.** Neutralisation `--demo-font-*` : quasi sans objet (§5.1), sauf `line-height` |
| **3** | Composants transversaux | `AnimateIn` existe déjà — ne pas réécrire |
| **4** | `DemoFrame` | **Existe déjà** (`demos/DemoFrame.tsx`, 65 l.) — à faire évoluer, pas à créer. Couvrir les 11 sites, pages d'auth incluses |
| **5-7** | Chapitres, pages, polissage | Suspendus à l'arbitrage §0 |

Deux ajouts au périmètre, non prévus par le brief mais sans regret :
- **PR 1 bis** — corrections de finition : double `05`, ★ mort, `✶` de Contact.
- **PR 2 bis** — typage `en: Dict`, prérequis à toute nouvelle chaîne bilingue.

---

## 9. État du dépôt au moment de l'audit

Branche `feat/accueil-la-regle`. `git status` annonce 260 fichiers modifiés sous
`apps/website`, mais **c'est presque intégralement du bruit de fin de ligne (LF → CRLF)**.
À `--ignore-all-space`, seuls **16 fichiers** portent un vrai changement, et aucun ne
concerne la refonte : `billing.ts`, `provision.ts`, routes de paiement, `payload-types.ts`,
`payload.config.ts`, `importMap.js`.

Non suivis : `src/lib/relation.ts`, `src/migrations/`, `docs/refonte-accueil/`.

> ⚠️ **Il y a du travail non commité sur la facturation et le provisioning.** Il serait
> prudent de le commiter ou de le mettre de côté avant d'ouvrir la première PR de refonte,
> pour que les diffs de refonte restent lisibles. Le bruit CRLF mérite par ailleurs un
> `.gitattributes` (`* text=auto eol=lf`).

---

## 10. Ce que je n'ai pas fait

Conformément au brief §1.3, **aucun fichier du site n'a été créé, modifié ou supprimé.**
Seul ce document a été ajouté.

Les captures Playwright de référence exigées par la PR 0 **ne sont pas produites** : elles
engagent des choix (viewports, `reducedMotion`, tolérance, emplacement des baselines) qui
dépendent de l'arbitrage §0, et surtout elles fixeraient une référence visuelle qui n'a de
sens qu'une fois la direction connue. Je les produis dès validation.
