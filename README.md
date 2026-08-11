# Logistics Operations Hub

A full-stack distributed courier logistics platform built as two independent applications that communicate through secure webhooks and scheduled ETL synchronization.

The platform is designed to mirror real-world courier operations, from customer package drop-off to final delivery, while keeping customer-facing and operations-facing responsibilities clearly separated.

---

# The Two Applications

## App 1 — Courier Collection Application

The customer-facing application.

Used by:

- Collection office staff to register packages
- Customers to track shipment progress
- Local delivery teams to manage last-mile delivery

**Location**

```text
collection-app/
```

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:5000 |

See **`collection-app/README.md`**

---

## App 2 — Courier Logistics Application

The operations application.

Used by regional logistics teams to coordinate package movement across distribution hubs.

Responsibilities include:

- Package routing
- Bag management
- Truck management
- Regional hub operations
- Customer onboarding
- Secure webhook processing
- ETL synchronization
- Operational status tracking

**Location**

```text
logistics-app/
```

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:3001 |
| Backend API | http://localhost:5001 |

See **`logistics-app/README.md`**

---

# System Architecture

```text
                     Customer
                         │
                         ▼
              Collection Office (App 1)
                         │
       Register Package + Generate Tracking ID
                         │
                         ▼
         Secure Webhook (API Key + HMAC)
                         │
                         ▼
             Logistics Platform (App 2)
                         │
        ┌─────────────────────────────────┐
        │ Assign Bags                     │
        │ Load Trucks                     │
        │ Move Between Regional Hubs      │
        │ Update Operational Status       │
        └─────────────────────────────────┘
                         │
                         ▼
              Scheduled ETL Synchronization
                         │
                         ▼
               Collection Application
                         │
                         ▼
              Customer Tracking Portal
```

---

# Package Lifecycle

```text
Customer drops package
            │
            ▼
Collection App creates package
Generates tracking ID
Stores origin region
            │
            ▼
Webhook to Logistics
(API Key + HMAC Authentication)
            │
            ▼
Logistics creates operational package
            │
            ▼
Assign to Bag
            │
            ▼
Load onto Truck
            │
            ▼
Move Between Regional Hubs
            │
            ▼
Destination Reached?
      ┌──────────────┐
      │              │
     YES            NO
      │              │
      ▼              ▼
Schedule        Continue
Delivery        Transit
      │
      ▼
Out For Delivery
      │
      ▼
Delivered
      │
      ▼
ETL pushes updated status
      │
      ▼
Collection updates tracking
      │
      ▼
Customer views latest status
```

---

# Integration Between Applications

## 1. Customer Onboarding

Before the applications can communicate securely, the Collection application must register with the Logistics platform.

During onboarding, the Logistics application generates:

- API Key
- Secret Key
- Customer configuration
- Registered webhook endpoint

These credentials uniquely identify each Collection application and are used for all future communication.

---

## 2. Package Creation Webhook (Collection → Logistics)

Whenever a package is registered in the Collection application, a webhook is sent to the Logistics platform.

The webhook contains:

- Package details
- Origin region
- Destination region
- Tracking ID

Authentication is performed using:

- API Key
- HMAC Signature

Only authenticated Collection applications are allowed to create packages.

---

## 3. ETL Synchronization (Logistics → Collection)

The Logistics platform periodically synchronizes package status updates back to each registered Collection application.

The ETL process performs:

- Extract pending package updates
- Transform operational statuses into customer-facing statuses
- Load updates into the Collection application

Updates are grouped by customer and delivered only to the customer's registered webhook.

Only unsynchronized package status changes are transmitted, ensuring efficient synchronization.

---

## 4. Customer Health Monitoring

The Logistics platform continuously monitors webhook delivery health.

Failed deliveries:

- Increase customer failure count
- Retry using exponential backoff
- Record last successful and failed communication
- Automatically disable unhealthy customers after repeated failures

This prevents continuously sending requests to unavailable systems.

---

# Security

## Two credential types

This project uses **two separate key pairs**. Do not mix them up.

| Credential | Env vars | Purpose | Where it lives |
| ---------- | -------- | ------- | -------------- |
| **Staff keys** | `STAFF_API_KEY`, `STAFF_SECRET_KEY` (backend) / `NEXT_PUBLIC_STAFF_*` (frontend) | Protect ops UI routes (packages, bags, trucks, dashboard, customer registration) | Both backends, both frontends, `setup/.env`, compose `.env` files |
| **Logistics customer keys** | `LOGISTICS_API_KEY`, `LOGISTICS_SECRET_KEY` | Collection app's identity for **webhooks between apps** (Collection ↔ Logistics) | `collection-app/backend/.env` only — generated by `npm run setup` |

Staff keys are **shared** across both applications (same values everywhere). Logistics customer keys are **unique to the Collection backend** and are stored in the Logistics database as the Collection customer record.

---

## Staff authentication (Phase 0)

Protected routes require:

- `x-api-key` — must match `STAFF_API_KEY`
- `x-signature` — HMAC-SHA256 of the raw request body using `STAFF_SECRET_KEY`

Public routes (no staff auth):

- Collection: `GET /health`, `POST /api/track` (rate-limited)
- Logistics: `GET /api/health`

Webhook/ETL routes use **customer** credentials (`LOGISTICS_*` / per-customer keys), not staff keys.

---

## API Key Authentication (webhooks)

Each Collection application receives a unique customer API key during onboarding.

Every incoming webhook request is validated before processing.

Requests with invalid or missing API keys are rejected with **401 Unauthorized**.

---

## HMAC Request Signing (webhooks)

Every webhook request is digitally signed using the customer's secret key.

The Logistics platform independently regenerates the expected signature and compares it against the received signature.

This protects against:

- Payload tampering
- Request spoofing
- Unauthorized webhook calls

---

# Environment Variables

Copy each `.env.example` to `.env` (or `.env.local` for frontends) before first run. **Never commit real `.env` files.**

## File map

| File | Used by |
| ---- | ------- |
| `logistics-app/backend/.env` | Logistics backend container (`env_file`) |
| `logistics-app/.env` | Docker Compose → frontend **build args** |
| `logistics-app/frontend/.env.local` | Local `npm run dev` frontend |
| `collection-app/backend/.env` | Collection backend container (`env_file`) |
| `collection-app/.env` | Docker Compose → frontend **build args** |
| `collection-app/frontend/.env` or `.env.local` | Local `npm run dev` frontend |
| `setup/.env` | Root `npm run setup` script |

---

## Collection backend (`collection-app/backend/.env`)

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@collection_db:5432/collection_db
API_URL=http://logistics_backend:5001/api
LOGISTICS_API_KEY=          # filled by npm run setup
LOGISTICS_SECRET_KEY=       # filled by npm run setup
STAFF_API_KEY=              # same shared value in both apps
STAFF_SECRET_KEY=           # same shared value in both apps
```

For local dev (non-Docker), use `localhost` hostnames instead of container names.

---

## Logistics backend (`logistics-app/backend/.env`)

```env
PORT=5001
DATABASE_URL=postgresql://postgres:postgres@logistics_db:5432/logistics_db
STAFF_API_KEY=              # must match collection backend + frontends
STAFF_SECRET_KEY=           # must match collection backend + frontends
```

---

## Docker Compose (`collection-app/.env`, `logistics-app/.env`)

Compose auto-loads `.env` in the same folder as `docker-compose.yml`. These values are baked into frontend images at **build time**:

```env
# collection-app/.env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
NEXT_PUBLIC_STAFF_API_KEY=<same-as-backend-STAFF_API_KEY>
NEXT_PUBLIC_STAFF_SECRET_KEY=<same-as-backend-STAFF_SECRET_KEY>

# logistics-app/.env
NEXT_PUBLIC_STAFF_API_KEY=<same-as-backend-STAFF_API_KEY>
NEXT_PUBLIC_STAFF_SECRET_KEY=<same-as-backend-STAFF_SECRET_KEY>
```

`STAFF_API_KEY` in backend `.env` and `NEXT_PUBLIC_STAFF_API_KEY` in compose `.env` must be the **same value** (different variable names, same secret).

---

## Setup script (`setup/.env`)

```env
LOGISTICS_URL=http://localhost:5001/api
COLLECTION_WEBHOOK_URL=http://collection_backend:5000/api/raw-updates
STAFF_API_KEY=<same-as-backend-STAFF_API_KEY>
STAFF_SECRET_KEY=<same-as-backend-STAFF_SECRET_KEY>
```

---

## Generating staff keys (one-time)

```bash
node -e "const c=require('crypto'); \
  console.log('STAFF_API_KEY=staff_pk_'+c.randomBytes(24).toString('hex')); \
  console.log('STAFF_SECRET_KEY=staff_sk_'+c.randomBytes(32).toString('hex'));"
```

Copy the output into every file in the table above before starting Docker.

---

## Notes

- Never commit `.env` files.
- `LOGISTICS_*` keys are generated once by `npm run setup` — do not hand-edit unless resetting.
- Restart **backends** after changing `backend/.env`.
- Rebuild **frontends** after changing compose `.env` or `NEXT_PUBLIC_*` values (see below).
- If the UI returns **401**, staff keys in the frontend image likely do not match the backend — rebuild frontends with `--no-cache`.

---

# First-Time Setup

Complete these steps once before using the platform.

## 0. Prepare environment files

```bash
cd courier-management-system

cp logistics-app/backend/.env.example logistics-app/backend/.env
cp logistics-app/.env.example logistics-app/.env
cp collection-app/backend/.env.example collection-app/backend/.env
cp collection-app/.env.example collection-app/.env
cp setup/.env.example setup/.env
```

Generate staff keys (see above) and paste the **same pair** into:

- `logistics-app/backend/.env`
- `logistics-app/.env`
- `collection-app/backend/.env`
- `collection-app/.env`
- `setup/.env`

Leave `LOGISTICS_API_KEY` and `LOGISTICS_SECRET_KEY` empty in `collection-app/backend/.env` until step 3.

---

## 1. Create Docker network (one-time)

```bash
docker network create logistics_network
```

---

## 2. Start Logistics, then Collection

```bash
cd logistics-app
docker compose up --build -d

until curl -sf http://localhost:5001/api/health >/dev/null; do sleep 2; done

cd ../collection-app
docker compose up --build -d
```

---

## 3. Register Collection with Logistics

From repository root:

```bash
npm install

# Skip if LOGISTICS_API_KEY is already set (customer already registered)
if grep -qE '^LOGISTICS_API_KEY=pk_' collection-app/backend/.env; then
  echo "Already registered — skipping setup"
else
  npm run setup
fi

docker compose -f collection-app/docker-compose.yml restart collection_backend
```

`npm run setup` waits for Logistics health, registers the Collection customer (admin route), and writes `LOGISTICS_API_KEY` / `LOGISTICS_SECRET_KEY` to `collection-app/backend/.env`.

If setup returns **409 Customer already exists**, registration already happened — skip setup and use existing `LOGISTICS_*` values in `collection-app/backend/.env`.

---

## 4. Verify

```bash
curl -sf http://localhost:5001/api/health && echo " ✓ logistics"
curl -sf http://localhost:5000/health && echo " ✓ collection"
grep LOGISTICS_API_KEY collection-app/backend/.env
```

Open:

- Collection UI: http://localhost:3000
- Logistics UI: http://localhost:3001

---

# Daily Re-Up

Use this when containers were stopped and you want to start again **without** re-running setup or wiping data.

```bash
cd courier-management-system

docker network create logistics_network 2>/dev/null || true

cd logistics-app && docker compose up -d
cd ../collection-app && docker compose up -d
```

Do **not** run `npm run setup` if `collection-app/backend/.env` already contains `LOGISTICS_API_KEY=pk_...`.

Quick health check:

```bash
curl -sf http://localhost:5001/api/health && curl -sf http://localhost:5000/health
```

---

# Rebuild

## When to rebuild

| Change | Action |
| ------ | ------ |
| Backend code or `backend/.env` | `docker compose restart <backend_service>` or `up --build -d` |
| Staff keys in compose `.env` or frontend env | Rebuild frontend with `--no-cache` |
| `LOGISTICS_*` after setup | `docker compose -f collection-app/docker-compose.yml restart collection_backend` only |

## Rebuild one app (code change)

```bash
cd logistics-app
docker compose up --build -d

cd ../collection-app
docker compose up --build -d
```

## Rebuild frontends after staff key change

Staff credentials are embedded at frontend **build** time. Use `--no-cache` so old keys are not reused from Docker layer cache:

```bash
cd logistics-app
docker compose build --no-cache logistics_frontend
docker compose up -d logistics_frontend

cd ../collection-app
docker compose build --no-cache collection_frontend
docker compose up -d collection_frontend
```

## Full reset (wipe databases + re-register)

```bash
cd logistics-app && docker compose down -v
cd ../collection-app && docker compose down -v

# Clear webhook credentials
sed -i 's/^LOGISTICS_API_KEY=.*/LOGISTICS_API_KEY=/' collection-app/backend/.env
sed -i 's/^LOGISTICS_SECRET_KEY=.*/LOGISTICS_SECRET_KEY=/' collection-app/backend/.env

# Then repeat First-Time Setup steps 2–3
```

---

# Why Two Independent Applications?

Separating Collection and Logistics provides several advantages:

- Clear ownership between customer-facing and operational workflows
- Independent deployment and scaling
- Better fault isolation
- Easier maintenance
- Realistic enterprise architecture
- Secure inter-service communication

---

# Running the Project

## Docker (daily)

See **Daily Re-Up** in root `README.md`:

```bash
docker network create logistics_network 2>/dev/null || true
cd logistics-app && docker compose up -d
cd ../collection-app && docker compose up -d
```

### First-time or after code changes

```bash
cd logistics-app && docker compose up --build -d
cd ../collection-app && docker compose up --build -d
```

---

# Development Mode

```bash
# Collection PostgreSQL
cd collection-app
docker compose up collection_db -d

# Collection Backend
cd backend
npm install
npm run migrate
npm run dev
```

```bash
# Collection Frontend
cd collection-app/frontend
npm install
npm run dev
```

```bash
# Logistics PostgreSQL
cd logistics-app
docker compose up logistics_db -d

# Logistics Backend
cd backend
npm install
npm run migrate
npm run dev
```

```bash
# Logistics Frontend
cd logistics-app/frontend
npm install
npm run dev
```

---

# Default Local Ports

| Service               | Port |
| --------------------- | ---- |
| Collection Frontend   | 3000 |
| Collection Backend    | 5000 |
| Logistics Frontend    | 3001 |
| Logistics Backend     | 5001 |
| Collection PostgreSQL | 5432 |
| Logistics PostgreSQL  | 5433 |

---

# Technology Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Language         | TypeScript              |
| Backend          | Node.js + Express       |
| Frontend         | Next.js + Tailwind CSS  |
| Database         | PostgreSQL              |
| ORM              | Prisma                  |
| Validation       | Zod                     |
| HTTP Client      | Axios                   |
| Scheduling       | node-cron               |
| Containerization | Docker + Docker Compose |

---

# Features

| Feature                        | Status |
| ------------------------------ | ------ |
| Package Registration           | ✅     |
| Customer Package Tracking      | ✅     |
| Bag Management                 | ✅     |
| Truck Management               | ✅     |
| Regional Routing               | ✅     |
| Package Status History         | ✅     |
| Customer Onboarding            | ✅     |
| API Key Authentication         | ✅     |
| HMAC Request Signing           | ✅     |
| Staff API Authentication       | ✅     |
| Secure Webhook Integration     | ✅     |
| ETL Synchronization            | ✅     |
| Customer-specific ETL          | ✅     |
| Idempotent Processing          | ✅     |
| Retry with Exponential Backoff | ✅     |
| Customer Health Monitoring     | ✅     |

---

# Project Structure

```text
courier-management-system/
│
├── collection-app/
│   ├── backend/
│   ├── frontend/
│   ├── .env.example          # Docker Compose frontend build args
│   └── README.md
│
├── logistics-app/
│   ├── backend/
│   ├── frontend/
│   ├── shared/
│   ├── .env.example          # Docker Compose frontend build args
│   └── README.md
│
├── setup/
│   ├── setup.ts
│   └── .env.example          # npm run setup credentials
│
└── README.md
```

---

# Documentation

- Root README (Project Overview)
- Collection Application README
- Logistics Application README

Each application contains its own documentation covering setup, architecture, and implementation details.
