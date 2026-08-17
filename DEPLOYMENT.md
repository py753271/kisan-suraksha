# Kisan Suraksha - Enterprise Deployment & Production Manual

This document details the production deployment, orchestration, database backup-recovery guidelines, and release troubleshooting procedures for the complete Kisan Suraksha platform.

---

## 1. Local Production Setup

To test the container configuration locally:
1. Copy the `.env.example` templates in root and `backend/` directories to `.env`:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
2. Modify the values (CORS origin, secrets, SMTP, and database passwords).

---

## 2. Docker Orchestration

Launch the full stack locally or on a production host using Docker Compose:
```bash
# Build and run all container services in background
docker compose up -d --build

# Verify container statuses and exposed ports
docker compose ps

# Check backend container health logs
docker compose logs -f backend
```

---

## 3. Environment Variables Audit

| Config Key | Runtime injection method | Security Priority |
| :--- | :---: | :---: |
| `DATABASE_URL` | Docker Environment Variable | **CRITICAL** (Inject via Vault/Secrets Manager) |
| `REDIS_URL` | Docker Environment Variable | **HIGH** (Verify secure private network binding) |
| `JWT_SECRET` | Secret injection at launch | **CRITICAL** (Rotate every 90 days) |
| `JWT_REFRESH_SECRET` | Secret injection at launch | **CRITICAL** (Rotate every 90 days) |

---

## 4. Database Migrations & Seeds

Deployments require sequential PostGIS migrations application:
```bash
# Apply deterministic schema migrations to database
docker compose exec backend npx prisma migrate deploy

# Seed necessary administrative boundaries and user accounts
docker compose exec backend npx prisma db seed
```

---

## 5. Structured Logging & Monitoring Audit

*   **Format**: Structured JSON format. Includes `requestId`, `timestamp`, `route`, `statusCode`, and `durationMs`.
*   **Security Filter**: The logging system filters properties matching `password`, `accessToken`, `refreshToken`, `token` before writing.
*   **APM Integrations**: Wires `winston` logs straight to stdout which can be piped to Elasticsearch/Kibana or AWS CloudWatch.

---

## 6. Worker & Node Cron Management

*   **BullMQ queues**: Execute inside the backend container by default. For large scale platforms, run workers as separate pods in Kubernetes using:
    ```bash
    CMD ["node", "dist/workers/notification-worker.js"]
    ```
*   **Scheduler Locking**: Schedulers use a Redis concurrency lock key pattern (`scheduler:lock`). Only the container holding the key can execute government data sync, preventing duplicated calls.

---

## 7. Graceful Shutdown Procedures

The backend app listens to `SIGTERM` and `SIGINT` triggers:
1. Closes Express HTTP servers to refuse new incoming requests.
2. Waits for active BullMQ jobs in progress to terminate cleanly.
3. Closes Prisma client connections.
4. Closes Redis clients pools.

---

## 8. Backup & Disaster Recovery Strategy

### PostgreSQL Backup
Run a nightly cron job to dump database state:
```bash
# Capture full database state with custom format
docker exec -t ks-postgres pg_dump -U kisanadmin -F c -b -v -f /backups/db-backup-$(date +%F).dump kisansuraksha
```

### Restore Procedure
In case of database failure, restore the latest dump:
```bash
# Wipe and recreate public schema, then restore dump
docker exec -t ks-postgres pg_restore -U kisanadmin -d kisansuraksha -v --clean /backups/db-backup-latest.dump
```

*   **Backup Frequency**: Hourly snapshots for transaction tables; nightly full dumps.
*   **Retention Period**: Store dumps for 30 days locally, and move to S3 Glacier for 1 year archival.

---

## 9. Rollback & Troubleshooting

If a deployment fails:
1. Re-tag and run the previous Docker container image:
   ```bash
   docker compose up -d --no-deps backend
   ```
2. Revert migrations (if compatible with schema structure) or restore the pre-deployment database dump.
