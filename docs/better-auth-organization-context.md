# Better Auth Organization Context Rollout

This note explains how we finish the multi-tenant migration by wiring Better Auth's organization context into every request and surfacing the active organization on the frontend. Use it with the existing [organization documentation](docs/organization.md) while implementing the changes.

## Why this is needed

- `apps/server/src/lib/context.ts` still falls back to `requireDefaultInstitution` whenever the Better Auth session carries no active organization. That helper (`apps/server/src/lib/institution.ts`) silently creates or reuses a catch-all institution, which defeats tenant scoping.
- Several services (`modules/class-courses`, `modules/promotion-rules`, test utilities, seeds) still call `requireDefaultInstitutionId`. As soon as we host multiple institutions these flows will leak data across tenants.
- On the frontend there is no reliable way to pick the active organization slug, so Better Auth keeps whichever slug was last selected (or none at all). We need deterministic slug discovery (subdomain or env fallback) plus client-side activation right after login.

## Backend scope

1. **Context resolution**
	- `createContext` must require an active organization. Attempt to pull it from `session.session.activeOrganizationId`. If it is missing, look up the member via `profile.memberId` and use `member.organizationId`. If both fail, reject the request (401) instead of inventing a tenant.
	- Replace the default institution helper with `requireTenantInstitution(ctx)` that reads the resolved `organizationId` and looks up `institutions.organization_id`. Delete the legacy auto-create logic once seeds guarantee at least one institution.
2. **Module/services alignment**
	- Update every module that imports `requireDefaultInstitution`/`requireDefaultInstitutionId` or `ensureInstitutionScope` (see `rg requireDefaultInstitution` output) to accept `institutionId` from the caller. Services should always read it from the TRPC context (or explicit params for background jobs) and pass it through to the repositories.
	- Shared helpers (`modules/_shared`, `lib/test-utils.ts`, `lib/test-db.ts`) must allow callers to specify an institution. Tests should create fixtures with `institutionId` derived from the seeded organization rather than the helper.
3. **Seeds & fixtures**
	- Extend YAML seeds so each institution row references an organization ID/slug from Better Auth, mirroring the plan in `docs/institution-multi-tenant-plan.md`.
	- Provide a `scripts/setup-default-org.ts` or documented DB command to create: organization → institution → members → domain_users linkage. Tests and local bootstrap scripts must use this path so production never relies on the deleted fallback.
4. **Guard rails & tests**
	- Add TRPC integration tests that log in as user A (org-1) and user B (org-2) to prove data cannot leak across `institution_id`.
	- Cover the "no organization active" scenario with a clear `UNAUTHORIZED` or `PRECONDITION_REQUIRED` error so integrators know they must set an active org before calling routers.

## Frontend scope

1. **Slug discovery**
	- Read `window.location.host` and extract the subdomain segment (`inst-01.domain.com` → `inst-01`). Ignore cases where the host is `localhost`, `127.0.0.1`, or contains only one segment; in those cases fall back to a new `VITE_DEFAULT_ORGANIZATION_SLUG`.
	- Store the resolved slug inside Zustand (e.g., `activeOrganizationSlug`) so components that need it can read it without recomputing.
2. **Better Auth client wiring**
	- After login (or whenever the slug changes) call `authClient.organization.setActiveOrganization({ slug })` so Better Auth persists the active organization in the session (see `docs/organization.md` for the API). Repeat this on app boot if a session already exists to guarantee the backend context sees the slug.
	- Surface a lightweight indicator in the shell (e.g., navbar badge) so users know which organization is active. Later we can turn it into a selector when multi-org UIs arrive.
3. **Router/bootstrap updates**
	- Ensure TRPC hooks (e.g., `apps/web/src/utils/trpc.ts`) only run requests after the organization is set, or include retry logic when the server answers with "no active organization".
	- Update auth/logout flows so clearing the user also clears any cached slug state.

## Task breakdown

1. Remove `requireDefaultInstitution` helpers and make the server context throw when no organization is set.
2. Thread `institutionId` from the context into every module/router that currently pulls it from helpers.
3. Update seeds/tests to create explicit organization ↔ institution mappings with Better Auth members.
4. Implement frontend slug detection (subdomain or `VITE_DEFAULT_ORGANIZATION_SLUG`) and call the Better Auth organization client to activate it post-login.
5. Document bootstrap steps (`docs/seed-playbook.md` or new guide) so new environments know how to create the organization + institution pair.
