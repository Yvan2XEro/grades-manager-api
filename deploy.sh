#!/bin/bash
set -e

# Deployment script for grades-manager-api

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Parse arguments
MODE=${1:-dev}
ACTION=${2:-up}

case $MODE in
    dev)
        COMPOSE_FILES="-f docker-compose.yml"
        ;;
    dev-seed)
        COMPOSE_FILES="-f docker-compose.yml -f docker-compose.seed.yml"
        ;;
    prod)
        COMPOSE_FILES="-f docker-compose.prod.yml"
        ;;
    prod-seed)
        COMPOSE_FILES="-f docker-compose.prod.yml -f docker-compose.prod.seed.yml"
        ;;
    *)
        error "Invalid mode: $MODE. Use: dev, dev-seed, prod, or prod-seed"
        ;;
esac

# Check .env file
if [ ! -f .env ] && [ "$MODE" = "prod" ] || [ "$MODE" = "prod-seed" ]; then
    warn "No .env file found. Copy .env.example to .env and configure it."
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Execute action
case $ACTION in
    up)
        info "Starting services in $MODE mode..."
        if [ "$MODE" = "dev" ] || [ "$MODE" = "dev-seed" ]; then
            docker compose $COMPOSE_FILES up --build -d
        else
            docker compose $COMPOSE_FILES pull
            docker compose $COMPOSE_FILES up -d
        fi
        info "Services started successfully!"
        info "View logs: docker compose $COMPOSE_FILES logs -f"
        ;;
    down)
        info "Stopping services..."
        docker compose $COMPOSE_FILES down
        info "Services stopped!"
        ;;
    logs)
        docker compose $COMPOSE_FILES logs -f
        ;;
    ps)
        docker compose $COMPOSE_FILES ps
        ;;
    restart)
        info "Restarting services..."
        docker compose $COMPOSE_FILES restart
        info "Services restarted!"
        ;;
    pull)
        if [ "$MODE" = "prod" ] || [ "$MODE" = "prod-seed" ]; then
            info "Pulling latest images..."
            docker compose $COMPOSE_FILES pull
            info "Images pulled successfully!"
        else
            warn "Pull is only available in production mode"
        fi
        ;;
    build)
        if [ "$MODE" = "dev" ] || [ "$MODE" = "dev-seed" ]; then
            info "Building images..."
            docker compose $COMPOSE_FILES build
            info "Build complete!"
        else
            warn "Build is only available in development mode"
        fi
        ;;
    *)
        error "Invalid action: $ACTION. Use: up, down, logs, ps, restart, pull, or build"
        ;;
esac
