# Kisan Suraksha Platform

Kisan Suraksha is an enterprise-grade early warning disaster relief, GIS boundary tracking, crop advisory, and emergency SOS broadcasting platform built using Node/Express, PostgreSQL/PostGIS, Redis caching, and Next.js.

---

## 1. Platform Structure

*   **Frontend**: Next.js App Router (located at `/`)
*   **Backend**: Node/Express with TypeScript & Prisma (located at `/backend`)
*   **Orchestration**: Docker Compose configuration (located at `docker-compose.yml`)

---

## 2. Startup Instructions

### Quick Start with Docker
Ensure Docker Desktop and WSL2 are installed, then run:
```bash
# Build and launch all services (postgres, redis, backend, frontend)
docker compose up -d --build

# Run database migrations and seed reference data
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

### Manual Development Setup

#### 1. Setup Backend
1. Go to the backend folder: `cd backend`
2. Copy `.env.example` to `.env` and fill in correct database/Redis credentials.
3. Install dependencies: `npm install`
4. Generate Prisma clients and deploy schemas:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. Build and launch:
   ```bash
   npm run build
   npm run dev
   ```

#### 2. Setup Frontend
1. Go to the workspace root directory.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL`.
3. Install dependencies: `npm install`
4. Build and start:
   ```bash
   npm run build
   npm run start
   ```

---

## 3. Testing and Style Linting

*   Run backend Jest tests: `npm run test` (inside `backend/` directory)
*   Run backend linter: `npm run lint` (inside `backend/` directory)
*   Run frontend linter: `npm run lint` (inside workspace root)

---

## 4. Release Checklist & Handoff Logs

For complete deployment handoff configurations, database backup strategies, E2E test matrices, and operational checks, please reference:
*   [DEPLOYMENT_HANDOFF.md](file:///c:/Users/py753/OneDrive/Desktop/former/DEPLOYMENT_HANDOFF.md)
*   [PRODUCTION_ENVIRONMENT_CHECKLIST.md](file:///c:/Users/py753/OneDrive/Desktop/former/PRODUCTION_ENVIRONMENT_CHECKLIST.md)
*   [PRODUCTION_SMOKE_TEST.md](file:///c:/Users/py753/OneDrive/Desktop/former/PRODUCTION_SMOKE_TEST.md)
*   [FINAL_E2E_TEST_MATRIX.md](file:///c:/Users/py753/OneDrive/Desktop/former/FINAL_E2E_TEST_MATRIX.md)
*   [FINAL_GO_NO_GO.md](file:///c:/Users/py753/OneDrive/Desktop/former/FINAL_GO_NO_GO.md)
