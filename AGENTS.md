# Repository Guidelines

## Project Structure & Module Organization
The monorepo uses Bun workspaces. `apps/server` hosts the API, and `apps/web` contains the client shell. Inside `apps/server/src`, `index.ts` bootstraps the app, domain logic lives in `modules/<domain>`, shared helpers and test utilities sit in `lib`, HTTP routers publish public endpoints from `routers`, and database schema artifacts are under `db`. Module-specific tests reside alongside features in `__tests__` folders, while end-to-end suites live in `routers/__tests__`.

## Build, Test, and Development Commands
Install once with `bun install`. Use `bun run dev:server` to start the API in watch mode, and `bun run dev:web` when working on the web client. Bundle the workspaces with `bun run build`; type-check only via `bun run check-types`. For database lifecycle tasks call `bun run db:generate`, `db:push`, or `db:migrate` from the repo root—each targets the server workspace. Launch the production bundle using `bun run start:server`.

## Coding Style & Naming Conventions
Biome (`biome.json`) is the source of truth: run `bun run check` to auto-format and lint. The formatter enforces tab indentation, double quotes, and organized imports. Prefer explicit module names that mirror folder structure (e.g., `modules/grades/grades.caller.ts`). Tests follow the `*.caller.test.ts` or `*.http.test.ts` suffix; keep filenames aligned with the subject under test.

## UI Localization
All new UI surfaces must use i18next translations—follow the pattern in `apps/web/src/pages/auth/Login.tsx`. Prefer `useTranslation` or `<Translation>` instead of hard-coded strings, and add keys to the locale resources before committing. After updating resources, refresh the generated type helpers with `bun run --filter web i18n:gen` so autocompletion stays accurate.

## Testing Guidelines
Write server tests with Bun’s built-in runner; coverage is enabled via `apps/server/bunfig.toml`. Run all tests from the workspace with `bun test` or scope to the server using `bun test apps/server`. Seed helper functions from `src/lib/test-utils.ts` to set up auth, database fixtures, and TRPC callers. Add new suites under the corresponding module `__tests__` directory and favor descriptive `describe` blocks that match the router or procedure name.

## Commit & Pull Request Guidelines
Follow the conventional commit style already in history (`feat:`, `fix:`, `chore:`). Keep summaries under ~70 characters and mention scope when useful (`feat(server):`). In pull requests, provide a concise problem statement, list functional changes, and note any database migrations or config updates. Link related issues or discussions and attach screenshots for UI-facing work from `apps/web`.
