#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."

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

echo "🔄 Running database migrations..."
bun run /usr/src/app/apps/server/dist/scripts/migrate.js

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "🌱 Seeding database..."

  SEED_TMP=""

  # Step 1 — Try downloading YAML seeds from portal URLs (requires curl)
  if [ -n "${SEED_FOUNDATION_URL:-}" ] || [ -n "${SEED_ACADEMICS_URL:-}" ] || [ -n "${SEED_USERS_URL:-}" ]; then
    SEED_TMP=$(mktemp -d)
    echo "  Downloading seed files from portal..."
    if [ -n "${SEED_FOUNDATION_URL:-}" ]; then
      if curl -fsSL "${SEED_FOUNDATION_URL}" -o "${SEED_TMP}/foundation.yaml"; then
        SEED_FOUNDATION="${SEED_TMP}/foundation.yaml"
      else
        echo "  ⚠ Could not download foundation seed (curl unavailable or URL unreachable)"
      fi
    fi
    if [ -n "${SEED_ACADEMICS_URL:-}" ]; then
      if curl -fsSL "${SEED_ACADEMICS_URL}" -o "${SEED_TMP}/academics.yaml"; then
        SEED_ACADEMICS="${SEED_TMP}/academics.yaml"
      else
        echo "  ⚠ Could not download academics seed"
      fi
    fi
    if [ -n "${SEED_USERS_URL:-}" ]; then
      if curl -fsSL "${SEED_USERS_URL}" -o "${SEED_TMP}/users.yaml"; then
        SEED_USERS="${SEED_TMP}/users.yaml"
      else
        echo "  ⚠ Could not download users seed"
      fi
    fi
  fi

  # Step 2 — Local fallback: generate minimal YAML from SEED_ORG_* env vars.
  # Runs whenever SEED_FOUNDATION is still unset and SEED_ORG_SLUG is provided
  # (covers both the no-URL case and the curl-failed case).
  if [ -n "${SEED_ORG_SLUG:-}" ] && [ -z "${SEED_FOUNDATION:-}" ]; then
    SEED_TMP=$(mktemp -d)
    echo "  Generating seed files from SEED_ORG_* env vars..."

    cat > "${SEED_TMP}/foundation.yaml" << YAML
organizations:
  - slug: ${SEED_ORG_SLUG}
    name: ${SEED_ORG_NAME:-${SEED_ORG_SLUG}}
institutions:
  - code: MAIN
    nameFr: ${SEED_ORG_NAME:-${SEED_ORG_SLUG}}
    nameEn: ${SEED_ORG_NAME:-${SEED_ORG_SLUG}}
    organizationSlug: ${SEED_ORG_SLUG}
    type: ${SEED_ORG_TYPE:-university}
    isDefault: true
examTypes:
  - name: CC
    description: Continuous Assessment
    defaultPercentage: 40
  - name: FINAL
    description: Final Exam
    defaultPercentage: 60
academicYears:
  - code: "2024-2025"
    name: "2024-2025"
    startDate: "2024-09-01"
    endDate: "2025-08-31"
    isActive: true
YAML

    cat > "${SEED_TMP}/users.yaml" << YAML
authUsers:
  - code: ADMIN-ROOT
    email: ${SEED_ADMIN_EMAIL:-admin@example.com}
    name: ${SEED_ADMIN_NAME:-Admin}
    password: ${SEED_ADMIN_PASSWORD:-Admin1234!}
    role: admin
domainUsers:
  - code: DOMAIN-ROOT
    authUserEmail: ${SEED_ADMIN_EMAIL:-admin@example.com}
    firstName: ${SEED_ADMIN_NAME:-Admin}
    lastName: ""
    primaryEmail: ${SEED_ADMIN_EMAIL:-admin@example.com}
    organizationSlug: ${SEED_ORG_SLUG}
    memberRole: super_admin
YAML

    SEED_FOUNDATION="${SEED_TMP}/foundation.yaml"
    SEED_USERS="${SEED_TMP}/users.yaml"
  fi

  # Run seed with available files
  if [ -n "${SEED_FOUNDATION:-}" ] || [ -n "${SEED_ACADEMICS:-}" ] || [ -n "${SEED_USERS:-}" ]; then
    SEED_ARGS=""
    [ -n "${SEED_FOUNDATION:-}" ] && SEED_ARGS="$SEED_ARGS --foundation ${SEED_FOUNDATION}"
    [ -n "${SEED_ACADEMICS:-}" ] && SEED_ARGS="$SEED_ARGS --academics ${SEED_ACADEMICS}"
    [ -n "${SEED_USERS:-}" ] && SEED_ARGS="$SEED_ARGS --users ${SEED_USERS}"
    bun run /usr/src/app/apps/server/dist/scripts/seed.js $SEED_ARGS
  else
    bun run /usr/src/app/apps/server/dist/scripts/seed.js
  fi

  [ -n "${SEED_TMP:-}" ] && rm -rf "${SEED_TMP}"
  echo "✅ Seeding completed"
fi

# Inject frontend runtime config when serving the SPA from this container
if [ "${SERVE_FRONTEND:-false}" = "true" ]; then
  ORG_SLUG="${DEFAULT_ORGANIZATION_SLUG:-${SEED_ORG_SLUG:-}}"
  SERVER_URL="${SERVER_PUBLIC_URL:-${BETTER_AUTH_URL:-}}"
  cat > /usr/src/app/apps/server/public/runtime-config.js << EOF
window.__APP_CONFIG__ = {"serverUrl":"${SERVER_URL}","defaultOrganizationSlug":"${ORG_SLUG}"};
EOF
  echo "✅ Frontend runtime config written (serverUrl: ${SERVER_URL}, org: ${ORG_SLUG})"
fi

echo "🚀 Starting server..."
exec bun run --filter server start
