# Courier Collection Application

The front-office application of the Logistics Operations Hub. Used by staff to register new packages and by customers to track shipments.

---

## What This App Does

- Staff can register new packages with sender/receiver details, addresses, weight, and origin region
- Generates a unique tracking ID for every package (`TRK-xxxxxxxx`)
- Provides a customer tracking page with reCAPTCHA on the UI
- Shows a collection dashboard grouped by package state (awaiting pickup, moving, delayed, out for delivery, delivered)
- Sends new package events to the Courier Logistics Application via signed webhook
- Receives bulk status updates from the Logistics app through the raw updates endpoint
- Processes raw updates asynchronously in a background cron job every 5 seconds
- Uses `eventId` uniqueness + `skipDuplicates` to avoid duplicate raw update inserts

---

## Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Frontend         | Next.js 16 + React 19 + Tailwind CSS 4 |
| Backend          | Node.js + Express + TypeScript          |
| Database         | PostgreSQL 16                           |
| ORM              | Prisma 7                                |
| Validation       | Zod                                     |
| Job Scheduler    | node-cron                               |
| Containerization | Docker + Docker Compose                 |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js 20+ (for local dev and root `npm run setup`)

---

## Running the App

### Before you start

Create env files from examples and set **staff keys** (same value everywhere):

```bash
cp backend/.env.example backend/.env
cp .env.example .env                    # compose-level — frontend Docker build
cp frontend/.env.example frontend/.env  # optional; for local npm run dev
```

Also configure root `setup/.env` (see root `README.md`) before running `npm run setup`.

| Credential | Variables | Purpose |
| ---------- | --------- | ------- |
| **Staff** | `STAFF_*` in backend, `NEXT_PUBLIC_STAFF_*` in compose `.env` / frontend | Ops UI + protected API routes |
| **Logistics customer** | `LOGISTICS_API_KEY`, `LOGISTICS_SECRET_KEY` in backend only | Webhooks to/from Logistics — set by `npm run setup` |

---

### Full Docker Setup (first time)

See root **`README.md`** for the complete checklist. Summary:

```bash
# from repo root — one-time
docker network create logistics_network

cd logistics-app && docker compose up --build -d
until curl -sf http://localhost:5001/api/health >/dev/null; do sleep 2; done

cd ../collection-app && docker compose up --build -d

cd ..
npm install
npm run setup   # skip if LOGISTICS_API_KEY=pk_... already in backend/.env
docker compose -f collection-app/docker-compose.yml restart collection_backend
```

Collection services:

- **PostgreSQL** on `5432`
- **Backend API** on `5000`
- **Frontend** on `3000`

---

### Daily re-up (already configured)

When databases and credentials already exist:

```bash
docker network create logistics_network 2>/dev/null || true
cd logistics-app && docker compose up -d
cd ../collection-app && docker compose up -d
```

Do **not** run `npm run setup` again unless you wiped the Logistics database.

---

### Rebuild

**Backend code or `backend/.env`:**

```bash
cd collection-app
docker compose up --build -d collection_backend
# or: docker compose restart collection_backend
```

**Staff keys changed in `collection-app/.env`:**

Frontends bake `NEXT_PUBLIC_*` at build time — rebuild without cache:

```bash
cd collection-app
docker compose build --no-cache collection_frontend
docker compose up -d collection_frontend
```

**After `npm run setup` updates `LOGISTICS_*`:**

```bash
docker compose restart collection_backend
```

---

### Development Mode

```bash
# database
cd collection-app
docker compose up collection_db -d

# backend
cd backend
npm install
# create .env manually (see Environment Variables section)
npm run setup
npm run dev            # http://localhost:5000

# frontend (new terminal)
cd ../frontend
npm install
# create .env.local manually
npm run dev            # http://localhost:3000
```

---

### Dev Container (VS Code)

Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension, open `collection-app` in VS Code, then choose **Reopen in Container**.

Inside the container:

```bash
cd backend
npm install
npm run setup
npm run dev

cd ../frontend
npm install
npm run dev
```

---

## Environment Variables

### Docker Compose (`collection-app/.env`)

Auto-loaded by Compose for frontend **build args**. Required for Docker UI auth.

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA site key for track form |
| `NEXT_PUBLIC_STAFF_API_KEY` | Must match `STAFF_API_KEY` in backend `.env` |
| `NEXT_PUBLIC_STAFF_SECRET_KEY` | Must match `STAFF_SECRET_KEY` in backend `.env` |

Copy from `.env.example` in this directory.

---

### Backend (`collection-app/backend/.env`)

| Variable               | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `PORT`                 | Backend HTTP port (default `5000`)            |
| `DATABASE_URL`         | PostgreSQL connection string                  |
| `API_URL`              | Logistics backend base URL                    |
| `LOGISTICS_API_KEY`    | Customer API key for Collection ↔ Logistics webhooks (from `npm run setup`) |
| `LOGISTICS_SECRET_KEY` | Customer secret for webhook HMAC signing (from `npm run setup`) |
| `STAFF_API_KEY`        | Staff API key for protected ops routes (shared with Logistics app) |
| `STAFF_SECRET_KEY`     | Staff secret for request HMAC signing (shared with Logistics app) |

Example (Docker):

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@collection_db:5432/collection_db
API_URL=http://logistics_backend:5001/api
LOGISTICS_API_KEY=<from-npm-run-setup>
LOGISTICS_SECRET_KEY=<from-npm-run-setup>
STAFF_API_KEY=<shared-staff-key>
STAFF_SECRET_KEY=<shared-staff-secret>
```

### Frontend (`collection-app/frontend/.env` or `.env.local`)

| Variable                         | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`            | Backend API base (include `/api`)  |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA site key for track form  |
| `NEXT_PUBLIC_STAFF_API_KEY`      | Staff API key (must match backend) |
| `NEXT_PUBLIC_STAFF_SECRET_KEY`   | Staff secret for HMAC signing      |

Used for local `npm run dev` only. Docker builds use `collection-app/.env` instead.

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<your-site-key>
NEXT_PUBLIC_STAFF_API_KEY=<shared-staff-key>
NEXT_PUBLIC_STAFF_SECRET_KEY=<shared-staff-secret>
```

---

## API authentication

| Route group | Auth |
| ----------- | ---- |
| `GET /health`, `POST /api/track` | Public (track is rate-limited) |
| Packages, dashboard, regions | Staff (`x-api-key` + `x-signature`) |
| `POST /api/raw-updates`, `/api/packages/raw-package-updates` | Customer webhook HMAC (`LOGISTICS_*`) |

If the UI returns **401**, staff keys in the frontend Docker image do not match the backend. Rebuild `collection_frontend` with `--no-cache` after updating `collection-app/.env`.

---

## API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint                            | Description |
| ------ | ----------------------------------- | ----------- |
| GET    | `/health`                           | Health check |
| GET    | `/api/regions`                      | List regions |
| GET    | `/api/packages`                     | List packages |
| POST   | `/api/packages`                     | Create package |
| PATCH  | `/api/packages/:id/status`          | Update package status |
| POST   | `/api/packages/raw-package-updates` | Receive raw status updates (alternate route) |
| POST   | `/api/raw-updates`                  | Receive raw status updates |
| GET    | `/api/dashboard`                    | Dashboard summary |
| POST   | `/api/track`                        | Track a package (requires captcha flag) |

### Response Structure

All APIs return:

```json
{
  "success": true,
  "status": 200,
  "message": "Human readable message",
  "data": {},
  "error": null
}
```

Dashboard summary (`GET /api/dashboard`) now includes:

- `statusSections`: package list + count for each status (`TO_BE_PICKED_UP`, `PICKED_UP`, `PROCESSING`, `IN_TRANSIT`, `SCHEDULED_FOR_DELIVERY`, `OUT_FOR_DELIVERY`, `DELAYED`, `DELIVERED`)
- `statusGraph`: ordered status flow with `label`, `count`, and `percentage` for collection-hub visualization

Validation error shape:

```json
{
  "success": false,
  "status": 400,
  "message": "Invalid request data",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "fieldErrors": {}
  }
}
```

### Create a Package — Example

Requires staff auth headers. For manual testing, sign an empty body for GET or the JSON body for POST (see root `README.md`).

```bash
# Generate signature (empty body for GET; use JSON string for POST)
export STAFF_API_KEY=<your-staff-key>
export STAFF_SECRET_KEY=<your-staff-secret>
BODY='{"senderName":"Alice","receiverName":"Bob","fromAddress":"Chennai","toAddress":"Bengaluru","weight":2.5,"regionCode":"SOUTH"}'
SIGN=$(node -e "const c=require('crypto'); console.log(c.createHmac('sha256', process.env.STAFF_SECRET_KEY).update(process.argv[1]).digest('hex'));" "$BODY")

curl -X POST http://localhost:5000/api/packages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $STAFF_API_KEY" \
  -H "x-signature: $SIGN" \
  -d "$BODY"
```

---

## Pages

| URL              | Description |
| ---------------- | ----------- |
| `/`              | Collection dashboard |
| `/new-package`   | Create package form |
| `/track-package` | Public tracking form |

---

## Background Jobs

### Raw Update Processor

Runs every **5 seconds** (`*/5 * * * * *`).

Flow:

```text
Logistics ETL push
      ↓
raw_package_updates table (processed = false)
      ↓
cron processor every 5s
      ↓
package status updated in packages table
      ↓
raw update marked processed = true
```

---

## Integration with Courier Logistics Application

### Webhook (outbound — App 1 → App 2)

When a package is created, Collection sends a signed request to:

- `POST /api/webhooks/packages` on Logistics

Headers used:

- `x-api-key` (customer key)
- `x-signature` (HMAC generated from payload using `LOGISTICS_SECRET_KEY`)

### ETL Raw Updates (inbound — App 2 → App 1)

Logistics sends raw update arrays to:

- `POST /api/raw-updates` (and legacy equivalent `/api/packages/raw-package-updates`)

Each update contains:

- `eventId` (uuid)
- `trackingId`
- `status`

Collection stores these in `RawPackageUpdate`, then background processing applies them.

---

## Package Statuses

Collection app status enum:

| Status             | Description |
| ------------------ | ----------- |
| `TO_BE_PICKED_UP`  | Created in collection office |
| `PICKED_UP`        | Picked by operations flow |
| `IN_TRANSIT`       | Moving through logistics network |
| `OUT_FOR_DELIVERY` | Final-mile stage |
| `DELAYED`          | Delayed shipment |
| `DELIVERED`        | Delivered |

---

## Database Tables

| Table              | Description |
| ------------------ | ----------- |
| `Region`           | Region master data (seeded) |
| `Package`          | Core package records + latest status |
| `Sale`             | Billing amount linked to package |
| `RawPackageUpdate` | Inbound ETL/raw status staging table |

---

## Docker Networking

This app joins external Docker network `logistics_network` and expects it to already exist.

| Container           | Hostname             | Port |
| ------------------- | -------------------- | ---- |
| Collection backend  | `collection_backend` | `5000` |
| Collection frontend | `collection_frontend` | `3000` |
| Collection postgres | `collection_db`      | `5432` (internal & host) |

---

## Project Structure

```text
collection-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validations/
│   │   ├── jobs/process-raw-updates.ts
│   │   ├── lib/
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── scripts/start.sh
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   ├── config/
│   │   └── types/
│   └── Dockerfile
├── .devcontainer/
└── docker-compose.yml
```

---

## Known Limitations

- Staff credentials are exposed to the browser in Phase 0 (`NEXT_PUBLIC_STAFF_*`); JWT + roles planned for Phase 2.
- Outbound package webhook to logistics uses an outbox with retry; failures surface as sync status on the package.
- Both `/api/raw-updates` and `/api/packages/raw-package-updates` exist for the same handler (duplicate ingestion routes).

---

## Related Applications

- **Courier Logistics Application** (`logistics-app`) — operations/back-office app for bags, trucks, routing, and customer onboarding.
