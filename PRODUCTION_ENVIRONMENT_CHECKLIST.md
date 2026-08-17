# Kisan Suraksha Production Environment Checklist

This checklist documents E2E validation gates required before launching updates into active production environments.

---

## 1. Infrastructure Requirements
*   [ ] **Docker/Container Runtime**: Docker Desktop or Docker Engine installed on production target hosts.
*   [ ] **Container Registry**: Registry server (AWS ECR / Docker Hub) to host built Docker images.
*   [ ] **PostgreSQL + PostGIS**: PostgreSQL database running with the geo-spatial PostGIS extension enabled.
*   [ ] **Redis Cache**: Running cache instance mapping credentials pools.
*   [ ] **BullMQ Workers**: Active task processing workers configuration.
*   [ ] **Load Balancer**: Load Balancer mapped to forward ports to frontend (3000) and backend (5000).
*   [ ] **DNS Routing**: Domain names resolution targeting the Load Balancer IP.
*   [ ] **HTTPS/TLS**: Valid SSL/TLS certificates configured on the Application Gateway.

## 2. Environment Configurations Validation
*   [ ] **DATABASE_URL**: Parsed correctly by Prisma and referencing a high-entropy password.
*   [ ] **REDIS_URL**: Redis endpoint configuration maps password auth.
*   [ ] **JWT Secrets**: Strong, random secrets configured for tokens signing.
*   [ ] **CORS Origin**: Restricts incoming requests to production UI domain maps.
*   [ ] **NEXT_PUBLIC_API_URL**: Points frontend Axios calls to backend route context.
*   [ ] **SMTP Mailer Credentials**: Outgoing email credentials parameters.
*   [ ] **FCM push server keys**: Firebase configuration profiles mapping keys.

## 3. Application Verification Checkpoints
*   [ ] **Prisma Migrations**: Clean migrations schema execution against databases.
*   [ ] **Seed Data**: Reference boundaries records populated.
*   [ ] **Backend Health**: `/health/ready` endpoint returns status `200 OK`.
*   [ ] **Frontend Health**: Main Next.js portal page loads cleanly in client browsers.
*   [ ] **Redis Cache Health**: Redis key store read/write metrics verify.
*   [ ] **Queue Health**: Workers listening to BullMQ queues.

## 4. Security Configuration
*   [ ] **HTTPS**: Enforce HTTPS bindings for all HTTP routes.
*   [ ] **CORS**: Restrict access to validated origin headers.
*   [ ] **Helmet**: Secure headers configured in HTTP response wrappers.
*   [ ] **Rate Limiting**: Rate limit parameters active on authentication controllers.
*   [ ] **Secure Cookies**: Refresh token cookies map Secure and SameSite policies.
*   [ ] **Secrets Manager**: Secrets injected dynamically from safe managers.

## 5. Operations
*   [ ] **Logging**: JSON logging prints structures and filters secrets.
*   [ ] **Monitoring**: APM telemetry checks CPU, memory, and database latencies.
*   [ ] **Backup**: Nightly database dumps configured.
*   [ ] **Restore Test**: Verify backup restore on non-production environment.
*   [ ] **Rollback Procedure**: Reversion strategies documented.
