#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."

# Wait for PostgreSQL to be ready
MAX_RETRIES=30
RETRY_COUNT=0

until pg_isready -h "${DATABASE_HOST:-postgres}" -U "${POSTGRES_USER:-grades}" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Database did not become ready in time"
    exit 1
  fi
  echo "Waiting for database... (${RETRY_COUNT}/${MAX_RETRIES})"
  sleep 2
done

echo "✅ Database is ready"

# Run database migrations
echo "🔄 Running database migrations..."
bun run /usr/src/app/apps/server/dist/scripts/migrate.js

# Run seeding if enabled
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "🌱 Seeding database..."

  # Run seed with optional custom file paths
  if [ -n "${SEED_FOUNDATION}" ] || [ -n "${SEED_ACADEMICS}" ] || [ -n "${SEED_USERS}" ]; then
    # Custom seed files
    SEED_ARGS=""
    [ -n "${SEED_FOUNDATION}" ] && SEED_ARGS="$SEED_ARGS --foundation ${SEED_FOUNDATION}"
    [ -n "${SEED_ACADEMICS}" ] && SEED_ARGS="$SEED_ARGS --academics ${SEED_ACADEMICS}"
    [ -n "${SEED_USERS}" ] && SEED_ARGS="$SEED_ARGS --users ${SEED_USERS}"
    bun run /usr/src/app/apps/server/dist/scripts/seed.js $SEED_ARGS
  else
    # Default seed files
    bun run /usr/src/app/apps/server/dist/scripts/seed.js
  fi

  echo "✅ Seeding completed"
fi

echo "🚀 Starting server..."
exec bun run --filter server start
