#!/bin/sh

set -e

echo "Waiting for postgres..."

# If any command fails, stop immediately.
until nc -z logistics_db 5432
do
  sleep 1
done

echo "Postgres is ready"

echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx prisma db seed

echo "Starting server..."
node dist/backend/src/app.js