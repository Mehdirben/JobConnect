# Deploying JobConnect on Dokploy

This guide explains how to deploy the JobConnect ATS platform on [Dokploy](https://dokploy.com/), a self-hostable PaaS, using **Cloudflare Tunnels** for secure public access.

## ⚠️ Common Pitfalls (Read First!)

| Issue | Solution |
| ------------------------------ | ----------------------------------------------------------------------------- |
| **Bad Gateway / 504** | Verify correct port: Backend = `5000`, Frontend = `80` |
| **Frontend can't reach API** | Set `API_URL` env var correctly, then **Rebuild** |
| **Database connection failed** | Verify connection string and enable Predefined Network on all services |
| **Changes not taking effect** | Use **Rebuild** not just Redeploy (Docker caches images) |
| **CORS errors (status 0)** | Usually means Traefik can't route to the container — check networking |
| **CORS header mismatch** | Add frontend domain to `CORS_ORIGINS` env var (no trailing slash!) |

## Prerequisites

- A server with Dokploy installed ([Installation Guide](https://docs.dokploy.com/get-started/introduction))
- A Cloudflare account with your domain configured
- A Cloudflare Tunnel set up on your server
- Git repository access (GitHub, GitLab, or Bitbucket)

---

## Architecture Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                           Internet                                   │
│                                                                      │
│  Browser ──► Cloudflare Tunnel ──► dokploy-traefik:80 (Traefik)     │
│                                         │                            │
│                          ┌──────────────┴──────────────┐             │
│                          │                             │             │
│                          ▼                             ▼             │
│                    ┌───────────┐               ┌────────────┐        │
│                    │  Frontend │               │   Backend  │        │
│                    │ (Angular) │               │  (.NET 9)  │        │
│                    │   :80     │               │   :5000    │        │
│                    └───────────┘               └─────┬──────┘        │
│                                                      │               │
│                                                      ▼               │
│                                                ┌───────────┐         │
│                                                │ PostgreSQL│         │
│                                                │   :5432   │         │
│                                                └───────────┘         │
└──────────────────────────────────────────────────────────────────────┘
```

### Domain Routing

| Domain | Service | Port |
| ------------------------------ | -------------------- | ---- |
| `jobconnect.codecy.de` | Frontend (Angular) | 80 |
| `api.jobconnect.codecy.de` | Backend (.NET API) | 5000 |
| `panel.codecy.de` | Dokploy Dashboard | 3000 |

---

## Cloudflare Tunnel Setup

The Cloudflare Tunnel provides secure access without opening ports on your server.

### Step 1: Create a Tunnel

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels**
2. Click **Create a tunnel** → **Cloudflared** → Name it (e.g., `dokploy-server`)
3. Install the connector on your server following Cloudflare's instructions

### Step 2: Configure Public Hostnames

Add a **wildcard** route to forward all traffic through Dokploy's Traefik:

| Public hostname | Service Type | URL |
| --------------- | ------------ | ------------------------ |
| `*.codecy.de` | HTTP | `dokploy-traefik:80` |

> **Note**: The wildcard route lets Traefik handle hostname-based routing. Dokploy automatically configures Traefik labels when you add domains to your services.

### Step 3: Cloudflare DNS

Ensure your domain has a CNAME record pointing to the tunnel:

| Type | Name | Content | Proxy |
| ----- | ---- | ---------------------------------- | ---------- |
| CNAME | `*` | `<tunnel-id>.cfargotunnel.com` | Proxied ☁️ |

---

## Deployment Option A: Individual Services (Recommended)

This is the **recommended** approach — Dokploy handles all networking and Traefik routing automatically.

### Step 1: Deploy PostgreSQL Database

1. In Dokploy, go to your **Project**
2. Click **+ Create Service** → **Database** → **PostgreSQL**
3. Configure:
   - **Name**: `jobconnect-db`
   - **Version**: `16`
   - **Database Name**: `jobconnect`
4. Deploy and note the connection credentials
5. **Enable "Predefined Network"** in Settings

### Step 2: Deploy Backend (.NET API)

1. **+ Create Service** → **Application**
2. Connect your Git repository
3. Configure:
   - **Branch**: `main`
   - **Build Pack**: Dockerfile
   - **Dockerfile Path**: `JobConnect.API/Dockerfile`
   - **Base Directory**: `JobConnect.API`
4. **Domains** tab → Add domain:
   - **Host**: `api.jobconnect.codecy.de`
   - **Port**: `5000`
   - **HTTPS**: Disabled (Cloudflare handles SSL)
   - **Behind Cloudflare**: Enabled
5. **Enable "Predefined Network"** in Settings

#### Backend Environment Variables

| Variable | Example | Required |
| ----------------------------------------- | ---------------------------------------------------------- | -------- |
| `ASPNETCORE_ENVIRONMENT` | `Production` | Yes |
| `ASPNETCORE_URLS` | `http://+:5000` | Yes |
| `ConnectionStrings__DefaultConnection` | `Host=<db-container>;Database=jobconnect;Username=...` | Yes |
| `JwtSettings__Secret` | Secure random string (32+ chars) | Yes |
| `JwtSettings__Issuer` | `JobConnect` | Yes |
| `JwtSettings__Audience` | `JobConnectUsers` | Yes |
| `JwtSettings__ExpiryMinutes` | `60` | Yes |
| `CorsOrigins` | `https://jobconnect.codecy.de` | Yes |
| `AdminSettings__Email` | `admin@jobconnect.com` | No |
| `AdminSettings__Password` | `Admin123!` | No |
| `SEED_DATABASE` | `true` or `false` | No |
| `FORCE_SEED` | `true` or `false` | No |
| `HMS_ACCESS_KEY` | (from 100ms dashboard) | No |
| `HMS_SECRET` | (from 100ms dashboard) | No |
| `HMS_TEMPLATE_ID` | (from 100ms dashboard) | No |

> **Important**: The `ConnectionStrings__DefaultConnection` host should be the **PostgreSQL container name** from Dokploy (visible in the database service settings).

### Step 3: Deploy Frontend (Angular)

1. **+ Create Service** → **Application**
2. Connect your Git repository
3. Configure:
   - **Branch**: `main`
   - **Build Pack**: Dockerfile
   - **Dockerfile Path**: `jobconnect-frontend/Dockerfile.prod`
   - **Base Directory**: `jobconnect-frontend`
4. **Domains** tab → Add domain:
   - **Host**: `jobconnect.codecy.de`
   - **Port**: `80`
   - **HTTPS**: Disabled
   - **Behind Cloudflare**: Enabled
5. **Enable "Predefined Network"** in Settings

#### Frontend Environment Variables

| Variable | Example | Required |
| -------- | ------------------------------------ | -------- |
| `API_URL` | `https://api.jobconnect.codecy.de/api` | Yes |

> **Note**: The `docker-entrypoint.sh` generates `/assets/config.json` from `API_URL` at container startup — no rebuild needed when changing the API URL.

---

## Deployment Option B: Docker Compose

Deploy the entire stack as a single Compose application. This requires connecting containers to Dokploy's Traefik network.

### Step 1: Deploy Compose App

1. In Dokploy, **+ Create Service** → **Compose**
2. Connect your Git repository and set the compose file path
3. Deploy

### Step 2: Configure Domains

In the Compose app's **Domains** tab, add:

| Service | Domain | Port |
| ---------- | ------------------------------- | ---- |
| `api` | `api.jobconnect.codecy.de` | 5000 |
| `frontend` | `jobconnect.codecy.de` | 80 |

Both domains: HTTPS disabled, Behind Cloudflare enabled.

### Step 3: Network Configuration

The `docker-compose.yml` must connect services to the `dokploy-network` so Traefik can route to them:

```yaml
networks:
  jobconnect-network:
    driver: bridge
  dokploy-network:
    external: true

services:
  postgres:
    networks:
      - jobconnect-network
      - dokploy-network
  api:
    networks:
      - jobconnect-network
      - dokploy-network
  frontend:
    networks:
      - jobconnect-network
      - dokploy-network
```

> **Why both networks?** `jobconnect-network` for inter-service communication (API → DB), `dokploy-network` so Traefik can reach the containers to route external traffic.

### Environment Variables

Set these in the Compose app's **Environment** tab or in your `.env` file:

| Variable | Example |
| ----------------------------- | ------------------------------------------------------- |
| `POSTGRES_DB` | `jobconnect` |
| `POSTGRES_USER` | `jobconnect` |
| `POSTGRES_PASSWORD` | (secure string) |
| `JWT_SECRET` | (secure string, 32+ chars) |
| `CORS_ORIGINS` | `https://jobconnect.codecy.de` |
| `API_URL` | `https://api.jobconnect.codecy.de/api` |
| `AdminSettings__Email` | `admin@jobconnect.com` |
| `AdminSettings__Password` | `Admin123!` |
| `SEED_DATABASE` | `true` or `false` |
| `FORCE_SEED` | `true` or `false` |

---

## Database Seeding

The backend includes a data seeder for demo/testing:

1. Set `SEED_DATABASE=true` in environment
2. Deploy/rebuild the backend
3. After seeding completes, set `SEED_DATABASE=false` to prevent re-seeding on restart

The seeder creates **10 companies**, **50+ jobs**, **32 candidates**, and **100+ applications**.

> **Note**: Use `FORCE_SEED=true` to seed even if data exists. The seeder checks for existing emails to avoid duplicates.

---

## Database Migrations

EF Core migrations run automatically on startup. For manual migration:

```bash
docker exec -it <backend-container> sh
dotnet ef database update
```

---

## Deployment Checklist

- [ ] Cloudflare Tunnel running with wildcard route to `dokploy-traefik:80`
- [ ] PostgreSQL deployed and running
- [ ] Backend deployed with:
  - [ ] Domain: `api.jobconnect.codecy.de`, Port: `5000`, Behind Cloudflare
  - [ ] All required env vars set (connection string, JWT, CORS)
  - [ ] Predefined Network enabled (or `dokploy-network` in compose)
- [ ] Frontend deployed with:
  - [ ] Domain: `jobconnect.codecy.de`, Port: `80`, Behind Cloudflare
  - [ ] `API_URL` set correctly
  - [ ] Predefined Network enabled (or `dokploy-network` in compose)
- [ ] Verify:
  - [ ] `https://api.jobconnect.codecy.de/api/health` returns healthy
  - [ ] Frontend loads at `https://jobconnect.codecy.de`
  - [ ] Can register, login, and use the application

---

## Troubleshooting

### 504 Gateway Timeout / CORS Status 0

This means Traefik can't reach the container:

1. **Check container is running**: `docker ps | grep jobconnect`
2. **Check networking**: Container must be on the same network as Traefik
   - Individual services: Enable **Predefined Network**
   - Compose: Add `dokploy-network` (external) to services
3. **Check port**: Backend must expose `5000`, Frontend must expose `80`
4. **Check Traefik routing**: `docker logs dokploy-traefik --tail 50 2>&1 | grep jobconnect`

### CORS Header Mismatch

If you see `No 'Access-Control-Allow-Origin' header`:

1. Add your frontend domain to `CORS_ORIGINS` (no trailing slash)
2. Example: `CORS_ORIGINS=https://jobconnect.codecy.de`
3. Rebuild the backend

### Backend Can't Connect to Database

1. Verify both services are on the same network
2. Check the container name used in `ConnectionStrings__DefaultConnection`
3. Run: `docker exec <backend> curl -v telnet://<db-host>:5432`

### Frontend API Errors

1. Check `API_URL` is set correctly (must include `/api`)
2. **Rebuild** after changing env vars (not just Redeploy)
3. Verify backend is healthy: `curl https://api.jobconnect.codecy.de/api/health`

### Changes Not Taking Effect

Dokploy caches Docker images. Use **Rebuild** instead of Redeploy, or enable **Force Rebuild** in settings.

---

## Useful Commands

```bash
# Check service logs
docker logs <container-name> --tail 100

# Check API health
curl https://api.jobconnect.codecy.de/api/health

# Access PostgreSQL shell
docker exec -it <postgres-container> psql -U jobconnect -d jobconnect

# Check Traefik routing
docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers 2>/dev/null | python3 -m json.tool

# Restart a service
docker restart <container-name>
```

---

## Security Recommendations

1. **Strong passwords**: Use Dokploy's generated passwords where possible
2. **SSL**: Cloudflare handles SSL — keep "Behind Cloudflare" enabled and HTTPS disabled on Traefik
3. **CORS**: Only allow your frontend domain in `CorsOrigins`
4. **Backups**: Enable automatic PostgreSQL backups in Dokploy
5. **JWT Secret**: Use a cryptographically secure random string (32+ chars)
6. **Disable seeding**: Set `SEED_DATABASE=false` after initial setup

---

## Support

- [Dokploy Documentation](https://docs.dokploy.com/)
- [Cloudflare Tunnels Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)
- [Angular Documentation](https://angular.dev/docs)
