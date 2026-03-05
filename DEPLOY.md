# VortexAPI — Deployment to Proxmox Homelab

## Overview

Deploy VortexAPI to CT 6000 (lab-apps) on Proxmox, exposed via Cloudflare tunnel at `vltc-app.vortexloop.com`.

```
GitHub (main branch)
  │  push triggers GitHub Actions
  ▼
Portainer API (portainer.syzygyonline.com)
  │  redeploy stack → rebuild container
  ▼
CT 6000 (192.168.86.27)
  │  Docker container on port 3090
  ▼
Cloudflare Tunnel (CT 4000)
  │  vltc-app.vortexloop.com → http://192.168.86.27:3090
  ▼
Public internet
```

## Prerequisites

- GitHub repo: `https://github.com/devkurtc/vortex-api` (or your chosen org/name)
- Portainer running on CT 6000 at `https://portainer.syzygyonline.com`
- Cloudflare access to `vortexloop.com` DNS
- Cloudflare tunnel `syzygy` running on CT 4000

---

## Step 1 — Push to GitHub

The vortex-api app needs its own repo (it's currently nested in KCS-WORKSPACE).

```bash
cd spaces/vortexloop/projects/api-tool/vortex-api

# Init repo and push
git init
git add .
git commit -m "Initial commit: VortexAPI — VLTC Lighting Manager"
git remote add origin git@github.com:devkurtc/vortex-api.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create Portainer Stack

**Option A: Via Portainer UI**

1. Go to https://portainer.syzygyonline.com
2. Stacks → Add Stack
3. Name: `vortex-api`
4. Build method: **Git Repository**
   - Repository URL: `https://github.com/devkurtc/vortex-api`
   - Reference: `refs/heads/main`
   - Compose path: `docker-compose.yml`
5. Deploy the stack

**Option B: Via Portainer API (CLI)**

```bash
# Authenticate
TOKEN=$(curl -sk -X POST "https://portainer.syzygyonline.com/api/auth" \
  -H "Content-Type: application/json" \
  -d '{"Username":"admin","Password":"YOUR_PASSWORD"}' | jq -r .jwt)

# Create stack from git repo
curl -sk -X POST "https://portainer.syzygyonline.com/api/stacks/create/standalone/repository?endpointId=3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vortex-api",
    "repositoryURL": "https://github.com/devkurtc/vortex-api",
    "repositoryReferenceName": "refs/heads/main",
    "composeFile": "docker-compose.yml",
    "autoUpdate": null
  }'
```

After creation, note the **Stack ID** (e.g., `30`) and **Endpoint ID** (`3`) — needed for GitHub Actions.

---

## Step 3 — Configure Cloudflare DNS + Tunnel

### 3a. Add DNS Record (vortexloop.com)

In Cloudflare Dashboard → `vortexloop.com` → DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `vltc-app` | `<tunnel-id>.cfargotunnel.com` | Proxied (orange cloud) |

The tunnel ID is the same `syzygy` tunnel: `7cb14109-62a7-48fd-b15b-f5135110c47a`

So the CNAME target is: `7cb14109-62a7-48fd-b15b-f5135110c47a.cfargotunnel.com`

> **Note:** If `vortexloop.com` is on a different Cloudflare account than `syzygyonline.com`, you'll need to add the tunnel route via the Cloudflare Zero Trust dashboard or the cloudflared config instead of CNAME.

### 3b. Add Tunnel Route

**Option 1 — Via Cloudflare Zero Trust Dashboard:**

1. Zero Trust → Networks → Tunnels → `syzygy` → Configure
2. Public Hostname → Add a public hostname:
   - Subdomain: `vltc-app`
   - Domain: `vortexloop.com`
   - Service: `http://192.168.86.27:3090`

**Option 2 — Via cloudflared config (CT 4000):**

SSH into CT 4000 and edit the tunnel config to add:

```yaml
- hostname: vltc-app.vortexloop.com
  service: http://192.168.86.27:3090
```

Then restart cloudflared.

---

## Step 4 — GitHub Actions Secrets

In the GitHub repo → Settings → Secrets and variables → Actions, add:

| Secret | Value |
|--------|-------|
| `PORTAINER_URL` | `https://portainer.syzygyonline.com` |
| `PORTAINER_USER` | `admin` |
| `PORTAINER_PASSWORD` | *(from CREDENTIALS.md)* |
| `PORTAINER_STACK_ID` | *(from Step 2, e.g., `30`)* |
| `PORTAINER_ENDPOINT_ID` | `3` |

---

## Step 5 — Verify

1. **Container running:**
   ```bash
   # Via Portainer UI or:
   curl -s https://portainer.syzygyonline.com/api/stacks -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.Name=="vortex-api")'
   ```

2. **App accessible:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://vltc-app.vortexloop.com/login
   # Should return 200
   ```

3. **Auto-deploy working:**
   - Make a small change, push to `main`
   - Check GitHub Actions tab for the deploy workflow
   - Verify the change appears at `https://vltc-app.vortexloop.com`

---

## Architecture Summary

```
vltc-app.vortexloop.com
  → Cloudflare Tunnel (syzygy, CT 4000)
  → http://192.168.86.27:3090
  → Docker container "vortex-api" (CT 6000)
  → Next.js standalone server on port 3000

SQLite audit DB persisted in Docker volume: vortex-api-data → /app/data/audit.db
```

## Port Allocation

| Port | Service | Status |
|------|---------|--------|
| 3090 | VortexAPI | New |

(Avoids conflicts with Grafana on 3000, Uptime Kuma on 3001, XG3 on 3080)

---

## Rollback

To roll back to a previous version:

```bash
# Via Portainer UI: Stacks → vortex-api → Editor → change git ref to a specific commit SHA
# Or redeploy from a previous Docker image layer
```

## SQLite Data

The audit database is stored in a Docker volume (`vortex-api-data`). To back up:

```bash
docker cp vortex-api:/app/data/audit.db ./audit-backup.db
```

To restore:

```bash
docker cp ./audit-backup.db vortex-api:/app/data/audit.db
docker restart vortex-api
```
