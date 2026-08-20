# Idempotent Status Webhooks Implementation

## Problem Statement

**Issue:** When Collection app sends status update webhooks to Logistics, network failures or timeouts cause automatic retries. Each retry creates a duplicate `PackageStatusHistory` row, polluting the audit trail and causing ETL sync issues.

**Example scenario:**
```
1. Collection marks package TRK-12345 as DELIVERED
2. Creates outbound webhook event (id: abc-123)
3. Sends webhook to Logistics
4. Network timeout occurs
5. Collection retries same webhook
6. Logistics creates ANOTHER history row (duplicate!)
```

## Why Idempotency Matters

### 1. **Data Integrity**
- Audit trail must reflect actual state changes, not retry noise
- Each status transition should have exactly ONE history record

### 2. **ETL Sync Accuracy**
- Prevents duplicate status updates being pushed to customers
- Ensures billing/analytics based on status history are accurate

### 3. **Debugging & Operations**
- Clear timeline of package journey
- Easy to trace when issues occurred
- No confusion between actual changes vs. retry artifacts

### 4. **System Resilience**
- Enables safe retry behavior without side effects
- Webhooks can be retried indefinitely without data corruption

## Solution: Source Event ID

### How It Works

1. **Collection** stores each outbound webhook with a unique `id` (UUID)
2. When sending webhook, includes this `id` as `sourceEventId` in payload
3. **Logistics** checks if a `PackageStatusHistory` with this `sourceEventId` already exists
4. If found → skip processing, return 200 OK (idempotent!)
5. If new → process normally and store with `sourceEventId`

### Database Schema Changes

**Logistics `PackageStatusHistory` table:**
```prisma
model PackageStatusHistory {
  // ... existing fields
  sourceEventId String?
  
  @@unique([packageId, sourceEventId])
}
```

The unique constraint **guarantees** at the database level that the same event cannot create duplicate history rows.

## Implementation Details

### 1. Collection App Changes
- Modified `PackageStatusUpdatedPayload` type to include `sourceEventId`
- Updated `deliverPackageStatusUpdatedWebhook()` to inject event ID
- Event ID comes from the `OutboundWebhook.id` field

### 2. Logistics App Changes
- Added `sourceEventId` field to `PackageStatusHistory` model
- Added unique constraint on `(packageId, sourceEventId)`
- Updated validation schema to accept `sourceEventId`
- Modified service layer to check for existing history before processing
- Controller passes `sourceEventId` to service

### 3. Idempotency Flow
```typescript
// In updatePackageStatusByTrackingId():
if (options?.sourceEventId) {
  const existingHistory = await prisma.packageStatusHistory.findUnique({
    where: {
      packageId_sourceEventId: {
        packageId: existingPackage.id,
        sourceEventId: options.sourceEventId,
      },
    },
  });

  if (existingHistory) {
    // Already processed - return current state
    return prisma.package.findUniqueOrThrow({ where: { trackingId } });
  }
}
```

## Testing Instructions

### Manual Testing

1. **Setup:**
   ```bash
   cd logistics-app/backend
   npx prisma migrate dev
   cd ../../collection-app/backend
   npm run dev
   ```

2. **Simulate retry scenario:**
   ```bash
   # In Collection DB, find an outbound webhook
   SELECT * FROM "OutboundWebhook" WHERE "eventType" = 'PACKAGE_STATUS_UPDATED';
   
   # Note the trackingId and id
   # Manually send the same webhook twice using curl with same sourceEventId
   
   curl -X POST http://localhost:4000/api/webhooks/packages/status \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_API_KEY" \
     -H "x-signature: YOUR_SIGNATURE" \
     -d '{
       "trackingId": "TRK-12345678",
       "status": "DELIVERED",
       "sourceEventId": "abc-123-def-456"
     }'
   ```

3. **Verify:**
   ```sql
   -- Should only have ONE history row with this sourceEventId
   SELECT * FROM "PackageStatusHistory" 
   WHERE "sourceEventId" = 'abc-123-def-456';
   
   -- Count should be 1
   SELECT COUNT(*) FROM "PackageStatusHistory" 
   WHERE "sourceEventId" = 'abc-123-def-456';
   ```

### Integration Testing

1. **Create package in Collection**
2. **Update status to DELIVERED** (triggers outbound webhook)
3. **Force failure** by temporarily stopping Logistics backend
4. **Observe retry** in Collection outbound webhook processor logs
5. **Restart Logistics** and wait for retry
6. **Verify** only one PackageStatusHistory row exists for that status change

### Edge Cases to Test

1. ✅ **Webhook without sourceEventId** (backward compatibility)
   - Should still work, creates history without sourceEventId
   
2. ✅ **Same status, different sourceEventId**
   - Should create two history rows (different events)
   
3. ✅ **Same sourceEventId, different package**
   - Should work (constraint is on packageId + sourceEventId)
   
4. ✅ **Concurrent retries**
   - Unique constraint prevents race condition duplicates

## Migration & Rollout

### Development Environment
```bash
cd logistics-app/backend
npx prisma migrate dev --name add_source_event_id
```

### Production Deployment
```bash
# 1. Deploy Logistics first (backward compatible - accepts sourceEventId)
cd logistics-app/backend
npx prisma migrate deploy

# 2. Deploy Collection (starts sending sourceEventId)
cd ../../collection-app/backend
# Deploy your app

# 3. Monitor logs for any issues
```

### Rollback Plan
If issues arise:
1. Revert Collection deployment (stop sending sourceEventId)
2. Schema change is backward compatible - can leave in place
3. Or drop constraint if needed:
   ```sql
   DROP INDEX "PackageStatusHistory_packageId_sourceEventId_key";
   ALTER TABLE "PackageStatusHistory" DROP COLUMN "sourceEventId";
   ```

## Monitoring

### Key Metrics to Track

1. **Duplicate prevention rate:**
   ```sql
   SELECT COUNT(*) 
   FROM "PackageStatusHistory" 
   WHERE "sourceEventId" IS NOT NULL
   GROUP BY "sourceEventId" 
   HAVING COUNT(*) > 1;
   -- Should return 0 rows
   ```

2. **Webhook retry success:**
   ```sql
   -- Collection DB
   SELECT 
     "eventType",
     AVG("attempts") as avg_attempts,
     MAX("attempts") as max_attempts
   FROM "OutboundWebhook"
   WHERE "deliveredAt" IS NOT NULL
   GROUP BY "eventType";
   ```

3. **History growth rate:**
   ```sql
   SELECT DATE("createdAt") as date, COUNT(*) 
   FROM "PackageStatusHistory"
   GROUP BY DATE("createdAt")
   ORDER BY date DESC
   LIMIT 7;
   ```

## Benefits Achieved

✅ **No duplicate history rows** - Even with unlimited retries
✅ **Safe retry behavior** - Can retry webhooks without fear
✅ **Clean audit trail** - True reflection of package journey  
✅ **Accurate ETL sync** - No duplicate updates to customers
✅ **Database-level guarantee** - Unique constraint prevents race conditions
✅ **Backward compatible** - Existing webhooks still work

## References

- [Idempotency in APIs - Stripe Engineering](https://stripe.com/docs/api/idempotent_requests)
- [Designing robust and predictable APIs with idempotency](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
- RFC 7231: HTTP/1.1 Semantics and Content (Safe and Idempotent Methods)
