# Kisan Suraksha Final E2E Test Matrix

This matrix defines the end-to-end integration test flows verifying cross-module operational integrity.

---

## 1. Integrated E2E flows

### Flow A: Meteorological Warnings Dispatches
*   **Operational Path**: Weather update → Alert generation → Push Notification → Dashboard updates.
*   **Steps**:
    1. Send a weather telemetry payload with extreme winds to `POST /integrations/sync/imd`.
    2. Verify backend generates a high-severity alert for coordinates affected by the winds.
    3. Verify a notification job is queued in BullMQ.
    4. Confirm dashboard endpoint updates warning badge indicators.

### Flow B: Soil & Crop Risks Evaluations
*   **Operational Path**: Weather telemetry + Alert triggers → Crop risk calculation → Agronomic recommendation.
*   **Steps**:
    1. Trigger sync job for regional coordinates.
    2. Call `GET /crop-advisory/current`.
    3. Verify returned advisory includes specific cotton stage protection warnings matched to the wind/storm alert.

### Flow C: SOS Distress Beacon Routing
*   **Operational Path**: SOS beacon trigger → Priority evaluation → Shelter lookup → Contact resolution → Notification dispatch.
*   **Steps**:
    1. Call `POST /emergency/sos` from a verified farmer profile coordinate.
    2. Confirm backend assigns high-priority status based on proximity alert geofencing overlaps.
    3. Verify nearby shelter points-in-polygon return accurate locations sorted by nearest distances.
    4. Confirm alert notifications are pushed to agency worker dashboards.

### Flow D: Government Feeds Synchronization
*   **Operational Path**: Government data sync → Database update → Cache invalidation → Dashboard metrics refreshes.
*   **Steps**:
    1. Trigger `POST /integrations/sync`.
    2. Verify sync status logs write successfully.
    3. Confirm Redis cache keys for `/weather` and `/alerts` are invalidated.
    4. Verify immediate follow-up dashboard requests fetch fresh database values.
