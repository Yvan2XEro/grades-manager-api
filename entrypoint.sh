#!/bin/sh
set -e

if [ "$RUN_SEED" = "true" ]; then
  SEED_ARGS=""
  [ -n "$SEED_FOUNDATION_URL" ] && curl -fsSL "$SEED_FOUNDATION_URL" -o /tmp/seed-foundation.yaml && SEED_ARGS="$SEED_ARGS --foundation /tmp/seed-foundation.yaml"
  [ -n "$SEED_ACADEMICS_URL" ]  && curl -fsSL "$SEED_ACADEMICS_URL"  -o /tmp/seed-academics.yaml  && SEED_ARGS="$SEED_ARGS --academics /tmp/seed-academics.yaml"
  [ -n "$SEED_USERS_URL" ]      && curl -fsSL "$SEED_USERS_URL"      -o /tmp/seed-users.yaml      && SEED_ARGS="$SEED_ARGS --users /tmp/seed-users.yaml"
  cd apps/server && bun run src/scripts/seed.ts $SEED_ARGS && cd ../..
fi

exec bun run start:server
