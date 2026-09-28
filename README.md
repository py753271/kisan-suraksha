# Kisan Suraksha (किसान सुरक्षा) — Disaster Intelligence & Farmer Advisory Platform

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node%2FExpress-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20PostGIS-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Cache-Redis%20%2F%20BullMQ-DC382D?logo=redis)](https://redis.io/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Enterprise-grade early warning disaster relief, GIS boundary tracking, crop advisory, and emergency SOS broadcasting platform empowering Indian agricultural communities.**

---

## 📌 Project Links
* **Live Web App:** Pending deployment
* **Live Backend API:** Pending deployment
* **GitHub Repository:** [https://github.com/py753271/kisan-suraksha](https://github.com/py753271/kisan-suraksha)

---

## 🌾 The Problem It Solves
Unpredictable weather events, flash floods, heatwaves, and pest outbreaks inflict catastrophic losses on smallholder farmers who lack timely, localized advisories and actionable disaster alerts. 
**Kisan Suraksha** bridges this gap by combining meteorological feeds, GIS geospatial radius calculations, agricultural risk models, and rapid emergency distress signals into a unified, low-bandwidth accessible progressive web application.

---

## 🚀 Key Features

* **🚨 Hyperlocal Live Alerts:** Automated severity tracking (Extreme, Severe, Moderate) with polygon GeoJSON impact mapping.
* **🆘 Emergency SOS Beacon:** 1-click distress signaling with real-time GPS coordinates, nearby shelter routing, and emergency contacts.
* **🌱 Scientific Crop Advisory:** Risk assessments based on current weather thresholds, soil conditions, and state-specific crop growth stages.
* **🗺️ Interactive GIS Spatial Maps:** PostGIS-powered geospatial distance tracking (`ST_DWithin`, `ST_Contains`) displaying active disaster zones and safe shelters.
* **🌤️ Weather Intelligence:** Real-time metrics (temperature, humidity, precipitation, wind) with 7-day agricultural forecasts.
* **📱 Offline-First PWA:** PWA manifest and local caching ensuring core emergency numbers and advisories remain accessible with spotty cellular reception.
* **🔐 Enterprise RBAC Security:** Role-based access control (`SUPER_ADMIN`, `STATE_ADMIN`, `DISTRICT_ADMIN`, `AGRICULTURE_OFFICER`, `FARMER`) secured with JWT rotation, HTTP-only cookies, and bcrypt hashing.

---

## 🏗️ System Architecture

```text
       ┌────────────────────────────────────────────────────────┐
       │               Next.js 15 App (Vercel)                  │
       │       TailwindCSS v4 • Lucide Icons • Leaflet GIS      │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTPS / REST API
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             Node.js / Express API (Render)             │
       │      Zod Validation • JWT Security • Winston Logs      │
       └──────────────┬──────────────────────────┬──────────────┘
                      │                          │
           Database   │                          │  Cache & Queues
                      ▼                          ▼
       ┌────────────────────────┐      ┌────────────────────────┐
       │  PostgreSQL + PostGIS  │      │     Redis + BullMQ     │
       │  Prisma ORM • GeoJSON  │      │  Task Queue • Locks    │
       └────────────────────────┘      └────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, TailwindCSS v4, React-Leaflet, TanStack Query |
| **Backend** | Node.js, Express 4, TypeScript, Prisma ORM 6, Zod, Winston Logger |
| **Database** | PostgreSQL 15/16 + PostGIS extension |
| **Caching & Queues**| Redis 7, BullMQ (Priority Notification Queues), node-cron |
| **Security & Auth** | JWT Access/Refresh tokens, Bcrypt, Helmet, CORS, Rate Limiting, HTTP-only Cookies |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend API), Supabase / Neon (PostgreSQL) |

---

## ⚙️ Environment Variables Guide

### Frontend (`.env.local`)
| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Public URL of the backend API | `https://your-backend-api.com/api/v1` |

### Backend (`backend/.env`)
| Variable | Description | Sensitive | Example |
|---|---|---|---|
| `PORT` | Listening port | No | `5000` |
| `NODE_ENV` | Runtime environment | No | `production` |
| `DATABASE_URL` | PostgreSQL connection string | **YES** | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `REDIS_URL` | Redis connection string | **YES** | `redis://user:pass@host:6379` |
| `JWT_SECRET` | Signing secret for access token | **YES** | `min-32-chars-random-secret` |
| `JWT_REFRESH_SECRET`| Signing secret for refresh token | **YES** | `min-32-chars-random-secret` |
| `CORS_ORIGIN` | Allowed client origin | No | `https://your-frontend-domain.com` |

---

## 💻 Local Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/py753271/kisan-suraksha.git
cd kisan-suraksha
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
npm install

# Push database schema & seed initial roles/data
npx prisma db push
npx ts-node prisma/seed.ts

# Build and start
npm run build
npm run dev
```

### 3. Configure Frontend
```bash
# In project root directory
npm install
npm run build
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Testing & Verification
The platform includes 14 unit and integration test suites:
```bash
cd backend
npm run test
```
**Results:** `14/14 test suites passed`, `77/77 assertions passed` (Coverage includes Auth, Alerts, Spatial queries, Emergency SOS, BullMQ Workers, Cron Schedulers, and Health probes).

---

## 🚀 Deployment Guide (Vercel + Render)

### 1. Frontend on Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)** and import `py753271/kisan-suraksha`.
2. Root Directory: `./`
3. Environment Variable: `NEXT_PUBLIC_API_URL = <your-render-backend-url>/api/v1`
4. Click **Deploy**.

### 2. Backend on Render
1. Go to **[dashboard.render.com/new/web](https://dashboard.render.com/new/web)** and select `py753271/kisan-suraksha`.
2. Root Directory: `backend`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Configure Environment Variables (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`).
6. Click **Deploy**.

---

## 👨‍💻 Author
* **Pradeep Yadav** — [GitHub (@py753271)](https://github.com/py753271) • [LinkedIn](https://linkedin.com)
