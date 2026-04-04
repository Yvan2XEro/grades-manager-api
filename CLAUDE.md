# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a grades management system API built with Better-T-Stack, featuring a backend API (Hono + tRPC) and a React frontend. The system manages academic institutions including faculties, programs, courses, students, enrollments, exams, and grades.

**Runtime**: Bun
**Database**: PostgreSQL with Drizzle ORM
**Authentication**: Better-Auth with custom domain profiles
**API**: tRPC for end-to-end type safety between frontend and backend

## Common Commands

### Development
```bash
bun install                    # Install dependencies
bun dev                        # Run all apps in development
bun dev:server                 # Run only the backend server
bun dev:web                    # Run only the web frontend
```

### Database
```bash
bun db:push                    # Push schema changes to database
bun db:studio                  # Open Drizzle Studio UI
bun db:generate                # Generate migrations
bun db:migrate                 # Run migrations
```

### Seeding
```bash
bun run --filter server seed:scaffold   # Generate sample dataset templates (writes to seed/local)
bun run --filter server seed             # Populate database from YAML files (includes org linking)
```

### Code Quality
```bash
bun check                      # Run Biome formatting and linting (auto-fix)
bun check-types                # Type-check all workspace packages
```

### Testing
```bash
# Backend (Bun test)
bun test                       # Run all tests in apps/server/src/**/__tests__/*.test.ts

# Frontend (Vitest + Cypress)
bun run --filter web test      # Run Vitest unit tests
bun run --filter web cy:open   # Open Cypress for e2e tests
bun run --filter web cy:run    # Run Cypress tests headless
```

### Build & Deploy
```bash
bun build                      # Build all applications
bun run --filter server start  # Run production server
```

## Architecture Overview

### Monorepo Structure
- `apps/server/` - Backend API (Hono + tRPC + Drizzle)
- `apps/web/` - Frontend React app (Vite + TailwindCSS + shadcn/ui)
- `packages/` - Shared packages (if any)

### Backend Architecture (`apps/server/src/`)

#### Core Setup
- **Entry point**: `index.ts` - Configures Hono server with CORS, auth routes (`/api/auth/**`), tRPC routes (`/trpc/*`), and REST routes (`/api/diplomation/**`, `/api/public/**`)
- **tRPC setup**: `lib/trpc.ts` - Defines procedure types:
  - `publicProcedure` - No authentication required
  - `protectedProcedure` - Requires authenticated session
  - `adminProcedure` - Requires admin role (administrator, dean, super_admin)
  - `superAdminProcedure` - Requires super_admin role
  - `gradingProcedure` - Requires `canGrade` permission (teachers and admins)
- **Context**: `lib/context.ts` - Creates request context with `session`, `profile` (domain user), and `permissions`
- **Router**: `routers/index.ts` - Aggregates all module routers into `appRouter`

#### Module Pattern
Each module follows a consistent structure in `modules/<name>/`:
- `index.ts` - Exports the router
- `<name>.router.ts` - tRPC router with procedures
- `<name>.service.ts` - Business logic
- `<name>.repo.ts` - Database operations (Drizzle queries)
- `<name>.zod.ts` - Zod validation schemas
- `__tests__/<name>.caller.test.ts` - Tests using `appRouter.createCaller()`

Key modules include:
- `academic-years`, `faculties`, `programs`, `study-cycles`, `teaching-units`, `courses`
- `classes`, `semesters`, `students`, `enrollments`, `student-course-enrollments`
- `exams`, `exam-types`, `exam-scheduler`, `grades`
- `users`, `domain-users`, `authz`, `notifications`, `workflows`
- `registration-numbers` - Auto-generates student/exam registration numbers
- `rules-engine` - Uses json-rules-engine for configurable business rules
- `student-credit-ledger` - Tracks credit accumulation
- `deliberations`, `promotion-rules`, `batch-jobs`, `export-templates`

#### Database Schema (`db/schema/`)
- `auth.ts` - Better-Auth tables (user, session, account, verification, organization, member)
- `app-schema.ts` - Main application schema with all domain tables (82KB, canonical source of truth)
- `registration-number-types.ts` - Types for registration number formatting

Key domain tables:
- `domainUsers` - Business profiles linked to Better-Auth users via `authUserId`
- `faculties` → `programs` → `studyCycles` → `classes` (hierarchy)
- `teachingUnits` → `courses` (curriculum structure)
- `enrollments` - Student enrollment in a class for an academic year
- `studentCourseEnrollments` - Student attempts at specific courses
- `exams` → `grades` (assessment structure)
- `workflows` - Approval workflows for grade changes
- `deliberations` - End-of-year deliberation records
- `diplomationApiKeys` - External API key management (hash only, never raw)

#### Authentication & Authorization
- **Better-Auth** (`lib/auth.ts`) manages authentication with email/password
- **Domain Users** (`modules/domain-users/`) separate business profiles from auth accounts
- **Business Roles** (`modules/authz/index.ts`):
  - Hierarchy: `super_admin` > `administrator` > `dean` > `teacher` > `grade_editor` > `staff` > `student`
  - `roleSatisfies()` checks if a role meets requirements (transitive — dean can do teacher things)
  - `assertRole()` throws FORBIDDEN if unauthorized
  - `buildPermissions()` computes permission snapshot (`canManageCatalog`, `canGrade`, etc.)

#### Background Jobs (`lib/jobs.ts`)
- `closeExpiredApprovedExams()` - Runs every 5 minutes; locks past approved exams
- `sendPending()` - Sends up to 25 pending notifications every 1 minute
- `markStaleBatchJobs()` - Marks timed-out batch jobs every 5 minutes
- **Queue**: pg-boss for PostgreSQL, falls back to `setInterval` with PGlite/test environments

#### Testing Approach
- Use `makeTestContext()`, `asAdmin()`, `asSuperAdmin()` from `lib/test-utils.ts` to create test contexts
- Call routers via `appRouter.createCaller(context)` for integration tests
- Tests are in `__tests__/*.caller.test.ts` files using Bun's test runner

### Frontend Architecture (`apps/web/src/`)

- **tRPC Client**: `utils/trpc.ts` - Type-safe API client
- **Auth Client**: `lib/auth-client.ts` - Better-Auth client
- **State**: `store/index.ts` - Zustand for global state
- **i18n**: `i18n/` - i18next with English and French translations
- **Routing**: React Router v7
- **UI**: shadcn/ui components with TailwindCSS v4

## Environment Variables

### Backend (`apps/server/.env`)
```bash
# Required
DATABASE_URL=postgres://user:password@host:5432/db
BETTER_AUTH_SECRET=<min 32 chars, generate: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:4173

# Auth cookies (production)
BETTER_AUTH_COOKIE_SAMESITE=none
BETTER_AUTH_COOKIE_SECURE=true

# Server
PORT=3000
SERVER_PUBLIC_URL=http://localhost:3000
NODE_ENV=development

# Email (optional — notifications degraded without it)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@example.com

# Storage
STORAGE_DRIVER=local
STORAGE_LOCAL_ROOT=./storage/uploads
STORAGE_LOCAL_PUBLIC_PATH=/uploads

# Development only
USE_PGLITE=true                # In-memory/file DB instead of PostgreSQL
PGLITE_DATA_DIR=./data/pglite
RETAKES_FEATURE_FLAG=false
```

### Frontend (`apps/web/.env`)
```bash
VITE_SERVER_URL=http://localhost:3000
VITE_DEFAULT_ORGANIZATION_SLUG=sgn-institution
```

## Important Patterns

### Adding a New Module
1. Create `modules/<name>/` directory
2. Define Zod schemas in `<name>.zod.ts`
3. Create database queries in `<name>.repo.ts`
4. Implement business logic in `<name>.service.ts`
5. Build tRPC router in `<name>.router.ts` using appropriate procedures
6. Export router from `index.ts`
7. Add to `routers/index.ts` appRouter
8. Write tests in `__tests__/<name>.caller.test.ts`

### Role-Based Access Control
- Use `protectedProcedure` for authenticated users
- Use `adminProcedure` for admin-only operations
- Use `gradingProcedure` for grade submission/editing
- Use `superAdminProcedure` for super admin operations (e.g., activating academic years)
- Check `ctx.permissions` for fine-grained access (e.g., `ctx.permissions.canGrade`)

### Database Relationships
- Use Drizzle relations defined in `app-schema.ts`
- Foreign keys cascade on delete where appropriate
- Use `gen_random_uuid()` for primary keys
- Timestamps: `createdAt`, `updatedAt` with `withTimezone: true`

### Context Usage
- `ctx.session` - Better-Auth session with user info
- `ctx.profile` - Domain user profile (may be null for guests)
- `ctx.permissions` - Pre-computed permission snapshot
- `ctx.institution` - Resolved institution (always set on tenant procedures)

### Error Handling
Use helpers from `_shared/errors.ts`:
```typescript
notFound(message)    // → TRPCError { code: "NOT_FOUND" }
conflict(message)    // → TRPCError { code: "CONFLICT" }
```
Common codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `PRECONDITION_FAILED`

Use `requireXxx()` pattern in services to validate ownership and existence early, then throw.

### Seeding Data
- Scaffold templates generate YAML files in `seed/local/` (gitignored)
- Seed command loads layered YAML files: foundation, academic structure, enrollment data
- Use `--dir` or `$SEED_DIR` to customize seed directory
- Override specific files with `--foundation`, etc.

### Batch Jobs Pattern
Jobs are registered in `BATCH_JOB_TYPES` and implement a `JobHandler` interface:
- `preview()` - Dry-run, returns estimated steps/items
- `execute(step, ctx)` - Runs a single step, reports progress via `ctx.reportStepProgress()`
- `rollback()` - Optional reversal
- Job context includes `institutionId` — all data access must be institution-scoped

### Diplomation REST API (External Integration)
Secured by API key (`X-Api-Key` header). Raw keys are never stored — only SHA256 hash.
Key endpoints in `index.ts`:
```
GET  /api/public/branding/:slug               # Public, no auth
GET  /api/diplomation/deliberations           # List deliberations
GET  /api/diplomation/deliberations/:id       # Full deliberation export
GET  /api/diplomation/config                  # Programs, years, params
POST /api/diplomation/documents               # Log generated document
```
Webhooks are dispatched non-blocking (fire-and-forget) with HMAC-SHA256 signature.

## Code Style (Biome)

- **Indentation**: Tabs (width 2)
- **Quotes**: Double quotes
- **Semicolons**: Required
- Import organization is enforced (`organize imports`)
- Tailwind class sorting via `cn`, `clsx`, `cva` helpers
- Run `bun check` before committing to auto-fix formatting and linting

## Critical Gotchas

1. **Organization context is mandatory** — Every tRPC request requires an active organization resolved from session, `X-Organization-Slug` header, or profile membership. Missing context throws `PRECONDITION_FAILED`.

2. **Role hierarchy is transitive** — Always use `roleSatisfies()`, never exact role comparison. A dean passes teacher checks.

3. **Three identity layers**:
   - `user` (Better-Auth) = email/password account
   - `member` = organization membership record with role
   - `domainUser`/`profile` = institutional profile (multiple allowed per user)

4. **Exam locking is irreversible** — Once `isLocked = true`, no grade edits are allowed. Locking happens on manual approval or automatic expiry.

5. **API keys store only the hash** — Raw keys must be distributed out-of-band. Key rotation requires generating and re-distributing a new key.

6. **PGlite vs PostgreSQL** — Development defaults to `USE_PGLITE=true` (in-memory, no pg-boss). Production requires PostgreSQL. Tests always use PGlite.

7. **Webhook delivery is non-blocking** — Webhook failures are logged but don't fail the transaction. Don't rely on delivery confirmation in the same request.

8. **Notifications have no explicit "failed" state** — Only `pending` and `sent`. Delivery failures are logged to console, not persisted.

9. **`RETAKES_FEATURE_FLAG`** gates whether students can retry failed courses. Disabled by default.
