# Courier Logistics Application

The back-office application of the Logistics Operations Hub. Used by regional hub operators to manage packages, bags, trucks, and inter-app synchronization.

Not intended for public/customer access.

---

## What This App Does

- Receives new packages from the Collection app via authenticated webhook
- Supports package assignment into bags and bag sealing workflow
- Supports loading sealed bags to trucks
- Manages truck lifecycle transitions: `SCHEDULED/LOADED/DEPARTED/ARRIVED/DELAYED`
- Cascades status updates from truck operations to bags and packages
- Stores package status history for outbound ETL synchronization
- Pushes customer-specific status updates to each registered collection webhook every minute
- Applies retry windows with exponential backoff for failed customer webhook deliveries
- Disables unhealthy customers after repeated retryable failures

---

## Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Backend          | Node.js + Express + TypeScript          |
| Frontend         | Next.js 16 + React 19 + Tailwind CSS 4 |
| Database         | PostgreSQL 16                           |
| ORM              | Prisma 7                                |
| Job Scheduler    | node-cron                               |
| Containerization | Docker + Docker Compose                 |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js 20+ (for local dev)

---

## Running the App

### Before you start

```bash
cp backend/.env.example backend/.env
cp .env.example .env                    # compose-level — frontend Docker build
cp frontend/.env.example frontend/.env.local  # optional; for local npm run dev
```

Set **staff keys** (same value in backend `.env`, compose `.env`, and frontend env). See root `README.md` for the full file map.

| Credential | Variables | Purpose |
| ---------- | --------- | ------- |
| **Staff** | `STAFF_*` / `NEXT_PUBLIC_STAFF_*` | Ops UI + protected API routes |
| **Logistics customer** | Stored in DB per customer | Webhooks from Collection apps — not in logistics backend `.env` |

---

### Full Docker Setup (first time)

Logistics must be running before Collection setup. See root **`README.md`** for the full flow.

```bash
docker network create logistics_network

cd logistics-app
docker compose up --build -d
```

Services started:

- **PostgreSQL** on `5433` (host)
- **Backend API** on `5001`
- **Frontend** on `3001`

Open UI at: `http://localhost:3001`

Then start Collection and run root `npm run setup` (see `collection-app/README.md`).

---

### Daily re-up

```bash
docker network create logistics_network 2>/dev/null || true
cd logistics-app && docker compose up -d
```

No setup script needed for Logistics alone.

---

### Rebuild

**Backend:**

```bash
docker compose up --build -d logistics_backend
```

**Frontend after staff key change:**

```bash
docker compose build --no-cache logistics_frontend
docker compose up -d logistics_frontend
```

---

### Stop / reset

```bash
docker compose down      # keep data
docker compose down -v   # wipe database (requires re-running Collection npm run setup)
```

---

### Development Mode

```bash
# database
cd logistics-app
docker compose up logistics_db -d

# backend
cd backend
npm install
# create .env manually (see Environment Variables section)
npm run setup
npm run dev            # API available through configured PORT

# frontend (new terminal)
cd ../frontend
npm install
# create .env.local manually
npm run dev            # http://localhost:3001 (if default next dev port changed, follow terminal output)
```

---

### Dev Container (VS Code)

Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension, open `logistics-app` in VS Code, then choose **Reopen in Container**.

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

### Docker Compose (`logistics-app/.env`)

Auto-loaded by Compose for frontend **build args**.

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_STAFF_API_KEY` | Must match `STAFF_API_KEY` in backend `.env` |
| `NEXT_PUBLIC_STAFF_SECRET_KEY` | Must match `STAFF_SECRET_KEY` in backend `.env` |

Copy from `.env.example` in this directory.

---

### Backend (`logistics-app/backend/.env`)

| Variable       | Purpose |
| -------------- | ------- |
| `PORT`             | Backend HTTP port (default `5001`) |
| `DATABASE_URL`     | PostgreSQL connection string       |
| `STAFF_API_KEY`    | Staff API key for protected routes |
| `STAFF_SECRET_KEY` | Staff secret for request HMAC      |

Example (Docker):

```env
PORT=5001
DATABASE_URL=postgresql://postgres:postgres@logistics_db:5432/logistics_db
STAFF_API_KEY=<shared-staff-key>
STAFF_SECRET_KEY=<shared-staff-secret>
```

### Frontend (`logistics-app/frontend/.env.local`)

| Variable              | Purpose |
| --------------------- | ------- |
| `NEXT_PUBLIC_API_URL`          | Backend API base (include `/api`)  |
| `NEXT_PUBLIC_STAFF_API_KEY`    | Staff API key (must match backend) |
| `NEXT_PUBLIC_STAFF_SECRET_KEY` | Staff secret for HMAC signing      |

Used for local `npm run dev`. Docker builds use `logistics-app/.env` instead.

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_STAFF_API_KEY=<shared-staff-key>
NEXT_PUBLIC_STAFF_SECRET_KEY=<shared-staff-secret>
```

### Setup script (`setup/.env` at repo root)

Required for `npm run setup` when registering Collection as a customer:

```env
LOGISTICS_URL=http://localhost:5001/api
COLLECTION_WEBHOOK_URL=http://collection_backend:5000/api/raw-updates
STAFF_API_KEY=<same-as-backend>
STAFF_SECRET_KEY=<same-as-backend>
```

---

## API authentication

| Route group | Auth |
| ----------- | ---- |
| `GET /api/health` | Public |
| Packages, bags, trucks, regions | Staff (`x-api-key` + `x-signature`) |
| `POST /api/customers` | Staff (admin onboarding) |
| `POST /api/webhooks/*`, `POST /api/etl/confirm` | Customer webhook HMAC (per registered Collection app) |

`POST /api/customers` never returns `secretKey` in the response. Root `npm run setup` generates customer keys locally and sends them in the request body.

---

## API Endpoints

Base URL: `http://localhost:5001/api`

### Health

| Method | Endpoint  | Description |
| ------ | --------- | ----------- |
| GET    | `/health` | Health check |

### Webhook (authenticated)

| Method | Endpoint             | Description |
| ------ | -------------------- | ----------- |
| POST   | `/webhooks/packages` | Receive package from Collection app |

### Packages

| Method | Endpoint            | Description |
| ------ | ------------------- | ----------- |
| GET    | `/packages`         | List packages |
| GET    | `/packages/loaded`  | List loaded packages with truck/bag details |
| PATCH  | `/packages/:id/status` | Update package status |

### Bags

| Method | Endpoint                | Description |
| ------ | ----------------------- | ----------- |
| POST   | `/bags`                 | Create bag |
| GET    | `/bags`                 | List active bags |
| GET    | `/bags/:bagNumber`      | Bag details |
| POST   | `/bags/assign`          | Assign package to bag |
| POST   | `/bags/seal`            | Seal bag |
| POST   | `/bags/delay`           | Mark bag delayed |
| PATCH  | `/bags/:bagNumber/complete` | Mark bag completed |

### Trucks

| Method | Endpoint                         | Description |
| ------ | -------------------------------- | ----------- |
| POST   | `/trucks`                        | Create truck |
| GET    | `/trucks`                        | List trucks |
| GET    | `/trucks/:truckNumber`           | Truck details |
| POST   | `/trucks/load-bag`               | Load sealed bag onto truck |
| POST   | `/trucks/arrive`                 | Arrived-truck transition endpoint |
| PATCH  | `/trucks/:truckNumber/status`    | Update truck status (`DEPARTED/ARRIVED/DELAYED`) |

### Customers

| Method | Endpoint      | Description |
| ------ | ------------- | ----------- |
| POST   | `/customers`  | Register collection customer + generate API credentials |

### Regions

| Method | Endpoint   | Description |
| ------ | ---------- | ----------- |
| GET    | `/regions` | List regions |

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

---

## Frontend Pages

| URL         | Description |
| ----------- | ----------- |
| `/`         | Operations dashboard |
| `/packages` | Package list view |
| `/trucks`   | Trucks view |

---

## Hub Operator Workflow

### Receiving New Packages

Packages are received from Collection app webhook (`/api/webhooks/packages`) after customer onboarding.

### Processing Packages

```text
1. Create a bag
2. Assign package(s) to the bag
3. Seal the bag
4. Create a truck
5. Load bag onto truck
6. Update truck status (depart/arrive/delay)
```

### At Each Hub

When truck status is moved to `ARRIVED`, the backend:

- marks truck as `ARRIVED`
- marks linked bags as `COMPLETED`
- updates linked packages to `ARRIVED_AT_REGION`
- creates corresponding status history records

### Delayed Truck Handling

When truck status is moved to `DELAYED`, the backend:

- marks linked bags as `DELAYED`
- marks linked packages as `DELAYED`
- records status history entries

---

## ETL Push Job

Runs every **1 minute** (`* * * * *`).

Flow:

```text
find ACTIVE customers that are eligible to retry
        ↓
collect unprocessed package status history by customer
        ↓
map statuses for collection-facing model
        ↓
POST to each customer webhook with x-api-key + x-signature
        ↓
success -> mark histories processed + reset failure counters
failure -> retry window/backoff + eventually disable customer
```

Retry strategy:

- exponential delay starts at 10s and caps at 10m
- customer is disabled at failure count `>= 5`

---

## Inter-Service Security

### Staff routes (Phase 0)

Ops UI routes require shared staff credentials (`STAFF_API_KEY` + HMAC signature). Same keys as Collection backend.

### Webhook routes

Inbound package webhook is protected by:

- `x-api-key` lookup against registered customer
- HMAC signature validation (`x-signature`) with customer secret
- constant-time signature comparison

Outbound ETL pushes are signed per customer using the same credential pair.

---

## Package Statuses

| Status                   | Description |
| ------------------------ | ----------- |
| `TO_BE_PICKED_UP`        | Initial package created from collection webhook |
| `PICKED_UP`              | Picked up stage |
| `ADDED_TO_BAG`           | Assigned to bag |
| `LOADED_ON_TRUCK`        | Bag loaded to truck |
| `EN_ROUTE`               | Truck departed / transit |
| `ARRIVED_AT_REGION`      | Truck arrived at region |
| `SCHEDULED_FOR_DELIVERY` | Ready for final delivery |
| `OUT_FOR_DELIVERY`       | Out for final delivery |
| `DELAYED`                | Delayed |
| `DELIVERED`              | Delivered |

## Bag Statuses

| Status      | Description |
| ----------- | ----------- |
| `OPEN`      | Bag created and accepting packages |
| `SEALED`    | Ready to be loaded |
| `LOADED`    | Loaded onto truck |
| `IN_TRANSIT`| In truck transit |
| `DELAYED`   | Delayed bag |
| `COMPLETED` | Completed after arrival flow |

## Truck Statuses

| Status      | Description |
| ----------- | ----------- |
| `SCHEDULED` | Created |
| `LOADED`    | Has loaded bag(s) |
| `DEPARTED`  | Journey started |
| `ARRIVED`   | Reached destination region |
| `DELAYED`   | Delayed |

---

## Database Tables

| Table                  | Description |
| ---------------------- | ----------- |
| `Region`               | Region master data (seeded) |
| `Customer`             | Collection-customer credentials + delivery health metadata |
| `Package`              | Package operational record |
| `Bag`                  | Bag entities |
| `Truck`                | Truck entities |
| `TruckBag`             | Truck-bag assignment join table |
| `PackageStatusHistory` | Status audit + ETL processed marker |
| `EtlCheckpoint`        | ETL checkpoint record |

---

## Docker Networking

This app joins external Docker network `logistics_network` and expects it to already exist.

| Container          | Hostname            | Port |
| ------------------ | ------------------- | ---- |
| Logistics backend  | `logistics_backend` | `5000` internal / `5001` host |
| Logistics frontend | `logistics_frontend`| `3000` internal / `3001` host |
| Logistics postgres | `logistics_db`      | `5432` internal / `5433` host |

---

## Project Structure

```text
logistics-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middlewares/verifyWebhook.ts
│   │   ├── validations/
│   │   ├── jobs/push-status-updates.ts
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
│   │   └── helpers/
│   └── Dockerfile
├── shared/
│   ├── enums/
│   ├── types/
│   └── index.ts
├── .devcontainer/
└── docker-compose.yml
```

---

## Known Limitations

- Header navigation includes `/bags`, but there is currently no dedicated `frontend/src/app/bags/page.tsx`.
- `POST /api/trucks/arrive` route does not include a `:truckNumber` param, while controller logic expects one.
- `GET /api/trucks` currently responds with HTTP status `201` instead of `200`.
- Bag delay endpoint marks bag as delayed, but does not cascade package status/history in that specific handler.

---

## Related Applications

- **Courier Collection Application** (`collection-app`) — front-office package creation and customer tracking app.
