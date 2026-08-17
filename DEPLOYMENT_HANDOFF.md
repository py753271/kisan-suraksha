# Kisan Suraksha - Deployment Handoff Manual

This handoff manual guides the deployment of the Kisan Suraksha platform from a code-complete build to a live production environment.

---

## 1. System Requirements

### Backend Application
*   **Engine**: Node.js `v20.x` or `v22.x`
*   **Compile Target**: TypeScript CommonJS
*   **Port**: `5000` (internal network binding recommended)

### Frontend Application
*   **Framework**: Next.js App Router (version `15.x`)
*   **Port**: `3000` (bind behind reverse proxy/load balancer)

### PostgreSQL Database
*   **Engine**: PostgreSQL version `15` or `16`
*   **Extension**: `postgis` (must be enabled on target schemas)

### Cache & Worker Queue
*   **Engine**: Redis `v7.x` (enforce password authentication)

---

## 2. Environment Configurations

Copy `.env.example` in backend and root directories, and securely inject variables using a Secrets Manager:
*   `DATABASE_URL`: Production PostgreSQL database connection string.
*   `REDIS_URL`: Production Redis cache connection.
*   `JWT_SECRET`: Random secure string for access token signatures.
*   `JWT_REFRESH_SECRET`: Random secure string for refresh token signatures.
*   `CORS_ORIGIN`: Must point to the public frontend URL.
*   `NEXT_PUBLIC_API_URL`: Points to the public backend ALB endpoint.

---

## 3. Database Initializations

Before start, apply migrations and reference data:
```bash
# Apply database schemas
npx prisma migrate deploy

# Seed initial system boundaries and reference parameters
npx prisma db seed
```

---

## 4. Backups & Disaster Recovery

*   **Database Backup (pg_dump)**:
    ```bash
    pg_dump -U kisanadmin -F c -b -v -f db-backup-$(date +%F).dump kisansuraksha
    ```
*   **Database Restoration (pg_restore)**:
    ```bash
    pg_restore -U kisanadmin -d kisansuraksha -v --clean db-backup-latest.dump
    ```
*   **Frequency Recommendation**: Hourly snapshots for transaction records; nightly full database backups.
*   **Teardown Rollback**: Revert to the last tagged Docker image tag in the orchestration configuration.
