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

### Full Docker Setup (Recommended)

From repository root:

```bash
# one-time network setup
docker network create logistics_network

# start logistics first (required for webhook target)
cd logistics-app
docker compose up --build -d

# start collection
cd ../collection-app
docker compose up --build -d
```

Collection services:

- **PostgreSQL** on `5432`
- **Backend API** on `5000`
- **Frontend** on `3000`

Then register this collection app as a customer in logistics:

```bash
cd ..
npm install
npm run setup
docker compose -f collection-app/docker-compose.yml restart collection_backend
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

### Backend (`collection-app/backend/.env`)

| Variable               | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `PORT`                 | Backend HTTP port (default `5000`)            |
| `DATABASE_URL`         | PostgreSQL connection string                  |
| `API_URL`              | Logistics backend base URL                    |
| `LOGISTICS_API_KEY`    | Customer API key issued by logistics          |
| `LOGISTICS_SECRET_KEY` | Customer secret used for webhook HMAC signing |

Example (safe placeholders only):

```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/collection_db
API_URL=http://localhost:5001/api
LOGISTICS_API_KEY=<issued-by-logistics>
LOGISTICS_SECRET_KEY=<issued-by-logistics>
```

### Frontend (`collection-app/frontend/.env.local`)

| Variable                         | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`            | Backend API base (include `/api`)  |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA site key for track form  |

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<your-site-key>
```

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

```bash
curl -X POST http://localhost:5000/api/packages \
  -H "Content-Type: application/json" \
  -d '{
    "senderName":"Alice",
    "receiverName":"Bob",
    "fromAddress":"Chennai",
    "toAddress":"Bengaluru",
    "weight":2.5,
    "regionCode":"SOUTH"
  }'
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

- The backend checks only a `captchaVerified` flag (`0`/`1`) and does not verify captcha tokens server-side.
- `/api/raw-updates` currently has no API-key/HMAC middleware.
- Outbound package webhook to logistics does not use retry/backoff logic in the collection service.
- Both `/api/raw-updates` and `/api/packages/raw-package-updates` exist for the same handler (duplicate ingestion routes).

---

## Related Applications

- **Courier Logistics Application** (`logistics-app`) — operations/back-office app for bags, trucks, routing, and customer onboarding.
