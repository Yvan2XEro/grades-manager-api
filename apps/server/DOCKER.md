# Docker Deployment Guide

## Startup Process

The Docker image includes an entrypoint script (`docker-entrypoint.sh`) that automatically handles database setup before starting the server:

1. **Waits for database** - Waits for PostgreSQL to be ready (max 60 seconds)
2. **Runs migrations** - Applies any pending migrations from `src/db/migrations/`
3. **Seeds database** (optional) - Populates initial data and links organizations if `RUN_SEED=true`
4. **Starts server** - Launches the application

## Database Migrations

### Development vs Production

**Development** (local):
```bash
# Push schema changes directly to database (no migration files)
bun db:push
```

**Production** (Docker):
```bash
# Generate migration files from schema changes
bun db:generate

# Commit the generated migrations
git add apps/server/src/db/migrations/
git commit -m "chore: add database migrations"

# Build and deploy - migrations run automatically on container start
docker compose up --build
```

### Migration Files

- **Location**: `apps/server/src/db/migrations/`
- **Tracked in Git**: Yes - commit these files
- **Auto-applied**: Yes - on container startup via `docker-entrypoint.sh`

### Initial Setup (First Deployment)

If you haven't generated any migrations yet:

1. **Generate initial migration**:
   ```bash
   bun run --filter server db:generate
   ```

2. **Review the generated SQL**:
   ```bash
   cat apps/server/src/db/migrations/0000_*.sql
   ```

3. **Commit and deploy**:
   ```bash
   git add apps/server/src/db/migrations/
   git commit -m "chore: initial database schema"
   docker compose up --build
   ```

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `DATABASE_HOST` - Database host for health check (default: `postgres`)
- `POSTGRES_USER` - Database user for health check (default: `grades`)

### Troubleshooting

**Container fails to start with "Database did not become ready"**:
- Check that PostgreSQL container is running
- Verify `DATABASE_URL` is correct
- Check `depends_on` in docker-compose.yml

**Migration errors**:
- Check migration files in `src/db/migrations/`
- Verify database schema matches your code
- Review container logs: `docker compose logs server`

**Skipping migrations**:
If you see "No migrations folder found, skipping migrations", it means:
- No `src/db/migrations/` directory exists, OR
- The directory is empty

This is normal for new projects. Generate your first migration with `bun db:generate`.

## Database Seeding

### Enable Seeding

Seeding is **disabled by default**. Enable it using environment variables:

```bash
# Using docker-compose.seed.yml override
docker compose -f docker-compose.yml -f docker-compose.seed.yml up

# Or set environment variable directly
RUN_SEED=true docker compose up
```

### How Seeding Works

When `RUN_SEED=true`, the entrypoint script:

1. Runs migrations (always runs first)
2. Executes seed script with YAML data files (includes organization linking)
3. Starts the server

### Seed Files Structure

The seeding system expects YAML files in the `/usr/src/app/apps/server/seed/` directory:

```
apps/server/seed/
├── 00-foundation.yaml    # Institution, academic years, exam types
├── 10-academics.yaml     # Faculties, programs, courses, etc.
└── 20-users.yaml         # Admin users, teachers, students
```

### Preparing Seed Files

**Option 1: Use existing seed files** (development)

```bash
# Generate scaffold seed files locally
bun run --filter server seed:scaffold

# Review and customize the generated files
ls apps/server/seed/local/

# Use them in Docker via volume mount
docker compose -f docker-compose.yml -f docker-compose.seed.yml up
```

**Option 2: Create custom seed files**

1. Create your YAML files following the schema (see `src/seed/runner.ts`)
2. Place them in `apps/server/seed/` directory
3. Mount the directory in Docker Compose

### Environment Variables for Seeding

| Variable | Default | Description |
|----------|---------|-------------|
| `RUN_SEED` | `false` | Enable seeding on startup |
| `SEED_FOUNDATION` | (none) | Custom path to foundation YAML file |
| `SEED_ACADEMICS` | (none) | Custom path to academics YAML file |
| `SEED_USERS` | (none) | Custom path to users YAML file |

### Example: Custom Seed Files

**docker-compose.override.yml**:
```yaml
services:
  server:
    environment:
      RUN_SEED: "true"
      SEED_FOUNDATION: "/seed/prod-foundation.yaml"
      SEED_ACADEMICS: "/seed/prod-academics.yaml"
      SEED_USERS: "/seed/prod-users.yaml"
    volumes:
      - ./production-seeds:/usr/src/app/apps/server/seed:ro
```

### Scripts Included

All scripts are located in `dist/scripts/` after build:

- **`migrate.js`** - Run database migrations (always runs)
- **`seed.js`** - Populate database from YAML files (includes organization linking)

### Full Example: First-Time Setup with Seed

```bash
# 1. Generate migrations and seed files locally
bun run --filter server db:generate
bun run --filter server seed:scaffold

# 2. Customize seed files
vim apps/server/seed/local/*.yaml

# 3. Build and run with seeding
docker compose -f docker-compose.yml -f docker-compose.seed.yml up --build

# 4. For subsequent runs without seeding
docker compose up
```

### Production Deployment Notes

- **Migrations run automatically** on every container start
- **Seeding is opt-in** - only runs when explicitly enabled
- Seed files should be prepared and committed to your repository or provided via volume mount
- For production, use `RUN_SEED=true` only on first deployment
- Subsequent deployments should use `RUN_SEED=false` (default) to avoid data conflicts

### Seeding Troubleshooting

**"No seed files found"**:
- Ensure seed directory exists: `/usr/src/app/apps/server/seed/`
- Verify volume mount in docker-compose.yml
- Check file permissions (should be readable)

**"Seed failed with duplicate key error"**:
- Database already has data
- Only seed empty databases
- Use `RUN_SEED=false` for subsequent deployments

**Seeding errors**:
- Check seed file format (valid YAML)
- Ensure Better Auth tables are migrated first
- Review logs: `docker compose logs server`
