# TKAMS — Phase 0 Audit

> Deliverable required by the redesign brief, §1.3. **No code has been modified.**
> Written on 11 September 2026, on the `feat/accueil-la-regle` branch.
>
> **This document does not only ask for the audit to be approved. It asks for
> a prior decision: the redesign brief is in direct conflict with an art
> direction that is already written, already approved and already being executed
> in this repository.** See §0.

---

## 0. Blocking alert — two contradictory directions coexist

The brief asks to wait for this audit to be approved before PR 1. This audit
recommends not opening PR 1 at all until the following point is settled.

### 0.1 What already exists

The repository contains `docs/refonte-accueil/`, untracked by git, made up of:

| File | Size | Nature |
|---|---|---|
| `DIRECTION-ACCUEIL-TKAMS.md` | 325,000 characters | Complete art direction, called **"LA RÈGLE"** |
| `CONTENU-ACCUEIL.md` | 74,000 characters | Extracted FR/EN content, figures re-checked against the server repository |

The current branch is named **`feat/accueil-la-regle`**. The branch name is
the name of this direction. The work is under way.

`DIRECTION-ACCUEIL-TKAMS.md` presents itself as the product of "4 auditors,
3 art directors, 9 adversarial critics and 7 writers", with a comparative
scoring of three competing axes (REGISTRE 6.4 / PLENUM 6.5 /
Contre-jour 6.4) and a direction chosen by hybridization. It contains a complete
two-theme design system with measured contrast ratios, a motion
doctrine, a section-by-section specification (14 sections), a performance
budget, and an implementation plan in batches with exit gates.

### 0.2 The contradictions, point by point

| Topic | Redesign brief (§3) | LA RÈGLE (§4) | Compatible? |
|---|---|---|---|
| **Primary color** | `#1F4E8C` institutional blue — `oklch(0.426 0.115 257)` | `--color-accent` `oklch(0.470 0.105 55)` `#874814`, a seal brown | **No** — 200° hue gap |
| **Heading typeface** | Source Serif 4 (serif) | Archivo Variable (sans, `wght` axis only) | **No** |
| **Body typeface** | IBM Plex Sans | Archivo Variable | **No** |
| **Mono** | not planned | IBM Plex Mono 400, 110 KB cap | **No** |
| **Number of sections** | 10 chapters, content unchanged | 14 sections, **content reworked** | **No** |
| **Editorial content** | "does not change", §0.2 | Explicit rework: "`Modules.tsx`… it disappears" | **No** |
| **Displayed figures** | keep `45+ / 30+ / 7 / 5` | "**no catalog counts in heading typography**"; figures deemed wrong | **No** |
| **Demos** | freeze the 6 existing ones | adds 3 new ones: `BatchRollbackDemo`, `FeeReconciliationDemo`, `GateDemo` | **No** |
| **Dark theme** | not mentioned | complete, art-directed dark palette | Extension |

The two documents do not diverge on matters of taste: they diverge on the
palette, both typeface families, the number of sections, the fate of the editorial
content and the list of demos. **They cannot both be executed.**

### 0.3 Measured fact — the primary color

The brief (§3.1) requires the primary to be **sampled from `public/logo-tkams.png`**,
and gives `#1F4E8C` as a mere "working value" to replace if the logo differs.
I sampled the file (775 × 200, RGBA), ignoring white, black and grays:

| Dominant chromatic color | Occurrences | OKLCH |
|---|---|---|
| **`#6060FF`** | 43,383 px | `oklch(0.584 0.230 276.6)` |
| `#000018` (near-black) | 30,915 px | — |
| `#C0C0FF` (light gradient) | 448 px | — |

The logo is **violet-blue, hue 276.6°**. And the site already defines
`--tk-primary: oklch(0.48 0.2 277)` (`globals.css:129`) — **hue 277°**.

**The site's current primary is therefore already sampled from the logo, exactly
as the brief requires.** The `#1F4E8C` value proposed by the brief is at 257°: it
deviates from the logo by 20° and misaligns the brand. Applying the brief to the letter on this
point would mean violating its own rule §3.1.

*(Note: LA RÈGLE picks `#874814`, a brown, even further from the logo — but it
owns this as a motivated chromatic decision, documented in §4.3 "negative chromatic
decisions, owned". It is a choice, not an oversight.)*

### 0.4 What I recommend

**Do not start implementation.** First decide:

- **(A) LA RÈGLE is authoritative** — the brief is archived. It is the most complete,
  best-argued and most product-grounded document; the branch bears its name.
  The audit below remains useful: it documents the starting point.
- **(B) The brief is authoritative** — LA RÈGLE is archived, and we must accept abandoning
  325,000 characters of approved direction for a direction that, on color, contradicts
  its own sampling rule.
- **(C) Arbitrated merge** — we keep LA RÈGLE's diagnosis and batch plan, and
  retain from the brief only what does not contradict it (§0.5).

My recommendation: **(A) or (C)**.

### 0.5 What both have in common, and can therefore be executed without a decision

Four work items are requested by the brief **and** by LA RÈGLE, and do not depend
on any palette or typography choice:

1. **Residual Payload metadata** (brief PR 1; §4 below) — 7 lines in 2 files.
2. **Removal of the deployment emojis** `☁ ⚡ ⚙ 🏛` in favor of Lucide icons.
3. **Demo non-regression tests** (brief PR 0; §5 below) — none exist.
4. **Finishing fixes**: duplicate chapter `05` on `/solutions`, `AttendanceDemo`
   displayed twice, dead `★` in the hero, hard-coded FR strings served in EN.

These four batches are no-regret whatever the decision. They can start
immediately after this audit is approved.

---

## 1. Repository map

### 1.1 Location

The tkams.com site **is not** in a separate repository: it lives in the
`grades-manager-api` monorepo, under **`apps/website/`**. The neighboring directory
`Desktop/OverBrand/overbrand-website` is another project (Supabase, `next-intl`) —
it is not tkams.com.

### 1.2 Actual stack

| Item | Value |
|---|---|
| Framework | Next.js **16.2.6**, App Router, React **19.2.6** |
| CMS | Payload **3.85.0**, `@payloadcms/db-mongodb` adapter (MongoDB retained during integration) |
| CSS | Tailwind **v4**, *CSS-first* configuration via `@theme` in `globals.css` |
| Icons | `lucide-react` **0.563.0** — **already installed**, no dependency to add |
| Fonts | `next/font/google`: Sora, Inter, JetBrains Mono (+ Geist inherited from the template) |
| i18n | **home-made** — two TS objects + cookie. Neither next-intl nor Payload localization |
| Tests | Playwright 1.58.2 + Vitest 4.0.18 |

`tailwind.config.mjs` only contains a `typography` (prose) extension: **it
defines neither colors nor fonts**. The whole theme is in the `@theme` of
`src/app/(frontend)/globals.css`. Brief §3 asks to "map the tokens in
`theme.extend`": in CSS-first Tailwind v4, this is useless and counter-idiomatic —
the `@theme` tokens already generate the utilities.

### 1.3 Composition of the home page

**The home page is not made of Payload blocks.** It is a hard-coded server
component: `src/app/(frontend)/page.tsx:19-33` imports and stacks eleven sections
from `src/marketing/sections/`. `RenderBlocks` exists but only serves CMS pages
(`[slug]`). Brief §1.1 considers both cases; it is the second one.

### 1.4 The existing design system

Contrary to what the brief assumes ("the template's default Inter font",
"hard-coded values"), **a token system already exists and is massively adopted**:

| Token | Occurrences in `src/**/*.tsx` |
|---|---|
| `tk-primary` | 254 |
| `tk-ink` | 229 |
| `tk-muted` | 176 |
| `tk-surface` | 59 |
| `tk-accent-emerald` | 36 |
| `tk-dark` | 6 |
| `tk-accent-gold` | **1** |

Measured real debt: **147 hard-coded `oklch(...)` literals** in the `.tsx` files,
concentrated in the dashboard (`InstanceDetailClient` 20, `billing/page` 14) and, more
awkward for us, **in the demos themselves** (GradeEntry 5, Approvals 5, Rules 4).

`src/marketing/AnimateIn.tsx` already implements exactly what brief §3.5 asks for:
`IntersectionObserver`, one-time reveal, respect for `prefers-reduced-motion`, and even
a safety net for bfcache scroll restoration. **There is nothing to
rebuild here.**

---

## 2. Home page sections

Actual order: Hero → Stats → Pain → Features → Modules → Workflow → Pricing →
Deployment → Trust → Faq → Cta.

| Section | File | Lines | Chapter | Number source | Demo | `DemoFrame` |
|---|---|---|---|---|---|---|
| Hero | `sections/Hero.tsx` | 81 | `01` | literal L17 | `GradeEntryDemo` | yes, L54 |
| Stats | `sections/Stats.tsx` | 47 | **none** | — | — | — |
| Pain | `sections/Pain.tsx` | 185 | `02` | literal L131 | — | — |
| Features | `sections/Features.tsx` | 146 | `03` | default prop L82 | `RulesEngineDemo` | yes, L133 |
| Modules | `sections/Modules.tsx` | 53 | `04` | default prop L11 | — | — |
| Workflow | `sections/Workflow.tsx` | 70 | `05` | default prop L13 | `DeliberationDemo` | yes, L57 |
| Pricing | `sections/Pricing.tsx` | 156 | `06` | default prop L12 | — | — |
| Deployment | `sections/Deployment.tsx` | 53 | `07` | default prop L11 | — | — |
| Trust | `sections/Trust.tsx` | 48 | `08` | literal L16 | — | — |
| Faq | `sections/Faq.tsx` | 77 | `09` | default prop L13 | — | — |
| Cta | `sections/Cta.tsx` | 70 | `10` | default prop L11 | — | — |

### 2.1 Numbering defects

- **`Stats` renders no chapter label.** The visible sequence is therefore 01, *(gap)*,
  02, 03… A section exists without a number. Brief §4.3 wants `SectionHeader` to be
  "the only component allowed to render the numbers" — we will need to decide whether Stats gets one.
- **Two mechanisms coexist**: Hero/Pain/Trust hard-code the string, the eight
  others accept a `number` prop. Any renumbering touches both.
- `SectionLabel` is in `Editorial.tsx:36-62`; `EditorialSection` (L115-160) is only
  used by 4 sections out of 11 — the other 6 reimplement the same grid inline.

### 2.2 Emojis — confirmed, but not where the brief thinks

The four pictograms **are not in the component**: they are **in the i18n dictionary**.

- `src/i18n/fr.ts:261` `icon: "☁"` · `:267` `"⚡"` · `:273` `"⚙"` · `:279` `"🏛"`
- `src/i18n/en.ts:261 / 267 / 273 / 279` — same glyphs.
- Rendered raw by `Deployment.tsx:33`.

Mixed register worth noting: ☁ ⚡ ⚙ are monochrome dingbats (U+2601/26A1/2699),
**🏛 is a true color emoji** (U+1F3DB) — hence the visual inconsistency.

Other glyphs:
- `Hero.tsx:18`: `{d.hero.kicker.replace(/^★\s*/, "")}` — the ★ is stored in the dict
  then **stripped at render time**. Dead decoration, to be removed from the dict.
- `ContactPage.tsx:18`: `<SectionLabel number="✶">` — a star where every other
  page has a two-digit number.
- **`→` `←` arrows embedded in translated strings** (`fr.ts:22, 471, 788, 789, 1011,
  1014, 1024, 1063` and EN equivalents). ⚠️ **Tension with the brief**: §0.6 forbids
  pictograms, but §12 forbids modifying editorial content. These arrows are
  both at once. Recommendation: take them out of the strings and render them as
  Lucide `ArrowRight` icons — this is a presentation change, not a content change.

---

## 3. i18n and FR/EN parity

**Home-made** system, 4 files: `index.ts` (36 lines), `fr.ts` (1207 lines),
`en.ts` (1209 lines), `actions.ts` (13 lines).

```ts
// src/i18n/index.ts:4-11
export type Dict = typeof fr;           // FR est la source du type
export function getDict(locale: Locale): Dict {
    return locale === "en" ? (en as unknown as Dict) : fr;   // ⚠️ cast
}
```

### 3.1 Major risk — the cast disables all type checking on English

`en as unknown as Dict` (`index.ts:10`) means that **a missing or malformed EN key
does not fail the build: it renders `undefined` in production.** The two files
are already drifting (`legal` at `fr.ts:891` vs `en.ts:893`). This is the biggest i18n risk in the
repository, and it mechanically worsens any redesign that adds strings.

To be fixed with `export const en: Dict = { … }`, which will surface the gaps at build time.

### 3.2 No locale in the URL

Resolution via the `tkams_locale` cookie, otherwise `accept-language`, otherwise `fr`. **No
`[locale]` segment, no middleware.** FR and EN therefore share the same URL: no
`hreflang`, no per-language canonical. Direct SEO consequence, and this is
precisely point 4 of LA RÈGLE's LOT 0.

### 3.3 Hard-coded FR strings, also served to English speakers

Actual parity break, outside the dictionary:

| File | Line | String |
|---|---|---|
| `Hero.tsx` | 21 | `Douala · Yaoundé` |
| `Hero.tsx` | 56 | caption `Démo en direct · modifie une note…` |
| `Features.tsx` | 90 / 135 | `Différenciateurs` / demo caption |
| `Modules.tsx` | 16, 40, 43, 47 | `Couverture fonctionnelle`, `Un module manque ?`, … |
| `Workflow.tsx` | 21 / 59 | `Le flux` / demo caption |
| `Pricing.tsx` | 19 | `Tarification` |
| `Deployment.tsx` | 16 | `Déploiement` |
| `Cta.tsx` | 19, 61-63 | `Démarrer`, `OverBrand · Douala · Yaoundé · contact@tkams.com` |
| `Stats.tsx` | 10-13 | the values `45+`, `30+`, `7`, `5` |

⚠️ **The three `DemoFrame` captions that brief §6.1 orders to keep
"identical to the current text" are in this list**: they only exist in
French. Keeping them identical means freezing a parity break that the
brief §0.4 forbids elsewhere. To be decided (§7, point 6).

---

## 4. Metadata — leftovers from the Payload template

### 4.1 Origin — 2 files, 7 lines

**`src/utilities/mergeOpenGraph.ts`**
- L6 `description: "An open-source website built with Payload and Next.js."`
- L9 `url: ${getServerSideURL()}/website-template-OG.webp`
- L12 `siteName: "Payload Website Template"`
- L13 `title: "Payload Website Template"`

**`src/utilities/generateMeta.ts`**
- L10 fallback OG image `website-template-OG.webp`
- L29 `| Payload Website Template` suffix on **every** CMS document
- L30 bare title `"Payload Website Template"` if the doc has no meta

*(`src/plugins/index.ts:21-22` repeats the suffix on the SEO plugin side;
`src/endpoints/seed/*` contains the same strings but they are seed data,
with no impact on the `<head>`.)*

### 4.2 Affected pages

| Page | File:line | Leak |
|---|---|---|
| **Root layout** (reference for the whole site) | `layout.tsx:89` — `mergeOpenGraph()` **with no argument** | the 4 defaults, inherited by every page without its own `openGraph` |
| Blog post | `posts/[slug]/page.tsx:91` | suffixed title + fallback image |
| CMS pages `[slug]` | `[slug]/page.tsx:91` | same, plus bare title if no meta |

**Partially clean** — `title`/`description` overridden, but `og:siteName` and
`og:image` still inherit from the template: `/solutions` (L114), `/produit` (L91),
`/tarifs` (L77), `/contact` (L47), `/about` (L87), `/posts` (L75),
`/posts/page/[n]` (L76, no description), `/search` (L86, no description or OG),
`/legal/privacy` (L358), `/legal/terms` (L312).

**Only fully clean page**: the home page, `page.tsx:36-48`, which defines
its own `openGraph` with `siteName: "TKAMS"`.

`layout.tsx:92` defines `twitter.creator` but neither `twitter.title` nor `twitter.images`:
**Twitter cards therefore show "Payload Website Template" on every page
except the home page.**

> Fixing the 7 lines of §4.1 cleans the entire site in one go. It is the
> least risky and most rewarding work item of the batch — and it depends on no decision.

---

## 5. Demo inventory (protected scope)

The six components are in `src/marketing/demos/`, all `"use client"`.

| Demo | File | Lines | Interaction |
|---|---|---|---|
| Entry | `GradeEntryDemo.tsx` | 267 | 2 fields/row, clamp 0–20, average `CC*0.4+EXAM*0.6`, decision ≥10 / ≥8 / fail |
| Rules | `RulesEngineDemo.tsx` | 218 | 2 `range` (threshold 8–14, elim. 0–9) + compensation toggle, cohort of 10 re-evaluated |
| Deliberation | `DeliberationDemo.tsx` | 204 | `setTimeout` 750 ms/step, then stats grid + minutes (PV) buttons |
| Attendance | `AttendanceDemo.tsx` | 115 | per-row toggle, alert button disabled if 0 selected |
| Approvals | `ApprovalsDemo.tsx` | 168 | Approve/Reject per row + approve all |
| Documents | `DocExportDemo.tsx` | 148 | 3 tabs, generation, then download + "verified" row |

### 5.1 Key finding — the demos are already immune to inheritance

**Each of the six components explicitly sets family, size, weight and
color on *every* text node.** No text depends on inherited typography:
always a `font-code` / `font-body` / `font-display` class, always a size as an
arbitrary value (`text-[0.8125rem]`, `text-[0.7rem]`…), never a named Tailwind
size, always an explicit color token.

**Direct consequence: the `--demo-font-*` neutralization work required by brief
§6.2 is largely moot.** The total risk surface comes down to
**six CSS variables**:

1. `--font-display` / `--font-body` / `--font-code` (`globals.css:50-52`) — repointing them
   changes all six demos.
2. `--color-tk-*` (`globals.css:129-140`).
3. **`line-height` — the only real weak spot.** Only 3 nodes out of ~150 set it
   (`DeliberationDemo:129,142`, `RulesEngineDemo:183`). A global line-height change
   would shift the vertical rhythm in every table.

### 5.2 Hard-coded colors in the demos

There is **no red/destructive token**. Red is written as the literal
`oklch(0.65 0.2 25)` / `oklch(0.55 0.2 25)` in 4 files, and gold is written
`oklch(0.72 0.16 86)` **even though `--tk-accent-gold` contains exactly this value**.
If the redesign re-tokenizes colors, these literals **will silently drift**.

⚠️ **Contradiction with brief §3.1 / §12**: the brief requires `--c-success` and
`--c-danger` to "exist only inside the demos". Yet `tk-accent-emerald` is
used **36 times**, largely outside the demos (`DemoFrame` itself L60, `TrustBadges`…).
Satisfying this rule requires touching out-of-scope components.

### 5.3 `ghost.tsx` — the critical point for tests

150 lines, imported by **all six demos**. A ghost cursor which, via an
`IntersectionObserver` with `threshold: 0.55`, **automatically triggers a scripted
scenario 500 ms after coming into view**: the demos **mutate their own state without
any user action**.

It stops under `prefers-reduced-motion: reduce` (L36) and on the first real `pointerdown`
or `keydown` (L46-47).

> **Without `reducedMotion: 'reduce'`, every Playwright capture will be non-deterministic.**

Good news: every target carries a stable `data-cursor` attribute
(`cc-4`, `exam-5`, `gen`, `comp`, `run`, `flag-3`, `alert`, `ap-1`, `rej-3`, `all`,
`tab-attestation`) — these are ideal test selectors.

### 5.4 Instantiation sites — 11, not 6

The brief assumes 6 locations. There are **11**, 5 of which are outside its scope:

| Page | Demos |
|---|---|
| Home | Hero → GradeEntry · Features → RulesEngine · Workflow → Deliberation (only ones passed captions) |
| `/produit` | GradeEntry, RulesEngine, Deliberation — **and RulesEngine a 2nd time** via `Features` (L84) |
| `/solutions` | Attendance, Approvals, DocExport |
| **Auth** (`AuthShell.tsx:61`) | Signup → GradeEntry · Login, ForgotPassword, ResetPassword → Deliberation |

**The authentication pages embed demos and are mentioned nowhere
in the brief.** Any change to `DemoFrame` affects them.

### 5.5 `presences` duplicate — confirmed, and it is an indexing bug

`solutions/page.tsx:60`: `const demo = demos[i % demos.length]` with **3** demos for
**4** roles (`fr.ts:520-582`). So: Teachers → Attendance, Deans → Approvals,
Administration → DocExport, **IT department (DSI) → Attendance again**.

The mismatch is also semantic: the DSI text talks about RBAC and access management
(`fr.ts:569`), the demo shows an attendance roll call; the Teachers text talks about
grade entry (`fr.ts:524`) but is paired with attendance, **not** with `GradeEntryDemo`.
**The demo/role pairing is positional and accidental, not intentional.**

In line with brief §6.2, I am not fixing it: I am flagging it. → §7, point 2.

### 5.6 Second duplicate, not spotted by the brief

`/solutions` shows **two consecutive `05` chapters**: the 4th role renders
`String(3+2).padStart(2,"0")` = `05` (L60) and `Testimonials` is hard-coded `number="05"`
(L106). Visible sequence: ✶, 01, 02, 03, 04, **05, 05**, 06.

---

## 6. Tests — current state

| Topic | State |
|---|---|
| Playwright | 1.58.2 installed, `testDir: ./tests/e2e`, single `chromium` project |
| `baseURL` | **commented out** (`playwright.config.ts:25`) — tests hard-code the URL |
| `webServer` | `pnpm dev`, `reuseExistingServer: true` **not conditioned on CI** |
| `reducedMotion` | **absent** — see §5.3 |
| Visual regression | **none.** Zero `toHaveScreenshot` / `toMatchSnapshot` in the whole repository |
| `@axe-core/playwright` | **absent** — to be added (allowed by brief §9) |
| Vitest | `include: tests/int/**/*.int.spec.ts` — **`.ts` only**, to be widened to test components |
| `@testing-library/react` | installed (16.3.0) but **imported by no test** |

⚠️ **`tests/e2e/frontend.e2e.spec.ts` is broken/obsolete**: it expects
`toHaveTitle(/Payload Website Template/)` and an `h1` "Payload Website Template".
It tests the template, not TKAMS — **and it will turn red as soon as the
metadata is fixed (§4)**. To be fixed in the same PR.

---

## 7. Points to be decided (extension of brief §13)

| # | Point | Recommendation |
|---|---|---|
| **1** | **🔴 Brief vs LA RÈGLE** (§0) — two incompatible directions | **Blocking. Decide before any PR.** |
| **2** | Primary color: the logo measures `oklch(0.584 0.230 276.6)`, `--tk-primary` is already at 277°. `#1F4E8C` is at 257° | **Keep the current primary** — it already satisfies §3.1 |
| **3** | `presences` duplicate on `/solutions` (§5.5) | Pair role → demo explicitly; Teachers deserves `GradeEntryDemo` |
| **4** | Double chapter `05` on `/solutions` (§5.6) — not seen by the brief | Fix: visible finishing bug |
| **5** | `→` arrows in i18n strings: §0.6 forbids them, §12 forbids touching them | Take them out of the strings, render them as Lucide icons |
| **6** | The 3 `DemoFrame` captions to "keep identical" only exist in FR (§3.3) | Move them to the dictionary and translate them |
| **7** | `--c-success`/`--c-danger` "only in the demos": `tk-accent-emerald` is used 36× outside the demos (§5.2) | Relax the rule, or accept an out-of-scope work item |
| **8** | Demos on the auth pages, outside the brief's scope (§5.4) | Explicitly extend the scope |
| **9** | `en as unknown as Dict` hides every translation error (§3.1) | Type `en: Dict` — prerequisite to adding any string |
| **10** | No locale in URL: neither `hreflang` nor per-language canonical (§3.2) | SEO work item to plan (LA RÈGLE's LOT 0) |
| **11** | Module filter mapping (brief §5.4) | To be confirmed by the product team — unchanged |
| **12** | OG image (brief §13.5) | `next/og` in brand colors |

---

## 8. Revised PR plan

The brief's §11 plan remains valid **in its structure**, subject to the §0 decision.
Recommended deviations:

| PR | Content | Deviation vs brief |
|---|---|---|
| **0** | This audit + Playwright reference captures of the 6 demos | `reducedMotion: 'reduce'` **mandatory**; uncomment `baseURL`; fix `frontend.e2e.spec.ts` |
| **1** | Metadata (7 lines, §4.1) + brand OG + `sitemap`/`robots` | No-regret — can be executed immediately |
| **2** | Tokens + fonts | **On hold pending the §0 decision.** `--demo-font-*` neutralization: nearly moot (§5.1), except `line-height` |
| **3** | Cross-cutting components | `AnimateIn` already exists — do not rewrite |
| **4** | `DemoFrame` | **Already exists** (`demos/DemoFrame.tsx`, 65 lines) — to be evolved, not created. Cover all 11 sites, auth pages included |
| **5-7** | Chapters, pages, polish | On hold pending the §0 decision |

Two additions to the scope, not planned by the brief but no-regret:
- **PR 1 bis** — finishing fixes: double `05`, dead ★, Contact's `✶`.
- **PR 2 bis** — `en: Dict` typing, prerequisite to any new bilingual string.

---

## 9. Repository state at the time of the audit

Branch `feat/accueil-la-regle`. `git status` reports 260 modified files under
`apps/website`, but **this is almost entirely line-ending noise (LF → CRLF)**.
With `--ignore-all-space`, only **16 files** carry a real change, and none
concerns the redesign: `billing.ts`, `provision.ts`, payment routes, `payload-types.ts`,
`payload.config.ts`, `importMap.js`.

Untracked: `src/lib/relation.ts`, `src/migrations/`, `docs/refonte-accueil/`.

> ⚠️ **There is uncommitted work on billing and provisioning.** It would be
> wise to commit it or stash it before opening the first redesign PR,
> so that the redesign diffs stay readable. The CRLF noise also deserves a
> `.gitattributes` (`* text=auto eol=lf`).

---

## 10. What I did not do

In accordance with brief §1.3, **no site file has been created, modified or deleted.**
Only this document has been added.

The Playwright reference captures required by PR 0 **have not been produced**: they
involve choices (viewports, `reducedMotion`, tolerance, baseline location) that
depend on the §0 decision, and above all they would set a visual reference that only makes
sense once the direction is known. I will produce them as soon as this is approved.
