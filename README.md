# Logistics Operations Hub

A full-stack distributed courier logistics platform built as two independent applications that communicate through secure webhooks and scheduled ETL synchronization.

The platform is designed to mirror real-world courier operations, from customer package drop-off to final delivery, while keeping customer-facing and operations-facing responsibilities clearly separated.

---

# The Two Applications

## App 1 — Courier Collection Application

The customer-facing application.

Used by:

* Collection office staff to register packages
* Customers to track shipment progress
* Local delivery teams to manage last-mile delivery

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

* Package routing
* Bag management
* Truck management
* Regional hub operations
* Customer onboarding
* Secure webhook processing
* ETL synchronization
* Operational status tracking

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

* API Key
* Secret Key
* Customer configuration
* Registered webhook endpoint

These credentials uniquely identify each Collection application and are used for all future communication.

---

## 2. Package Creation Webhook (Collection → Logistics)

Whenever a package is registered in the Collection application, a webhook is sent to the Logistics platform.

The webhook contains:

* Package details
* Origin region
* Destination region
* Tracking ID

Authentication is performed using:

* API Key
* HMAC Signature

Only authenticated Collection applications are allowed to create packages.

---

## 3. ETL Synchronization (Logistics → Collection)

The Logistics platform periodically synchronizes package status updates back to each registered Collection application.

The ETL process performs:

* Extract pending package updates
* Transform operational statuses into customer-facing statuses
* Load updates into the Collection application

Updates are grouped by customer and delivered only to the customer's registered webhook.

Only unsynchronized package status changes are transmitted, ensuring efficient synchronization.

---

## 4. Customer Health Monitoring

The Logistics platform continuously monitors webhook delivery health.

Failed deliveries:

* Increase customer failure count
* Retry using exponential backoff
* Record last successful and failed communication
* Automatically disable unhealthy customers after repeated failures

This prevents continuously sending requests to unavailable systems.

---

# Security

## API Key Authentication

Each Collection application receives a unique API key during onboarding.

Every incoming webhook request is validated before processing.

Requests with invalid or missing API keys are rejected with **401 Unauthorized**.

---

## HMAC Request Signing

Every webhook request is digitally signed using the customer's secret key.

The Logistics platform independently regenerates the expected signature and compares it against the received signature.

This protects against:

* Payload tampering
* Request spoofing
* Unauthorized webhook calls

---

# First-Time Setup

## 1. Start the Logistics Backend

```bash
cd logistics-app
docker compose up postgres -d

cd backend
npm run dev
```

---

## 2. Register the Collection Application

```bash
curl -X POST http://localhost:5001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Collection App",
    "email":"collection@example.com",
    "webhookUrl":"http://localhost:5000/api/raw-updates"
  }'
```

Example response:

```json
{
  "apiKey": "pk_xxxxxxxxx",
  "secretKey": "sk_xxxxxxxxx"
}
```

---

## 3. Configure Collection Backend

Create:

```text
collection-app/backend/.env
```

```env
PORT=5000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/collection_db

API_URL=http://localhost:5001/api

# Generated during customer onboarding
LOGISTICS_API_KEY=<generated-api-key>
LOGISTICS_SECRET_KEY=<generated-secret-key>
```

Restart the Collection backend after updating the environment variables.

---

## 4. Docker Configuration

When running inside Docker, applications communicate using container names.

Collection backend:

```env
API_URL=http://logistics_backend:5001/api
```

Customer onboarding example:

```json
{
  "webhookUrl": "http://collection_backend:5000/api/raw-updates"
}
```

---

# Environment Variables

## Collection Backend

```env
PORT=5000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/collection_db

API_URL=http://localhost:5001/api

LOGISTICS_API_KEY=<generated-api-key>

LOGISTICS_SECRET_KEY=<generated-secret-key>
```

---

## Logistics Backend

```env
PORT=5001

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/logistics_db
```

---

## Notes

* Never commit `.env` files.
* Keep API keys and secret keys private.
* API keys are generated during customer onboarding.
* Restart the backend whenever environment variables are modified.

---

# Why Two Independent Applications?

Separating Collection and Logistics provides several advantages:

* Clear ownership between customer-facing and operational workflows
* Independent deployment and scaling
* Better fault isolation
* Easier maintenance
* Realistic enterprise architecture
* Secure inter-service communication

---

# Running the Project

## Docker

### Collection Application

```bash
cd collection-app
docker compose up --build
```

### Logistics Application

```bash
cd logistics-app
docker compose up --build
```

---

# Development Mode

```bash
# Collection PostgreSQL
cd collection-app
docker compose up postgres -d

# Collection Backend
cd backend
npm run dev
```

```bash
# Collection Frontend
cd collection-app/frontend
npm run dev
```

```bash
# Logistics PostgreSQL
cd logistics-app
docker compose up postgres -d

# Logistics Backend
cd backend
npm run dev
```

```bash
# Logistics Frontend
cd logistics-app/frontend
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
| Package Registration           | ✅      |
| Customer Package Tracking      | ✅      |
| Bag Management                 | ✅      |
| Truck Management               | ✅      |
| Regional Routing               | ✅      |
| Package Status History         | ✅      |
| Customer Onboarding            | ✅      |
| API Key Authentication         | ✅      |
| HMAC Request Signing           | ✅      |
| Secure Webhook Integration     | ✅      |
| ETL Synchronization            | ✅      |
| Customer-specific ETL          | ✅      |
| Idempotent Processing          | ✅      |
| Retry with Exponential Backoff | ✅      |
| Customer Health Monitoring     | ✅      |

---

# Project Structure

```text
courier-management-system/
│
├── collection-app/
│   ├── backend/
│   ├── frontend/
│   └── README.md
│
├── logistics-app/
│   ├── backend/
│   ├── frontend/
│   ├── shared/
│   └── README.md
│
└── README.md
```

---

# Documentation

* Root README (Project Overview)
* Collection Application README
* Logistics Application README

Each application contains its own documentation covering setup, architecture, API endpoints, and implementation details.
