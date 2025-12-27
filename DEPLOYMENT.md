# Deployment Guide

This guide covers different deployment scenarios using Docker Compose.

## Docker Compose Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `docker-compose.yml` | Development - builds images locally | Local development and testing |
| `docker-compose.seed.yml` | Development seeding override | First-time local setup with seed data |
| `deployments/docker/docker-compose.prod.yml` | Production - pulls from GHCR | Production deployment with pre-built images |
| `deployments/docker/docker-compose.prod.seed.yml` | Production seeding override | First-time production setup with seed data |
| `deployments/docker/.env.example` | Template for prod env vars | Copy to `.env` inside `deployments/docker/` |

> 💡 **Sharing deployment bundle**  
> Everything needed for ops lives in `deployments/docker/`. Zip that folder (plus your `.env`) and ship it to the infrastructure team without exposing the entire repo.

## Development Deployment

### Build and Run Locally

```bash
# Build and run all services
docker compose up --build

# Run in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### First-Time Setup with Seeding

```bash
# 1. Prepare seed files locally
bun run --filter server seed:scaffold
# Edit files in apps/server/seed/local/

# 2. Build and run with seeding enabled
docker compose -f docker-compose.yml -f docker-compose.seed.yml up --build

# 3. Subsequent runs (without seeding)
docker compose up
```

## Production Deployment

### Prerequisites

1. **Push images to GitHub Container Registry**:

```bash
# Build images
docker compose build

# Tag images (if needed)
docker tag grades-manager-api-server:latest ghcr.io/yvan2xero/grades-manager-server:latest
docker tag grades-manager-api-web:latest ghcr.io/yvan2xero/grades-manager-web:latest

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push images
docker push ghcr.io/yvan2xero/grades-manager-server:latest
docker push ghcr.io/yvan2xero/grades-manager-web:latest
```

2. **Set up environment variables**:

   ```bash
   cp -r deployments/docker ~/grades-deployment
   cd ~/grades-deployment
   cp .env.example .env
   # Edit .env with production secrets/URLs
   ```

### Standard Production Deployment

```bash
cd deployments/docker

# Pull and run pre-built images
docker compose --env-file .env -f docker-compose.prod.yml up -d

# Check logs
docker compose --env-file .env -f docker-compose.prod.yml logs -f

# Stop services
docker compose --env-file .env -f docker-compose.prod.yml down
```

### First-Time Production Deployment with Seeding

```bash
# 1. Prepare production seed files
mkdir -p deployments/docker/production-seeds
# Add your YAML files inside this folder (00-foundation.yaml, 10-academics.yaml, 20-users.yaml)
# They will be mounted into /usr/src/app/seed/local inside the container.

# 2. Deploy with seeding enabled (FIRST TIME ONLY)
docker compose --env-file .env \
  -f docker-compose.prod.yml \
  -f docker-compose.prod.seed.yml up -d

# 3. Verify seeding completed
docker compose --env-file .env \
  -f docker-compose.prod.yml logs server | grep "Seeding completed"

# 4. For subsequent deployments, use standard deployment (no seeding)
docker compose --env-file .env -f docker-compose.prod.yml up -d
```

## Database Migrations

Migrations run automatically on container startup. To generate new migrations:

```bash
# On your development machine
bun run --filter server db:generate

# Commit migrations to git
git add apps/server/src/db/migrations/
git commit -m "chore: add database migrations"

# Rebuild and push new images
docker compose build server
docker push ghcr.io/yvan2xero/grades-manager-server:latest

# Deploy - migrations will run automatically
cd deployments/docker
docker compose --env-file .env -f docker-compose.prod.yml pull
docker compose --env-file .env -f docker-compose.prod.yml up -d
```

## Environment-Specific Configurations

### Using Custom Environment Files

```bash
# Development
docker compose --env-file .env.dev up

# Staging / Production (run from deployments/docker)
cd deployments/docker
docker compose -f docker-compose.prod.yml --env-file .env.staging up -d
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Override Configurations

Create `docker-compose.override.yml` for local customization (not tracked in git):

```yaml
services:
  server:
    environment:
      DEBUG: "true"
    ports:
      - "3001:3000"  # Different port
```

## Common Operations

### Update to Latest Images

```bash
cd deployments/docker
docker compose --env-file .env -f docker-compose.prod.yml pull
docker compose --env-file .env -f docker-compose.prod.yml up -d
```

### Backup Database

```bash
# Backup
cd deployments/docker
docker compose --env-file .env -f docker-compose.prod.yml exec postgres \
  pg_dump -U ${POSTGRES_USER:-grades} ${POSTGRES_DB:-grades} > backup.sql

# Restore
cat backup.sql | docker compose --env-file .env -f docker-compose.prod.yml exec -T postgres \
  psql -U ${POSTGRES_USER:-grades} ${POSTGRES_DB:-grades}
```

### View Container Status

```bash
# List running containers
cd deployments/docker
docker compose --env-file .env -f docker-compose.prod.yml ps

# View resource usage
docker compose --env-file .env -f docker-compose.prod.yml stats
```

### Access Container Shell

```bash
# Server container
cd deployments/docker
docker compose --env-file .env -f docker-compose.prod.yml exec server sh

# Database container
docker compose --env-file .env -f docker-compose.prod.yml exec postgres psql -U ${POSTGRES_USER:-grades}
```

## Troubleshooting

### Container fails to start

```bash
# Check logs
cd deployments/docker
docker compose --env-file .env -f docker-compose.prod.yml logs server

# Inspect container
docker compose --env-file .env -f docker-compose.prod.yml ps
docker inspect <container-id>
```

### Database connection issues

```bash
# Verify database is healthy
cd deployments/docker
docker compose --env-file .env -f docker-compose.prod.yml exec postgres \
  pg_isready -U ${POSTGRES_USER:-grades}

# Check connection from server
docker compose --env-file .env -f docker-compose.prod.yml exec server \
  sh -c 'echo "SELECT 1" | psql $DATABASE_URL'
```

### Reset everything (CAUTION: Deletes data)

```bash
# Stop and remove containers, networks, volumes
cd deployments/docker
docker compose --env-file .env -f docker-compose.prod.yml down -v

# Remove images
docker rmi ghcr.io/yvan2xero/grades-manager-server:latest
docker rmi ghcr.io/yvan2xero/grades-manager-web:latest
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: docker compose build

      - name: Login to GHCR
        run: echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin

      - name: Push images
        run: |
          docker push ghcr.io/yvan2xero/grades-manager-server:latest
          docker push ghcr.io/yvan2xero/grades-manager-web:latest

      - name: Deploy to server
        run: |
          # SSH to your server and run:
          # cd deployments/docker
          # docker compose --env-file .env -f docker-compose.prod.yml pull
          # docker compose --env-file .env -f docker-compose.prod.yml up -d
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Restrict CORS origins** - Set specific domains, not wildcards
4. **Enable HTTPS** - Use reverse proxy (nginx, Traefik, Caddy)
5. **Regular backups** - Automate database backups
6. **Update images** - Regularly pull and deploy latest images
7. **Monitor logs** - Set up log aggregation and monitoring

## See Also

- [apps/server/DOCKER.md](apps/server/DOCKER.md) - Detailed Docker configuration for server
- [CLAUDE.md](CLAUDE.md) - Development commands and workflow
- [docker-compose.yml](docker-compose.yml) - Development compose file
- [deployments/docker/docker-compose.prod.yml](deployments/docker/docker-compose.prod.yml) - Production compose file
