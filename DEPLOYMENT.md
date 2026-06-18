# Deployment Guide

This guide covers deploying the TKAMS portal (`apps/website`) to production using Docker Compose on a Dokploy-managed server.

---

## Prerequisites

### 1. DNS Records (Namecheap)

Go to **Namecheap → Domain List → Manage → Advanced DNS**.

**First, delete the default records:**
- Delete the `www` CNAME pointing to `parkingpage.namecheap.com`
- Delete the `@` URL Redirect pointing to `http://www.tkams.com/` — Namecheap's URL Redirect is an HTTP-only proxy through their servers; it does not work with HTTPS or custom TLS

**Then add these 3 A records:**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `<server-ip>` | Automatic |
| A Record | `www` | `<server-ip>` | Automatic |
| A Record | `*` | `<server-ip>` | Automatic |

The wildcard `*` covers all client subdomains (`client1.tkams.com`, etc.) without any per-client DNS change.

> **Namecheap constraint**: the apex domain (`@`) cannot use a CNAME record (DNS spec restriction). Only A or AAAA records are valid on `@`.

> DNS propagation can take up to 48 hours. Verify with `dig tkams.com A` and `dig *.tkams.com A` before deploying.

### 2. Dokploy Server

- Dokploy installed and accessible at `https://deploy.tkams.com` (or your chosen host)
- Traefik running and managing SSL — Dokploy sets this up automatically on install
- The `dokploy-network` Docker network exists (Dokploy creates it on first run)

Verify:
```bash
docker network ls | grep dokploy-network
```

### 3. SSL / Let's Encrypt

Traefik (via Dokploy) handles certificate issuance automatically. Requirements:
- Ports **80** and **443** must be open on the server firewall
- DNS must resolve to the server **before** the first deploy (Let's Encrypt performs an HTTP-01 challenge)

### 4. GitHub Container Registry (GHCR)

The client instance image (`ghcr.io/yvan2xero/tkams`) is pulled by Dokploy when provisioning instances. If the GitHub repository is private, add registry credentials in Dokploy:

**Dokploy UI → Settings → Registries → Add Registry**
- Registry URL: `ghcr.io`
- Username: `yvan2xero`
- Password: GitHub Personal Access Token with `read:packages` scope

The portal itself (`apps/website`) is built directly from source on the server — no registry needed.

### 5. MongoDB

The portal uses MongoDB managed by the `mongo` service in `docker-compose.yml`. No external setup required — it runs as a sidecar container with a persistent volume.

For production resilience, you may replace it with MongoDB Atlas:
1. Create a free cluster at mongodb.com/atlas
2. Whitelist the server IP (or `0.0.0.0/0` with strong auth)
3. Set `DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/tkams-website` in `.env`
4. Remove the `mongo` service and `internal` network from `docker-compose.yml`

---

## First Deploy

### Step 1 — Clone the repository

```bash
git clone https://github.com/yvan2xero/sgn-grades-manager-api.git /opt/tkams
cd /opt/tkams
```

### Step 2 — Configure environment

```bash
cp .env.website .env
```

Edit `.env` and fill in all required values (see [Environment Variables](#environment-variables) below).

### Step 3 — Build and start

```bash
docker compose up -d --build
```

The first build takes 3–5 minutes (Next.js compilation). Subsequent updates are faster due to Docker layer caching.

### Step 4 — Verify

```bash
# Check containers are running
docker compose ps

# Check website logs
docker compose logs -f website

# Test HTTP response
curl -I https://tkams.com
```

---

## Environment Variables

Copy `.env.website` to `.env` and fill in:

| Variable | Description | How to get |
|----------|-------------|------------|
| `PAYLOAD_SECRET` | Payload CMS encryption key — min 32 chars | `openssl rand -base64 32` |
| `DOKPLOY_URL` | Your Dokploy instance URL | e.g. `https://deploy.tkams.com` |
| `DOKPLOY_API_KEY` | Dokploy API key | Dokploy UI → Settings → API Keys |
| `DOKPLOY_APP_IMAGE` | Image used when provisioning client instances | `ghcr.io/yvan2xero/tkams:latest` |
| `NOTCHPAY_PUBLIC_KEY` | NotchPay public key | NotchPay dashboard |
| `NOTCHPAY_HASH_KEY` | NotchPay webhook hash key | NotchPay dashboard |

`DATABASE_URL`, `NEXT_PUBLIC_SERVER_URL`, `WEBSITE_URL`, `TKAMS_BASE_DOMAIN`, and `NEXT_PUBLIC_TKAMS_BASE_DOMAIN` are hardcoded in `docker-compose.yml` — they are the same in every production environment.

---

## Updates

```bash
cd /opt/tkams
git pull
docker compose up -d --build
```

Docker caches unchanged layers, so only modified files trigger a full rebuild. A typical update with no dependency changes takes ~2 minutes.

---

## Client Instance Provisioning

When a customer subscribes, the portal provisions a new instance automatically via the Dokploy API. Each instance:

- Gets its own subdomain: `<slug>.tkams.com`
- Runs the `ghcr.io/yvan2xero/tkams` image (server + frontend combined)
- Has its own PostgreSQL database managed by Dokploy
- Gets a Let's Encrypt certificate automatically via Traefik

The wildcard DNS record (`* A <server-ip>`) is what makes per-instance subdomains work without any additional DNS configuration per customer.

---

## Troubleshooting

**SSL certificate not issued**
- Confirm DNS resolves to the server: `dig tkams.com`
- Confirm ports 80 and 443 are open: `curl http://tkams.com`
- Check Traefik logs: `docker logs traefik`

**Website unreachable after deploy**
- Confirm `dokploy-network` exists: `docker network ls`
- Check container status: `docker compose ps`
- Check logs: `docker compose logs website`

**MongoDB connection error on startup**
- Check the mongo container is healthy: `docker compose ps mongo`
- Restart it: `docker compose restart mongo`
- Inspect data volume: `docker volume ls | grep mongo`
