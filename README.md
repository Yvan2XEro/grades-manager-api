# grades-manager-api

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **i18next** - Internationalization (English/French)
- **Cypress** - E2E testing

## Architecture Highlights

### Code-Based Entity References
All major entities (faculties, programs, classes, courses, etc.) use unique `code` fields for identification and relationships, making the system more maintainable and human-readable.

### Auth ↔ Domain Separation
The system separates authentication (`auth.user` via Better Auth) from business profiles (`domain_users`), allowing flexible identity management while keeping academic data clean.

### Atomic Course Enrollments
Students enroll in individual courses (not just classes), with full audit trail support for attempts, retakes, and grade history. See [`docs/atomic-enrollment-and-cycles.md`](docs/atomic-enrollment-and-cycles.md).

### Study Cycle Hierarchy
Programs are organized by faculty → program → option → level structure, supporting complex academic hierarchies and promotion rules.

### Structured Seeding
Reproducible database seeding with YAML-based configuration and code references. Perfect for development, testing, and demos.

## Quick Start

Get the project running in 5 steps:

```bash
# 1. Install dependencies
bun install

# 2. Configure your database (update apps/server/.env)
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# 3. Apply database schema
bun db:push

# 4. Generate and load seed data
bun run --filter server seed:scaffold
bun run --filter server seed

# 5. Start the development server
bun dev
```

The API will be available at [http://localhost:3000](http://localhost:3000).

**Default Login Credentials** (from seed data):
- Admin: Check `apps/server/seed/local/20-users.yaml` for credentials
- The seeded administrator account can access all features

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

### 1. Database Configuration

Make sure you have a PostgreSQL database set up and update your `apps/server/.env` file with your connection details:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### 2. Apply Database Schema

Apply the schema to your database:
```bash
bun db:push
```

### 3. Seed the Database

This project uses a structured seeding system with code-based references for reproducible data. The seed data is organized in layers:

- **Foundation layer** (`00-foundation.yaml`): Exam types, faculties, study cycles, cycle levels, semesters, academic years
- **Academics layer** (`10-academics.yaml`): Programs, program options, teaching units, courses, classes, class courses
- **Users layer** (`20-users.yaml`): Better Auth accounts, domain users (admins, teachers, students), enrollments

#### 3.1 Generate Sample Seed Files

Generate the sample dataset templates (written to `seed/local`, which is gitignored):

```bash
bun run --filter server seed:scaffold
```

Use `--dir` to write elsewhere if needed:
```bash
bun run --filter server seed:scaffold -- --dir tmp/seeds --force
```

#### 3.2 Customize Seed Data (Optional)

Edit the YAML files in `apps/server/seed/local/`:
- `00-foundation.yaml` - Core academic catalogs
- `10-academics.yaml` - Programs, classes, courses
- `20-users.yaml` - User accounts and enrollments

All entities reference each other via `code` fields for readability and maintainability.

#### 3.3 Run the Seed Command

Populate the database with the seed files:

```bash
bun run --filter server seed
```

You can override specific layers:
```bash
bun run --filter server seed \
  --foundation seed/local/00-foundation.yaml \
  --academics seed/custom/academics-demo.yaml \
  --users seed/local/20-users.yaml
```

Or use a custom seed directory via environment variable:
```bash
SEED_DIR=seed/custom bun run --filter server seed
```

For complete seeding documentation, see [`docs/seed-playbook.md`](docs/seed-playbook.md).

### Seed File Structure

The seeding system uses a layered approach with code-based references:

**Code-Based References**
All entities (faculties, programs, classes, courses, etc.) have a unique `code` field. Relationships use these codes instead of auto-generated IDs, making seed files human-readable and maintainable:

```yaml
# 10-academics.yaml example
programs:
  - code: INF-LIC
    name: Informatique Licence
    facultyCode: SCI    # References faculty by code

classes:
  - code: INF11-A
    name: L1 Informatique A
    programCode: INF-LIC          # References program by code
    programOptionCode: INF-GEN    # References option by code
    cycleLevelCode: L1            # References level by code
```

**Layered Loading**
Seeds are processed in dependency order:
1. **Foundation** → Faculties, study cycles, exam types, academic years
2. **Academics** → Programs → Options → Classes → Courses → Class Courses
3. **Users** → Domain users → Teachers/Students → Enrollments

**Idempotency**
The seed command upserts by code (`ON CONFLICT (code) DO UPDATE`), so you can safely re-run it to refresh data without duplicates.

**Testing**
The seed pipeline includes automated tests (`apps/server/src/seed/__tests__/`) using PGlite to ensure fixtures remain consistent.

Then, run the development server:

```bash
bun dev
```

The API is running at [http://localhost:3000](http://localhost:3000).





## Project Structure

```
grades-manager-api/
├── apps/
│   ├── server/              # Backend API (Hono, TRPC)
│   │   ├── src/
│   │   │   ├── modules/     # Business logic modules
│   │   │   ├── routers/     # tRPC routers
│   │   │   ├── db/          # Database schema and migrations
│   │   │   ├── seed/        # Seeding infrastructure
│   │   │   │   ├── runner.ts           # Seed execution engine
│   │   │   │   ├── sample-data.ts      # Default sample templates
│   │   │   │   └── __tests__/          # Seed tests
│   │   │   └── scripts/     # CLI scripts (seed, scaffold)
│   │   └── seed/
│   │       └── local/       # Local seed data (gitignored)
│   │           ├── 00-foundation.yaml
│   │           ├── 10-academics.yaml
│   │           └── 20-users.yaml
│   └── web/                 # Frontend (React + i18next)
├── docs/                    # Documentation
│   ├── seed-playbook.md     # Complete seeding guide
│   ├── analyze.md           # Product specifications
│   └── ...
└── TODO.md                  # Project roadmap
```

## Available Scripts

### Development
- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:server`: Start only the server
- `bun check-types`: Check TypeScript types across all apps
- `bun check`: Run Biome formatting and linting

### Database
- `bun db:push`: Push schema changes to database
- `bun db:studio`: Open database studio UI
- `bun db:generate`: Generate Drizzle migrations
- `bun db:migrate`: Run Drizzle migrations

### Seeding
- `bun run --filter server seed:scaffold`: Generate sample seed YAML files (written to `seed/local/`)
- `bun run --filter server seed`: Populate database with seed data from YAML files
  - Use `--foundation`, `--academics`, `--users` flags to override specific layer files
  - Use `SEED_DIR` environment variable to change the default seed directory

### Testing
- `bun test`: Run all tests
- `bun test apps/server`: Run server tests only
- `npm run --prefix apps/web cypress:open`: Open Cypress for interactive E2E testing
- `npm run --prefix apps/web cypress:run`: Run Cypress E2E tests headlessly

## Testing

### E2E Testing with Cypress

The project includes comprehensive Cypress E2E tests covering critical business workflows:

**Priority 1 - Core Features (Completed)**
- Authentication & Authorization (admin/teacher/student login, logout, access control)
- Grade Entry (entry, modification, locking)
- Student Management (creation, bulk import, modification, search)
- Enrollment Management (individual, bulk, closure)
- Exam Management (creation, scheduling, conflict detection)

**Running Cypress Tests**

```bash
cd apps/web

# Interactive mode (UI)
npm run cypress:open

# Headless mode (CI)
npm run cypress:run

# Run specific test file
npm run cypress:run -- --spec "cypress/e2e/auth/login.cy.ts"
```

**Test Setup**
- Tests use a `cy.resetDatabase()` command to ensure clean state
- Custom `cy.loginAs(role)` command for authentication
- Supports both English and French UI (i18next)
- All tests use accessibility-first queries via `@testing-library/cypress`

For more details on E2E testing, see [`docs/cypress-critical-features.md`](docs/cypress-critical-features.md).

## Documentation

### Core Documentation
- [`TODO.md`](TODO.md) - Project roadmap and implementation phases
- [`docs/analyze.md`](docs/analyze.md) - Complete product specifications
- [`docs/architecture.md`](docs/architecture.md) - System architecture overview

### Database & Seeding
- [`docs/seed-playbook.md`](docs/seed-playbook.md) - Complete seeding guide and reference
- [`docs/program-code-standard.md`](docs/program-code-standard.md) - Code generation standards
- [`docs/program-hierarchy-migration.md`](docs/program-hierarchy-migration.md) - Program structure design

### Feature Documentation
- [`docs/atomic-enrollment-and-cycles.md`](docs/atomic-enrollment-and-cycles.md) - Enrollment system and study cycles
- [`docs/auth-domain-arch-diagram.md`](docs/auth-domain-arch-diagram.md) - Auth ↔ Domain separation strategy
- [`docs/workflows.md`](docs/workflows.md) - User workflows (admin/teacher/student)

### Testing
- [`docs/cypress-critical-features.md`](docs/cypress-critical-features.md) - E2E testing strategy
- [`docs/cypress-e2e-guide.md`](docs/cypress-e2e-guide.md) - Cypress setup and usage guide

## Contributing

This project follows structured development practices:
- All UI text must use i18next for internationalization
- Code formatting and linting via Biome (`bun check`)
- Type safety enforced via TypeScript
- Database changes via Drizzle migrations
- E2E tests for critical business workflows

See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) for collaboration guidelines.
