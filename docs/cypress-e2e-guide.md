# Cypress E2E setup

This document explains how to bootstrap Cypress in this monorepo so front-end contributors can cover end-to-end flows (e.g., enrollment windows or the teacher exam workflow).

## 1. Why Cypress?

Cypress runs the real browser against the built bundle, which is critical for workflows that span the SPA, TRPC client, and persistent stores. It complements unit/integration suites (Vitest/Bun) by validating transitions that previously regressed (grade entry, enrollment automation, etc.).

## 2. Folder layout

All UI work lives in `apps/web`. Keep Cypress artifacts inside that workspace to avoid leaking frontend-specific tooling to the server app.

```
apps/web/
├─ cypress/
│  ├─ e2e/                 # spec files
│  ├─ fixtures/            # seed payloads, mock responses
│  ├─ support/             # custom commands/utilities
│  └─ tsconfig.json        # optional, for IntelliSense
├─ cypress.config.ts       # Cypress/Vite-aware configuration
└─ package.json            # add Cypress scripts here
```

## 3. Installation

From the repo root:

```bash
# install once to keep lockfile consistent
cd apps/web
bun add -d cypress @testing-library/cypress
```

If you plan to author component tests later, add `@cypress/vite-dev-server` as well.

## 4. Configuration

Create `apps/web/cypress.config.ts`:

```ts
import { defineConfig } from "cypress";
import { execSync } from "node:child_process";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:4173",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    env: {
      API_URL: process.env.CYPRESS_API_URL ?? "http://localhost:3000",
      ADMIN_EMAIL: process.env.CYPRESS_ADMIN_EMAIL ?? "admin@example.com",
      ADMIN_PASSWORD: process.env.CYPRESS_ADMIN_PASSWORD ?? "ChangeMe123!",
      TEACHER_EMAIL: process.env.CYPRESS_TEACHER_EMAIL ?? "alice.teacher@example.com",
      TEACHER_PASSWORD: process.env.CYPRESS_TEACHER_PASSWORD ?? "Password123!"
    },
    setupNodeEvents(on) {
      on("task", {
        resetDB() {
          execSync("bun run --filter server seed", { stdio: "inherit" });
          return true;
        }
      });
    },
  },
  fixturesFolder: "cypress/fixtures",
});
```

Key points:

- Cypress needs the same alias resolution as Vite. If you reference local modules (`@/store`), extend the Vite config or use relative imports inside specs.
- `baseUrl` should target the preview server (`bun run --filter web dev` for watch mode or `bun run --filter web build && bun run --filter web preview` for CI).
- Use environment variables for API hosts and credentials so CI runs against staging backends without editing the config.

## 5. Support files

Create `cypress/support/e2e.ts` to register custom commands and global hooks:

```ts
import "@testing-library/cypress/add-commands";

Cypress.Commands.add("loginAs", (role = "teacher", route = "/") => {
  const email = Cypress.env(`${role.toUpperCase()}_EMAIL`);
  const password = Cypress.env(`${role.toUpperCase()}_PASSWORD`);
  cy.visit(`/auth/login?return=${encodeURIComponent(route)}`);
  cy.findByLabelText(/email/i).type(email);
  cy.findByLabelText(/password/i).type(password, { log: false });
  cy.findByRole("button", { name: /sign in/i }).click();
  cy.location("pathname").should("eq", route);
});
```

You can expose helpers for seeding fixtures, resetting the DB, or mocking TRPC calls. Keep them deterministic—tests should start from a known seed (`bun run --filter server seed`).

## 6. Environment variables

Set the credentials for the seeded accounts (defaults match `seed/local/20-users.yaml`):

```bash
export CYPRESS_BASE_URL="http://localhost:4173"
export CYPRESS_API_URL="http://localhost:3000"
export CYPRESS_ADMIN_EMAIL="admin@example.com"
export CYPRESS_ADMIN_PASSWORD="ChangeMe123!"
export CYPRESS_TEACHER_EMAIL="alice.teacher@example.com"
export CYPRESS_TEACHER_PASSWORD="Password123!"
```

Override them for staging/prod datasets.

## 7. Writing specs

- Place specs under `apps/web/cypress/e2e`. Example: `cypress/e2e/enrollment.cy.ts`.
- Use Testing Library commands for accessibility-friendly selectors (`cy.findByRole("button", { name: /enroll entire class/i })`).
- Clean up after each spec (reset seeds via `cy.task` hitting `bun run --filter server seed` or dedicated API endpoints).

Example skeleton:

```ts
describe("Enrollment management", () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.loginAs("administrator", { route: "/admin/enrollments" });
  });

  it("auto-enrolls a class", () => {
    cy.findByText("Enroll entire class").click();
    cy.findByRole("button", { name: /confirm enrollment/i }).click();
    cy.findByText(/class roster synced/i).should("exist");
  });
});
```

## 8. Running Cypress

Add scripts in `apps/web/package.json`:

```json
"scripts": {
  "cy:open": "cypress open",
  "cy:run": "cypress run"
}
```

Usage:

```bash
# interactive GUI
cd apps/web
bun run cy:open

# headless CI run (ensure the dev server or preview is up)
bun run --filter web preview &
bun run cy:run
```

## 9. CI considerations

- Seed the database before launching Cypress (reuse the `seed:scaffold` + `seed` flow documented earlier).
- Share `CYPRESS_baseUrl`, `CYPRESS_API_URL`, and authentication secrets via CI env vars.
- If tests rely on Better Auth, expose test endpoints (or fixtures) to create users quickly.
- Record artifacts (screenshots/videos) to debug regressions (`cypress.config.ts` has `video: true` by default).

## 10. Next steps

1. Land the base config + support files via a dedicated PR.
2. Add smoke specs for critical flows (grade entry, enrollment automation, teacher workflow).
3. Gate merges by running `bun run cy:run` in CI once the suite stabilizes.

This process ensures external developers can onboard, run, and extend Cypress tests without tribal knowledge. Once the scaffolding lands, update this doc with project-specific commands or helpers.
