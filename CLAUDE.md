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
- **Entry point**: `index.ts` - Configures Hono server with CORS, auth routes (`/api/auth/**`), and tRPC routes (`/trpc/*`)
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

#### Database Schema (`db/schema/`)
- `auth.ts` - Better-Auth tables (user, session, account, verification)
- `app-schema.ts` - Main application schema with all domain tables
- `registration-number-types.ts` - Types for registration number formatting

Key domain tables:
- `domainUsers` - Business profiles linked to Better-Auth users via `authUserId`
- `faculties` → `programs` → `studyCycles` → `classes` (hierarchy)
- `teachingUnits` → `courses` (curriculum structure)
- `enrollments` - Student enrollment in a class for an academic year
- `studentCourseEnrollments` - Student attempts at specific courses
- `exams` → `grades` (assessment structure)
- `workflows` - Approval workflows for grade changes

#### Authentication & Authorization
- **Better-Auth** (`lib/auth.ts`) manages authentication with email/password
- **Domain Users** (`modules/domain-users/`) separate business profiles from auth accounts
- **Business Roles** (`modules/authz/index.ts`):
  - Hierarchy: `super_admin` > `administrator` > `dean` > `teacher` > `staff` > `student`
  - `roleSatisfies()` checks if a role meets requirements
  - `assertRole()` throws FORBIDDEN if unauthorized
  - `buildPermissions()` computes permission snapshot (`canManageCatalog`, `canGrade`, etc.)

#### Background Jobs (`lib/jobs.ts`)
- `closeExpiredApprovedExams()` - Runs every 5 minutes
- `sendPending()` - Sends pending notifications every 1 minute

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

### Seeding Data
- Scaffold templates generate YAML files in `seed/local/` (gitignored)
- Seed command loads layered YAML files: foundation, academic structure, enrollment data
- Use `--dir` or `$SEED_DIR` to customize seed directory
- Override specific files with `--foundation`, etc.
