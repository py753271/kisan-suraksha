# Kisan Suraksha Production Smoke Test Specification

This document details the smoke test suite to run against the live API gateway to confirm operational health.

---

## 1. System Health Envelopes

### GET /health
*   **Description**: Validates basic application aliveness.
*   **Expected Status**: `200 OK`
*   **Expected Response**: `{ "status": "success", "data": { "live": true } }`

### GET /health/live
*   **Description**: Liveness diagnostic endpoint.
*   **Expected Status**: `200 OK`
*   **Expected Response**: `{ "status": "success", "message": "Liveness check passed" }`

### GET /health/ready
*   **Description**: Readiness diagnostic verifying connection to database and cache components.
*   **Expected Status**: `200 OK`
*   **Expected Response**: `{ "status": "success", "data": { "postgres": "connected", "redis": "connected" } }`

---

## 2. Authentication Processes

### POST /auth/login
*   **Request Payload**: `{ "email": "farmer@kisansuraksha.gov.in", "password": "SecurePassword123" }`
*   **Expected Status**: `200 OK`
*   **Expected Response**: JSON response containing an in-memory `accessToken` string and role profile flags. Set-Cookie header contains a secure, HTTP-only refresh token.

---

## 3. Core Features Smoke Tests

### GET /weather/current
*   **Request Query**: `?lat=22.3&lon=70.7`
*   **Expected Status**: `200 OK`
*   **Expected Response**: `{ "status": "success", "data": { "temp": 28.5, "humidity": 75, ... } }`

### GET /alerts/live
*   **Request Query**: `?lat=22.3&lon=70.7`
*   **Expected Status**: `200 OK`
*   **Expected Response**: `{ "status": "success", "data": [ { "id": "...", "title": "...", "severity": "..." } ] }`

### GET /crop-advisory/current
*   **Request Query**: `?lat=22.3&lon=70.7`
*   **Expected Status**: `200 OK`
*   **Expected Response**: `{ "status": "success", "data": [ { "id": "...", "cropName": "cotton", "advisoryText": "..." } ] }`

### POST /emergency/sos
*   **Request Payload**: `{ "lat": 22.3, "lon": 70.7, "message": "Evacuation assistance requested." }`
*   **Expected Status**: `201 Created`
*   **Expected Response**: `{ "status": "success", "data": { "sosId": "...", "status": "PENDING" } }`
