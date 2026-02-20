# Server Scripts

This directory contains executable scripts for database management and operations.

## Available Scripts

### 🔄 `migrate.ts`
Runs database migrations programmatically.

**Usage (local)**:
```bash
bun run src/scripts/migrate.ts
```

**Usage (Docker)**:
Runs automatically on container startup via `docker-entrypoint.sh`

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string (required)

---

### 🌱 `seed.ts`
Populates the database with data from YAML files and links organizations automatically.

**Usage (local)**:
```bash
# Default seed files (seed/00-foundation.yaml, seed/10-academics.yaml, seed/20-users.yaml)
bun run --filter server seed

# Custom seed files
bun run --filter server seed --foundation ./custom/foundation.yaml \
                               --academics ./custom/academics.yaml \
                               --users ./custom/users.yaml

# Show help
bun run --filter server seed --help
```

**Usage (Docker)**:
Set `RUN_SEED=true` environment variable:
```bash
docker compose -f docker-compose.yml -f docker-compose.seed.yml up
```

**What it does**:
1. Populates database from YAML files (institutions, academic structure, users)
2. Automatically links institutions to Better Auth organizations
3. Creates organization members for staff users

**Options**:
- `--foundation <path>` - Override foundation YAML file
- `--academics <path>` - Override academics YAML file
- `--users <path>` - Override users YAML file
- `--help` - Show help message

**Environment Variables** (Docker):
- `RUN_SEED` - Enable seeding (`true`/`false`, default: `false`)
- `SEED_FOUNDATION` - Custom foundation file path
- `SEED_ACADEMICS` - Custom academics file path
- `SEED_USERS` - Custom users file path

---

### 🏗️ `scaffold-seeds.ts`
Generates sample YAML seed files with realistic data.

**Usage (local only)**:
```bash
# Generate to default directory (seed/local/)
bun run --filter server seed:scaffold

# Generate to custom directory
bun run --filter server seed:scaffold --dir ./custom-seeds

# Force overwrite existing files
bun run --filter server seed:scaffold --force

# Show help
bun run --filter server seed:scaffold --help
```

**Options**:
- `--dir <path>` - Target directory (default: `$SEED_DIR` or `seed/local`)
- `--force` - Overwrite existing files
- `--help` - Show help message

**Not available in Docker** - This is a development-only script.

---

## Script Organization

All scripts follow a consistent pattern:

```typescript
import "dotenv/config";  // Load environment variables

// ... script logic ...

async function main() {
  // Parse CLI arguments
  // Execute operations
  // Handle errors
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[script-name] Failed:", error);
    process.exit(1);
  });
```

## Tests

Tests for scripts are located in `__tests__/` directory:

```
src/scripts/__tests__/
└── seed.test.ts  # Tests for seed functionality
```

**Running tests**:
```bash
# Run all script tests
bun test apps/server/src/scripts

# Run specific test
bun test apps/server/src/scripts/__tests__/seed.test.ts
```

**Note**: Tests require migrations to be generated first:
```bash
bun run --filter server db:generate
```

Without migrations, tests will gracefully skip with a warning.

## Build Output

When running `bun run --filter server build`, all scripts are compiled to `dist/scripts/`:

```
dist/scripts/
├── migrate.js              # Database migrations
└── seed.js                 # Database seeding (includes organization linking)
```

The compiled scripts are used in the Docker container.

## Development Workflow

### Local Development

1. **Make schema changes**:
   ```bash
   # Edit files in src/db/schema/
   ```

2. **Push to database** (development):
   ```bash
   bun db:push
   ```

3. **Generate seed data** (optional):
   ```bash
   bun run --filter server seed:scaffold
   # Edit generated files in seed/local/
   ```

4. **Test seeding**:
   ```bash
   bun run --filter server seed  # Includes organization linking
   ```

### Production Deployment

1. **Generate migrations**:
   ```bash
   bun db:generate
   git add apps/server/src/db/migrations/
   git commit -m "chore: add migrations"
   ```

2. **Prepare seed files** (if needed):
   ```bash
   bun run --filter server seed:scaffold
   # Customize seed/local/*.yaml
   # Copy to production seed directory or prepare volume mount
   ```

3. **Deploy**:
   ```bash
   # First deployment with seeding
   docker compose -f docker-compose.yml -f docker-compose.seed.yml up --build

   # Subsequent deployments (migrations only)
   docker compose up
   ```

## See Also

- [DOCKER.md](../../DOCKER.md) - Complete Docker deployment guide
- [../../seed/](../../seed/) - Seed data directory
- [../seed/](../seed/) - Seed runner implementation
