# Courier Logistics System — Architecture

## Overview

The system consists of two independent applications that together manage courier operations end-to-end: package intake, operational movement, and customer-visible tracking.

The split is intentional:

- **Collection App** handles front-office/customer-facing workflows.
- **Logistics App** handles internal hub operations and status propagation.

---

## The Two Applications

### App 1 — Collection Application (Customer-Facing)

The front-office/public-facing application.

**Who uses it:**

- Front-office staff to register packages
- Customers to track package status

**What it does (current implementation):**

- Creates packages with sender/receiver, addresses, weight, and region code
- Generates tracking IDs in `TRK-xxxxxxxx` format
- Stores bill amount in `Sale` (calculated from weight)
- Provides reCAPTCHA-based tracking UI
- Shows dashboard groups: pending, active, delayed, out for delivery, delivered
- Sends signed webhook to Logistics when package is created
- Receives ETL updates through raw update endpoint(s)
- Buffers updates in `RawPackageUpdate` and applies them asynchronously

**Status ownership:**

- App 1 sets initial status at creation (`TO_BE_PICKED_UP`)
- Subsequent statuses are operationally driven by Logistics and mirrored via ETL updates

---

### App 2 — Logistics Application (Internal / Back-Office)

The internal operations application.

**Who uses it:**

- Regional logistics/hub operators

**What it does (current implementation):**

- Receives packages from Collection through authenticated webhook
- Manages bags (create, assign package, seal, delay, complete)
- Manages trucks (create, load bag, status transitions)
- Cascades truck status transitions to bag/package statuses
- Maintains package status history records
- Pushes customer-specific status updates back to Collection on schedule
- Tracks customer integration health and disables unhealthy customers

---

## How the Two Apps Talk to Each Other

### Integration 1 — Webhook (Collection -> Logistics)

When Collection creates a package:

1. App 1 stores package + sale
2. App 1 sends `POST /api/webhooks/packages` to Logistics
3. Headers include:
   - `x-api-key`
   - `x-signature` (HMAC over JSON payload)
4. Logistics verifies API key + signature
5. Logistics stores package and initial status history

Payload currently includes fields from create package schema:

- `trackingId`
- `senderName`
- `receiverName`
- `fromAddress`
- `toAddress`
- `weight`
- `regionCode`

> Note: current webhook sender in Collection does not implement retry/backoff yet.

### Integration 2 — ETL Push Job (Logistics -> Collection)

Logistics runs cron every minute (`* * * * *`):

1. Gets active/retry-eligible customers
2. Fetches unprocessed `PackageStatusHistory` rows per customer
3. Maps logistics statuses to collection-facing statuses
4. Pushes updates array to each customer `webhookUrl`
5. On success, marks event IDs processed
6. On retryable failure, increments failure count and applies exponential backoff
7. Disables customer after repeated failures

Pushed update item shape:

- `eventId`
- `trackingId`
- `status` (mapped for Collection model)

### Integration 3 — Collection Raw Processor

Collection accepts updates at:

- `POST /api/raw-updates`
- `POST /api/packages/raw-package-updates` (alternate route to same handler)

Then a cron every 5 seconds:

1. Reads `RawPackageUpdate` rows where `processed = false`
2. Applies status update to `Package` by `trackingId`
3. Marks raw row processed

> Current flow has no confirmation callback endpoint from Collection back to Logistics.

---

## Package Status Flow

### Logistics status lifecycle (operational)

`TO_BE_PICKED_UP -> PICKED_UP -> ADDED_TO_BAG -> LOADED_ON_TRUCK -> EN_ROUTE -> ARRIVED_AT_REGION -> SCHEDULED_FOR_DELIVERY -> OUT_FOR_DELIVERY -> DELIVERED`

`DELAYED` can be applied as exception status.

### Collection status model

Collection persists:

- `TO_BE_PICKED_UP`
- `PICKED_UP`
- `IN_TRANSIT`
- `OUT_FOR_DELIVERY`
- `DELAYED`
- `DELIVERED`

### Cross-app mapping used by ETL

- `ADDED_TO_BAG`, `LOADED_ON_TRUCK`, `EN_ROUTE`, `ARRIVED_AT_REGION` -> `IN_TRANSIT`
- `SCHEDULED_FOR_DELIVERY`, `OUT_FOR_DELIVERY` -> `OUT_FOR_DELIVERY`
- `TO_BE_PICKED_UP`, `PICKED_UP`, `DELAYED`, `DELIVERED` -> unchanged

### Consistency model

Status visibility in Collection is eventually consistent:

- status changes happen first in Logistics
- reflected in Collection after ETL push + raw processing cycle

---

## Inter-Service Security — HMAC Authentication

### Customer onboarding in Logistics

Per customer, Logistics stores:

- `apiKey`
- `secretKey`
- `webhookUrl`
- health/retry fields (`failureCount`, `retryCount`, `nextRetryAt`, status)

### Verification flow (Collection -> Logistics webhook)

Logistics middleware:

1. Reads `x-api-key` and `x-signature`
2. Resolves customer from API key
3. Recomputes expected HMAC using customer secret
4. Uses constant-time comparison (`timingSafeEqual`)
5. Rejects unauthorized/invalid signatures

### ETL push signing (Logistics -> Collection)

For outbound updates, Logistics signs payload using the customer's secret and includes `x-api-key` + `x-signature`.

### Current security gap

Collection raw update endpoint currently validates payload schema but does not enforce API-key/HMAC middleware.

---

## Dev Containers

Both apps include `.devcontainer/` setup:

- Node 20 environment
- Prisma/Postgres tooling
- dedicated per-app dev Postgres service

Dev DB host ports:

- Collection dev DB: `5435`
- Logistics dev DB: `5434`

---

## Tech Stack

| Concern | Technology |
| ------- | ---------- |
| Language | TypeScript |
| Backend | Node.js + Express |
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4 |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Validation | Zod |
| Scheduling | node-cron |
| HTTP | Axios / Fetch |
| Containers | Docker + Docker Compose |
| Dev env | VS Code Dev Containers |

---

## Database Design

### App 1 — Collection

| Table | Description |
| ----- | ----------- |
| `Region` | Region master table |
| `Package` | Core package with latest status |
| `Sale` | Bill amount per package |
| `RawPackageUpdate` | ETL staging table (`eventId` unique, processed flag) |

### App 2 — Logistics

| Table | Description |
| ----- | ----------- |
| `Region` | Region master table |
| `Customer` | Integration identity, credentials, health state |
| `Package` | Operational package record |
| `Bag` | Bag grouping entity |
| `Truck` | Truck lifecycle entity |
| `TruckBag` | Join table for truck-loaded bags |
| `PackageStatusHistory` | Status audit + ETL processed marker |
| `EtlCheckpoint` | Checkpoint model |

---

## Docker Networking

Both apps use shared external network:

- `logistics_network`

Host ports:

| Service | Host Port |
| ------- | --------- |
| Collection frontend | `3000` |
| Collection backend | `5000` |
| Collection postgres | `5432` |
| Logistics frontend | `3001` |
| Logistics backend | `5001` |
| Logistics postgres | `5433` |

Container hostnames used in compose:

- `collection_backend`
- `logistics_backend`
- `collection_db`
- `logistics_db`

---

## Repository Structure

```text
courier-management-system/
├── collection-app/
│   ├── backend/
│   ├── frontend/
│   └── .devcontainer/
├── logistics-app/
│   ├── backend/
│   ├── frontend/
│   ├── shared/
│   └── .devcontainer/
├── setup/
│   └── setup.ts
├── README.md
└── architecture.md
```

---

## Known Limitations and Assumptions

**Route planning is out of scope.**  
Operators are assumed to know routes and select operational paths manually.

**Truck selection is manual.**  
No automatic truck optimization/assignment logic exists.

**Bag capacity is assumed, not enforced.**  
No capacity/weight threshold checks are implemented on bag assignment.

**Package-to-truck assignment is operator-driven.**  
Assignment is manual through bag + truck workflows.

**No strict direction validation.**  
Destination-to-bag direction validation is not enforced at assignment time.

**No automatic truck departure scheduler.**  
Truck status transitions are manual actions.

**Staff/operator UI authentication (Phase 0).**  
Human-facing routes require `x-api-key` + HMAC signature via shared staff credentials. JWT + roles are planned for Phase 2.

**No message queue backbone.**  
Current ETL delivery is HTTP + retries; not Kafka/SQS/RabbitMQ-based.

**Separate package_tracking table (App 1).**  
App 1 stores only latest status in `Package`. A dedicated `package_tracking` table with indexed `tracking_id` and `created_at DESC` would improve history and scale.

**Status lookup table.**  
Statuses are code enums/constants. A `package_status` table with `is_active` would enable data-driven status lifecycle management.

**Numeric primary keys.**  
Current models use string IDs (UUID/CUID style). BIGSERIAL internal keys plus public UUIDs would improve large JOIN performance.

**Bill of sale document output.**  
Sale values exist, but printable/downloadable PDF bill generation is not implemented.

**Inbound ETL endpoint hardening (App 1).**  
`/api/raw-updates` currently lacks API-key/HMAC middleware.

---

## Summary

The current architecture is a practical two-system split:

- Collection for customer/front-office flows
- Logistics for internal operations and status orchestration

The integration pattern (signed webhook + scheduled ETL push + async apply) works for current scope and leaves clear upgrade paths for auth, validation rigor, and queue-backed reliability at larger scale.
