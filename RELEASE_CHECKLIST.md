# Kisan Suraksha - Pre-Flight Release Checklist

This checklist must be executed and approved before launching Kisan Suraksha updates to staging or production systems.

---

## 1. Builds & Tests Compliance
- [ ] TypeScript compilation builds cleanly (`npm run build` in root and `backend/`).
- [ ] ESLint style checks return zero syntax violations (`npm run lint`).
- [ ] All unit and integration Jest tests pass successfully (`npm run test`).

## 2. Environment Variables & Secrets Validation
- [ ] Copy `.env.example` templates and create production `.env` files.
- [ ] Verify `DATABASE_URL` uses high-entropy secure database password.
- [ ] Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are unique, strong keys.
- [ ] Verify `NEXT_PUBLIC_API_URL` correctly matches backend public endpoint.
- [ ] Ensure no real production credentials or credentials tokens are committed to source control.

## 3. Database & Migrations Validation
- [ ] Verify the PostGIS spatial extension is active in PostgreSQL database.
- [ ] Apply database schema updates (`npx prisma migrate deploy`).
- [ ] Verify database indexes exist on search filters (`alertId`, `location`, `cropName`).

## 4. Cache & Queue Services Integration
- [ ] Verify Redis connection pools instantiate successfully.
- [ ] Confirm BullMQ workers listen to correct queues in production.
- [ ] Ensure cron jobs lock on Redis keys to prevent concurrent duplicates run.

## 5. Security Protocols Check
- [ ] Helmet security headers are active on Express backend.
- [ ] CORS is restricted to validated origin urls with credentials enabled.
- [ ] JWT cookies are set with HTTP-only, secure, sameSite flags.
- [ ] Request size limit payload handles do not exceed 10MB.
- [ ] Rate limits are active on authentication routes (`POST /auth/login`).

## 6. End-to-End Routing Contracts Check
- [ ] Verify frontend Axios clients requests align with backend API maps.
- [ ] Confirm offline connection behaviors fail gracefully.
- [ ] Confirm JWT token refresh rotation loop retries fail with appropriate redirects.

## 7. Health & Monitoring Checks
- [ ] Verify backend `/health`, `/health/live`, and `/health/ready` endpoints return `200 OK`.
- [ ] Confirm structured JSON logs filter passwords/secrets.
- [ ] Validate container startup states using Docker compose healthchecks.
