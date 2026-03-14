# CLAUDE.md — OpenClaw Instagram Views Monitor (Full-Stack Dockerized)

## Project Overview
Build a fully containerized full-stack application that runs OpenClaw.ai as the
agent gateway, monitors Instagram accounts, tracks posts with the highest
views/plays, persists data to PostgreSQL, and displays everything in a modern
Next.js dashboard. Instagram data is collected exclusively via Playwright headless
Chromium browser using user-supplied session cookies (no Instagram Graph API).
The entire stack runs via Docker Compose (openclaw + agent + postgres + dashboard
+ cloudflared) and is deployable to any VPS with a single command.

---

## Tech Stack

### Agent Gateway
- **Platform**: OpenClaw.ai (self-hosted via Docker)
- **Image**: `ghcr.io/openclaw/openclaw:latest`
- **Purpose**: AI agent gateway, cron trigger, channel integration

### Backend / Agent Worker
- **Runtime**: Node.js 20 (Alpine)
- **Language**: TypeScript (strict mode)
- **Instagram Scraper**: Playwright + Chromium (headless, cookie-based auth)
- **Scheduler**: node-cron
- **Logger**: pino + pino-pretty
- **Package Manager**: pnpm

### Frontend / Dashboard
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Auth**: NextAuth.js (credentials provider)
- **API**: Next.js API Routes

### Database
- **Engine**: PostgreSQL 16 (Docker service)
- **ORM**: Prisma
- **Migrations**: Prisma Migrate

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Tunnel**: Cloudflare Tunnel (cloudflared)
- **CI/CD**: GitHub Actions

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Docker Compose Stack                       │
│                                                                  │
│  ┌─────────────┐   ┌──────────────┐  ┌──────────────────────┐   │
│  │ cloudflared │   │   Next.js    │  │   OpenClaw Gateway   │   │
│  │  (tunnel)   │──▶│  Dashboard   │  │   :18789             │   │
│  │             │   │  :3000       │  │   (agent platform)   │   │
│  └─────────────┘   └──────┬───────┘  └──────────┬───────────┘   │
│                            │                     │               │
│                            │          ┌──────────▼───────────┐   │
│                            │          │    Agent Worker      │   │
│                            │          │    :4000             │   │
│                            │          │  (Playwright scraper │   │
│                            │          │   + cron + reporter) │   │
│                            │          └──────────┬───────────┘   │
│                            ▼                     ▼               │
│                   ┌──────────────────────────────────────────┐   │
│                   │            PostgreSQL :5432               │   │
│                   │     (posts, accounts, runs, users)        │   │
│                   └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
         ↑                                        ↓
config/instagram_cookies.json              Telegram Bot
(mounted as Docker volume)                (notifications)
```

---

## OpenClaw Installation Instructions

### Step 1 — Clone OpenClaw and Run Setup Script
The `docker-setup.sh` script from the official OpenClaw repository must be
executed as part of the project initialization. Claude Code must automate this
by generating a `scripts/install-openclaw.sh` script that the user runs once
before `docker compose up`.

```bash
# scripts/install-openclaw.sh (generate this file)
#!/bin/bash
set -e

echo ">>> Cloning OpenClaw..."
git clone https://github.com/openclaw/openclaw.git .openclaw-setup

echo ">>> Running OpenClaw docker-setup..."
cd .openclaw-setup
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$(pwd)/../config/instagram_cookies.json:/home/node/config/instagram_cookies.json:ro,$(pwd)/../config/accounts.json:/home/node/config/accounts.json:ro"
./docker-setup.sh

echo ">>> OpenClaw setup complete."
echo ">>> Run: docker compose up -d --build"
```

### Step 2 — Add OpenClaw as Docker Compose Service
The `docker-compose.yml` must include an `openclaw` service that:
- Pulls `ghcr.io/openclaw/openclaw:latest`
- Mounts `instagram_cookies.json` and `accounts.json` as read-only volumes
- Persists OpenClaw home directory via named volume
- Exposes port `18789` for gateway API
- Depends on `postgres` being healthy

### Step 3 — Install Playwright Chromium in OpenClaw Container
After first startup, Playwright Chromium must be installed inside the OpenClaw
container. Generate a `scripts/install-playwright.sh` script:

```bash
# scripts/install-playwright.sh (generate this file)
#!/bin/bash
set -e

echo ">>> Installing Playwright Chromium in OpenClaw container..."
docker compose exec openclaw \
  node /app/node_modules/playwright-core/cli.js install chromium

echo ">>> Installing system deps..."
docker compose exec openclaw \
  apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

echo ">>> Playwright ready inside OpenClaw container."
```

### Step 4 — OpenClaw Channel Setup (Telegram)
Generate a `scripts/setup-channels.sh` script:

```bash
# scripts/setup-channels.sh (generate this file)
#!/bin/bash
set -e

echo ">>> Setting up Telegram channel on OpenClaw..."
docker compose run --rm openclaw-cli \
  channels add --channel telegram --token "${TELEGRAM_BOT_TOKEN}"

echo ">>> Channel setup complete."
```

---

## Instagram Scraping Strategy

### Cookie-Based Authentication
- User exports Instagram session cookies using **EditThisCookie** or
  **Cookie-Editor** browser extension and saves to `config/instagram_cookies.json`
- Playwright loads these cookies into browser context before navigating
- File is mounted as read-only Docker volume — no rebuild needed when updating

### Cookie File Format
```json
[
  {
    "name": "sessionid",
    "value": "your_session_id_here",
    "domain": ".instagram.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  },
  {
    "name": "csrftoken",
    "value": "your_csrf_token_here",
    "domain": ".instagram.com",
    "path": "/",
    "httpOnly": false,
    "secure": true,
    "sameSite": "Lax"
  },
  {
    "name": "ds_user_id",
    "value": "your_user_id_here",
    "domain": ".instagram.com",
    "path": "/",
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  }
]
```

### Scraping Flow Per Account
```
Load cookies into Playwright browser context
        ↓
Navigate to https://www.instagram.com/{username}/reels/
        ↓
Auto-scroll until MAX_POSTS collected or no new posts after 3 attempts
        ↓
Extract from grid: post URL, view count overlay
        ↓
Visit each post URL → extract likes, comments, post date, media type
        ↓
Return structured PostData array
```

### Anti-Detection Configuration
- Randomize user-agent per browser session
- Set realistic viewport: 1280x900
- Disable `navigator.webdriver` flag via Playwright launch args
- Random delay 2–5 seconds between accounts
- Random delay 1–3 seconds between individual post visits
- Max concurrency: 1 account at a time (sequential)
- Rate limit: minimum 8 seconds per account

---

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id        String   @id @default(cuid())
  username  String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        String   @id
  username  String
  mediaType String
  views     BigInt   @default(0)
  likes     Int      @default(0)
  comments  Int      @default(0)
  permalink String
  postDate  DateTime
  fetchedAt DateTime @default(now())
  account   Account  @relation(fields: [username], references: [username])

  @@index([views(sort: Desc)])
  @@index([username])
  @@index([postDate])
}

model MonitorRun {
  id            Int      @id @default(autoincrement())
  runAt         DateTime @default(now())
  accountsCount Int
  postsFetched  Int
  topPostUrl    String?
  topViews      BigInt?
  status        String
  errorMessage  String?
  durationMs    Int
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
}
```

---

## Functional Requirements

### FR-01: OpenClaw Service
- Pull `ghcr.io/openclaw/openclaw:latest` in Docker Compose
- Persist home data via named volume `openclaw_home`
- Mount `config/instagram_cookies.json` and `config/accounts.json` as read-only
- Expose port `18789` for internal gateway API
- Health check: `curl -fsS http://localhost:18789/healthz`
- Generate Cloudflare Tunnel token for remote dashboard access

### FR-02: Agent Startup Validation
- Check `config/instagram_cookies.json` exists and is valid JSON array
- Check `config/accounts.json` exists and has at least one entry
- Check PostgreSQL connection via Prisma
- Check Telegram Bot connectivity
- If any check fails, log a clear error and exit with code 1

### FR-03: Cookie Validation
- Before every monitoring run, verify cookies by loading
  `https://www.instagram.com/accounts/edit/` in headless browser
- If redirected to login page, send Telegram alert and abort:
  ```
  ⚠️ Instagram Cookie Expired!
  Please update config/instagram_cookies.json
  Then run: docker compose restart openclaw-agent
  ```

### FR-04: Instagram Scraper
- For each active account:
  1. Create Playwright browser context with cookies loaded
  2. Navigate to `https://www.instagram.com/{username}/reels/`
  3. Auto-scroll until `MAX_POSTS` items loaded
  4. Extract: post URL, view count, thumbnail from grid
  5. Visit each post URL: extract exact views, likes, comments, date, media type
  6. Close browser context after each account
- Skip private or non-existent accounts with warning log

### FR-05: Data Processing
- Merge all scraped posts, deduplicate by post `id`
- Sort by `views` descending, take Top-N per account
- Upsert to PostgreSQL via Prisma
- Insert record to `MonitorRun` table

### FR-06: Telegram Report
```
📊 Instagram Views Report
📅 Friday, 13 March 2026 | Top 10 Posts

━━━━━━━━━━━━━━━━━━━━
1️⃣ @natgeo
   📹 REEL | 👁 4,231,900 views
   📅 12 March 2026
   🔗 https://instagram.com/p/xxxxx
━━━━━━━━━━━━━━━━━━━━
✅ 3 accounts | 127 posts | 4,201ms
⏱ Next run: Saturday 14 March 2026 08:00 WIB
```

### FR-07: Scheduler
- Default cron: `0 8 * * *` (08:00 Asia/Jakarta)
- Configurable via `CRON_SCHEDULE` env var
- On-demand: `pnpm run monitor`
- Log next scheduled run on every startup

### FR-08: Next.js Dashboard Pages
- `/` — Overview: stats cards, line chart (30-day views trend), bar chart (top 10)
- `/posts` — Sortable table with filters, pagination, CSV export
- `/accounts` — Add/remove/toggle accounts
- `/runs` — Monitor run history with status badges
- `/settings` — Cookie status, manual trigger, update TOP_N and CRON_SCHEDULE

### FR-09: Dashboard API Routes
```
GET    /api/posts                 — List posts with filters and pagination
GET    /api/posts/top             — Top-N posts by views
GET    /api/accounts              — List all accounts
POST   /api/accounts              — Add account
DELETE /api/accounts/:id          — Delete account
PATCH  /api/accounts/:id          — Toggle active status
GET    /api/runs                  — List all monitor runs
POST   /api/monitor/trigger       — Trigger manual run
GET    /api/stats                 — Overview statistics
GET    /api/cookies/status        — Check Instagram cookie validity
GET    /health                    — Health check
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://openclaw:supersecretpassword@postgres:5432/ig_monitor

POSTGRES_USER=openclaw
POSTGRES_PASSWORD=supersecretpassword
POSTGRES_DB=ig_monitor

TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

NEXTAUTH_SECRET=your_random_32_character_secret
NEXTAUTH_URL=https://your-domain.trycloudflare.com

CLOUDFLARED_TOKEN=your_cloudflare_tunnel_token

OPENCLAW_IMAGE=ghcr.io/openclaw/openclaw:latest
OPENCLAW_HOME_VOLUME=openclaw_home
OPENCLAW_GATEWAY_TOKEN=generated_after_onboarding

TOP_N=10
MAX_POSTS=50
CRON_SCHEDULE=0 8 * * *
TZ=Asia/Jakarta
NODE_ENV=production
LOG_LEVEL=info

AGENT_PORT=4000
NEXT_PORT=3000
```

---

## File Structure

```
openclaw-ig-monitor/
├── CLAUDE.md
├── .env
├── .env.example
├── .gitignore
├── .dockerignore
├── docker-compose.yml
│
├── config/
│   ├── accounts.json
│   └── instagram_cookies.json        # Never commit this file
│
├── scripts/
│   ├── install-openclaw.sh           # Run once: clone + setup OpenClaw
│   ├── install-playwright.sh         # Run once: install Chromium in container
│   ├── setup-channels.sh             # Run once: connect Telegram to OpenClaw
│   └── seed.ts                       # Seed admin user + initial accounts
│
├── agent/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.ts
│       ├── agent/
│       │   ├── scraper.ts
│       │   ├── processor.ts
│       │   └── reporter.ts
│       ├── db/
│       │   ├── prisma.ts
│       │   └── queries.ts
│       ├── scheduler/
│       │   └── cron.ts
│       ├── health/
│       │   └── server.ts
│       └── utils/
│           ├── logger.ts
│           ├── rateLimiter.ts
│           ├── cookieValidator.ts
│           └── validator.ts
│
├── dashboard/
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── login/page.tsx
│       │   ├── posts/page.tsx
│       │   ├── accounts/page.tsx
│       │   ├── runs/page.tsx
│       │   ├── settings/page.tsx
│       │   └── api/
│       │       ├── auth/[...nextauth]/route.ts
│       │       ├── posts/route.ts
│       │       ├── accounts/route.ts
│       │       ├── accounts/[id]/route.ts
│       │       ├── runs/route.ts
│       │       ├── stats/route.ts
│       │       ├── cookies/status/route.ts
│       │       ├── monitor/trigger/route.ts
│       │       └── health/route.ts
│       ├── components/
│       │   ├── ui/
│       │   ├── charts/
│       │   │   ├── ViewsTrendChart.tsx
│       │   │   └── TopPostsBarChart.tsx
│       │   ├── tables/
│       │   │   ├── PostsTable.tsx
│       │   │   ├── AccountsTable.tsx
│       │   │   └── RunsTable.tsx
│       │   ├── cards/
│       │   │   └── StatsCard.tsx
│       │   └── layout/
│       │       ├── Sidebar.tsx
│       │       └── Navbar.tsx
│       ├── lib/
│       │   ├── prisma.ts
│       │   ├── auth.ts
│       │   └── utils.ts
│       └── types/
│           └── index.ts
│
└── tests/
    ├── agent/
    │   ├── scraper.test.ts
    │   └── processor.test.ts
    └── dashboard/
        └── api.test.ts
```

---

## docker-compose.yml

```yaml
version: '3.8'

services:

  postgres:
    image: postgres:16-alpine
    container_name: openclaw-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  openclaw:
    image: ${OPENCLAW_IMAGE:-ghcr.io/openclaw/openclaw:latest}
    container_name: openclaw-gateway
    restart: unless-stopped
    ports:
      - "18789:18789"
    volumes:
      - openclaw_home:/home/node
      - ./config/instagram_cookies.json:/home/node/config/instagram_cookies.json:ro
      - ./config/accounts.json:/home/node/config/accounts.json:ro
    environment:
      OPENCLAW_NO_ONBOARD: "0"
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:18789/healthz || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  agent:
    build: ./agent
    container_name: openclaw-agent
    restart: unless-stopped
    env_file: .env
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      openclaw:
        condition: service_healthy
    volumes:
      - ./config/accounts.json:/app/config/accounts.json:ro
      - ./config/instagram_cookies.json:/app/config/instagram_cookies.json:ro
      - ./logs/agent:/app/logs
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  dashboard:
    build: ./dashboard
    container_name: openclaw-dashboard
    restart: unless-stopped
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: openclaw-tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${CLOUDFLARED_TOKEN}
    depends_on:
      - dashboard

volumes:
  postgres_data:
  openclaw_home:
```

---

## agent/Dockerfile

```dockerfile
FROM node:20-alpine AS base

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    tzdata

ENV TZ=Asia/Jakarta
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpx prisma generate

COPY . .
RUN pnpm build

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

EXPOSE 4000
CMD ["sh", "-c", "pnpx prisma migrate deploy && node dist/index.js"]
```

---

## dashboard/Dockerfile

```dockerfile
FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpx prisma generate

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## .gitignore

```
node_modules/
dist/
.next/
.env
logs/
config/instagram_cookies.json
.openclaw-setup/
*.log
.DS_Store
```

---

## .github/workflows/deploy.yml

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/openclaw-ig-monitor
            git pull origin main
            docker compose down
            docker compose up -d --build
            docker image prune -f
            echo "Deployed successfully at $(date)"
```

---

## config/accounts.json — Example

```json
[
  { "username": "natgeo", "isActive": true },
  { "username": "9gag", "isActive": true },
  { "username": "your_target_account", "isActive": true }
]
```

---

## Acceptance Criteria
- [ ] `scripts/install-openclaw.sh` runs without error and sets up OpenClaw
- [ ] `scripts/install-playwright.sh` installs Chromium inside OpenClaw container
- [ ] `scripts/setup-channels.sh` connects Telegram bot to OpenClaw gateway
- [ ] `docker compose up -d --build` completes without errors
- [ ] OpenClaw gateway is accessible at `http://localhost:18789`
- [ ] OpenClaw health check returns HTTP 200 at `/healthz`
- [ ] PostgreSQL data persists across container restarts via named volume
- [ ] Prisma migrations run automatically on agent startup
- [ ] Agent reads cookies from `config/instagram_cookies.json`
- [ ] Agent sends Telegram alert when cookies are expired
- [ ] Playwright scraper extracts view counts from Instagram Reels page
- [ ] All scraped data is saved to PostgreSQL via Prisma
- [ ] Dashboard accessible via Cloudflare Tunnel public URL
- [ ] Dashboard login works with seeded admin credentials
- [ ] All dashboard pages display real data from PostgreSQL
- [ ] Manual run trigger button in Settings works correctly
- [ ] GitHub Actions auto-deploys to VPS on push to main
- [ ] `config/instagram_cookies.json` is excluded from git commits

---

## Claude Code Build Order
1.  `prisma/schema.prisma`                     — Define all database models
2.  `scripts/install-openclaw.sh`              — OpenClaw clone + setup script
3.  `scripts/install-playwright.sh`            — Playwright Chromium install script
4.  `scripts/setup-channels.sh`               — Telegram channel setup script
5.  `agent/src/utils/logger.ts`                — pino logger setup
6.  `agent/src/utils/validator.ts`             — Startup validation
7.  `agent/src/utils/cookieValidator.ts`       — Instagram cookie checker
8.  `agent/src/utils/rateLimiter.ts`           — Delay + retry with backoff
9.  `agent/src/db/prisma.ts`                   — Prisma client singleton
10. `agent/src/db/queries.ts`                  — Upsert posts and log runs
11. `agent/src/agent/scraper.ts`               — Playwright Instagram scraper
12. `agent/src/agent/processor.ts`             — Deduplicate, sort, rank posts
13. `agent/src/agent/reporter.ts`              — Format and send Telegram report
14. `agent/src/scheduler/cron.ts`              — node-cron schedule
15. `agent/src/health/server.ts`               — Health check endpoint
16. `agent/src/index.ts`                       — Entry point + graceful shutdown
17. `dashboard/src/lib/prisma.ts`              — Prisma client for Next.js
18. `dashboard/src/lib/auth.ts`                — NextAuth.js config
19. `dashboard/src/app/api/`                   — All API route handlers
20. `dashboard/src/components/`               — All UI components and charts
21. `dashboard/src/app/`                       — All page components
22. `scripts/seed.ts`                          — Seed admin user + accounts
23. `docker-compose.yml`                       — Wire all services
24. `agent/Dockerfile`                         — Agent container
25. `dashboard/Dockerfile`                     — Dashboard container
26. `.github/workflows/deploy.yml`             — CI/CD pipeline

## First-Time Deployment Commands
```bash
# Step 1 — Install OpenClaw (run once)
chmod +x scripts/install-openclaw.sh && ./scripts/install-openclaw.sh

# Step 2 — Copy your Instagram cookies
cp ~/instagram_cookies.json ./config/instagram_cookies.json

# Step 3 — Fill in all environment variables
cp .env.example .env && nano .env

# Step 4 — Start the full stack
docker compose up -d --build

# Step 5 — Install Playwright Chromium inside OpenClaw (run once)
chmod +x scripts/install-playwright.sh && ./scripts/install-playwright.sh

# Step 6 — Connect Telegram to OpenClaw (run once)
chmod +x scripts/setup-channels.sh && ./scripts/setup-channels.sh

# Step 7 — Seed the database
docker exec openclaw-agent pnpm run seed

# Step 8 — Verify
curl http://localhost:18789/healthz
curl http://localhost:4000/health
# Open dashboard via Cloudflare Tunnel URL in browser
```
