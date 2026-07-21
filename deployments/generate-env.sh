#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="${SCRIPT_DIR}/.env.local"
SEEDS_DIR="${SCRIPT_DIR}/seeds"

if [[ -f "$OUT" ]]; then
  read -r -p ".env.local already exists. Overwrite? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }
fi

prompt() {
  local label="$1" default="${2:-}"
  if [[ -n "$default" ]]; then
    read -r -p "$label [$default]: " val
    echo "${val:-$default}"
  else
    local val=""
    while [[ -z "$val" ]]; do
      read -r -p "$label: " val
    done
    echo "$val"
  fi
}

prompt_optional() {
  local label="$1" default="${2:-}"
  read -r -p "$label${default:+ [$default]}: " val
  echo "${val:-$default}"
}

gen_secret() {
  openssl rand -base64 32 2>/dev/null || head -c 33 /dev/urandom | base64
}

gen_password() {
  openssl rand -base64 16 2>/dev/null | tr -d '+/=' | head -c 20 || \
    head -c 16 /dev/urandom | base64 | tr -d '+/='
}

prompt_secret() {
  local label="$1" default="${2:-}"
  if [[ -n "$default" ]]; then
    read -r -s -p "$label [$default]: " val; echo
    echo "${val:-$default}"
  else
    local val=""
    while [[ -z "$val" ]]; do
      read -r -s -p "$label: " val; echo
    done
    echo "$val"
  fi
}

prompt_secret_optional() {
  local label="$1"
  read -r -s -p "$label: " val; echo
  echo "$val"
}

echo ""
echo "=== TKAMS local .env generator ==="
echo ""

# ── Network ───────────────────────────────────────────────────────────────────
echo "--- Network ---"
APP_URL=$(prompt "Server URL visible from LAN" "http://192.168.1.10")
APP_PORT=$(prompt "Port" "80")
echo ""

# ── Image ─────────────────────────────────────────────────────────────────────
echo "--- Image ---"
IMAGE_TAG=$(prompt "Image tag" "latest")
echo ""

# ── Database ──────────────────────────────────────────────────────────────────
echo "--- Database ---"
POSTGRES_USER=$(prompt "Postgres user" "tkams")
POSTGRES_PASSWORD=$(prompt_secret "Postgres password" "$(gen_password)")
POSTGRES_DB=$(prompt "Postgres database" "tkams")
echo ""

# ── Auth ──────────────────────────────────────────────────────────────────────
echo "--- Auth ---"
BETTER_AUTH_SECRET=$(prompt_secret "Auth secret" "$(gen_secret)")
echo ""

# ── Institution ───────────────────────────────────────────────────────────────
echo "--- Institution ---"
DEFAULT_ORGANIZATION_SLUG=$(prompt "Default organization slug" "my-university")
echo ""

# ── Email ─────────────────────────────────────────────────────────────────────
echo "--- Email ---"
EMAIL_FROM=$(prompt "Sender address" "noreply@local.lan")
echo "  1) Resend (API key)"
echo "  2) SMTP"
echo "  3) None"
read -r -p "Email provider [1/2/3]: " email_choice

RESEND_API_KEY="" SMTP_HOST="" SMTP_PORT="587" SMTP_USER="" SMTP_PASS=""
case "${email_choice:-3}" in
  1) RESEND_API_KEY=$(prompt_secret "Resend API key") ;;
  2)
    SMTP_HOST=$(prompt "SMTP host")
    SMTP_PORT=$(prompt "SMTP port" "587")
    SMTP_USER=$(prompt_optional "SMTP user")
    SMTP_PASS=$(prompt_secret_optional "SMTP password")
    ;;
esac
echo ""

# ── Seed ──────────────────────────────────────────────────────────────────────
echo "--- Seed ---"
read -r -p "Seed initial data on first boot? [Y/n]: " seed_choice
RUN_SEED="false"
SEED_FOUNDATION="" SEED_ACADEMICS="" SEED_USERS=""
SEED_ORG_NAME="" SEED_ORG_SLUG="" SEED_ORG_TYPE="university"
SEED_ORG_COUNTRY="CM" SEED_ADMIN_NAME="" SEED_ADMIN_EMAIL="" SEED_ADMIN_PASSWORD=""

if [[ ! "$seed_choice" =~ ^[Nn]$ ]]; then
  RUN_SEED="true"
  echo ""
  echo "Seed mode:"
  echo "  1) YAML files  — place 00-foundation.yaml / 10-academics.yaml / 20-users.yaml in deployments/seeds/"
  echo "  2) Env vars    — generate a minimal seed from basic info"
  read -r -p "Mode [1/2]: " seed_mode

  case "${seed_mode:-2}" in
    1)
      echo ""
      echo "Place your YAML files in: ${SEEDS_DIR}/"
      echo "Expected names: 00-foundation.yaml, 10-academics.yaml, 20-users.yaml"
      echo "(missing files are skipped silently)"
      SEED_FOUNDATION="/seeds/00-foundation.yaml"
      SEED_ACADEMICS="/seeds/10-academics.yaml"
      SEED_USERS="/seeds/20-users.yaml"
      ;;
    *)
      echo ""
      SEED_ORG_NAME=$(prompt "Institution name")
      SEED_ORG_SLUG=$(prompt "Institution slug" "${DEFAULT_ORGANIZATION_SLUG}")
      SEED_ORG_TYPE=$(prompt "Type (university/school/institute/secondary/other)" "university")
      SEED_ORG_COUNTRY=$(prompt "Country code" "CM")
      echo "Admin account:"
      SEED_ADMIN_NAME=$(prompt "Admin full name")
      SEED_ADMIN_EMAIL=$(prompt "Admin email")
      SEED_ADMIN_PASSWORD=$(prompt_secret "Admin password" "$(gen_password)")
      ;;
  esac
fi
echo ""

# ── Write ─────────────────────────────────────────────────────────────────────
cat > "$OUT" <<EOF
APP_URL=${APP_URL}
APP_PORT=${APP_PORT}

IMAGE_TAG=${IMAGE_TAG}

POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}

BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}

DEFAULT_ORGANIZATION_SLUG=${DEFAULT_ORGANIZATION_SLUG}

EMAIL_FROM=${EMAIL_FROM}
RESEND_API_KEY=${RESEND_API_KEY}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

RUN_SEED=${RUN_SEED}
SEED_FOUNDATION=${SEED_FOUNDATION}
SEED_ACADEMICS=${SEED_ACADEMICS}
SEED_USERS=${SEED_USERS}
SEED_ORG_NAME=${SEED_ORG_NAME}
SEED_ORG_SLUG=${SEED_ORG_SLUG}
SEED_ORG_TYPE=${SEED_ORG_TYPE}
SEED_ORG_COUNTRY=${SEED_ORG_COUNTRY}
SEED_ADMIN_NAME=${SEED_ADMIN_NAME}
SEED_ADMIN_EMAIL=${SEED_ADMIN_EMAIL}
SEED_ADMIN_PASSWORD=${SEED_ADMIN_PASSWORD}
EOF

echo "Written to ${OUT}"
echo ""
echo "Start:"
echo "  docker compose -f ${SCRIPT_DIR}/docker-compose.full.local.yml --env-file ${OUT} up -d"
