# Email Queue & Rate Limiting Guide

## Overview

The platform uses **BullMQ** with Redis for scalable, reliable email sending with automatic retries and rate limiting.

## Features

### ✅ Rate Limiting
- Configurable emails per second
- Default: 14 emails/sec (AWS SES sandbox limit)
- Production: Up to 50 emails/sec (SES production)

### ✅ Exponential Backoff Retry
- Automatic retry on failures
- Default: 5 attempts
- Delays: 2s → 4s → 8s → 16s → 32s

### ✅ Job Persistence
- Jobs survive server restarts
- Redis-backed queue
- Failed job tracking

### ✅ Concurrency Control
- Parallel job processing
- Default: 5 concurrent jobs
- Adjustable based on server capacity

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Email Queue Settings
EMAIL_RATE_LIMIT=14          # Emails per second
EMAIL_CONCURRENCY=5          # Parallel jobs
EMAIL_RETRY_ATTEMPTS=5       # Max retry attempts
EMAIL_RETRY_DELAY=2000       # Initial delay in ms (exponential)
```

### Rate Limits by Provider

**AWS SES:**
- Sandbox: 1 email/sec (increase to 14 after verification)
- Production: 14-50 emails/sec (request increase)

**SendGrid:**
- Free: No rate limit (but 100 emails/day)
- Paid: Unlimited

**Mailgun:**
- Free: 100 emails/hour
- Paid: Configurable

**Self-Hosted SMTP:**
- Depends on your server capacity
- Recommended: 10-20 emails/sec

## How It Works

### 1. Campaign Sending Flow

```typescript
// When campaign is sent
POST /campaigns/:id/send

// System creates jobs for each contact
for (const contact of contacts) {
  await emailQueue.add('send', {
    to: contact.email,
    subject: 'Your Subject',
    html: '<html>...</html>',
  }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 }
  });
}
```

### 2. Worker Processing

```typescript
// Worker picks up jobs respecting rate limits
@Processor('email-send', {
  limiter: { max: 14, duration: 1000 },  // 14 per second
  concurrency: 5                          // 5 parallel jobs
})
```

### 3. Retry Logic

**On Failure:**
- Attempt 1: Immediate
- Attempt 2: Wait 2 seconds
- Attempt 3: Wait 4 seconds
- Attempt 4: Wait 8 seconds
- Attempt 5: Wait 16 seconds
- After 5 failures: Mark as failed

## Monitoring

### Check Queue Status

```bash
# Using Redis CLI
redis-cli

# View pending jobs
LLEN bull:email-send:wait

# View active jobs
LLEN bull:email-send:active

# View failed jobs
LLEN bull:email-send:failed
```

### BullBoard (Optional Dashboard)

Install BullBoard for visual monitoring:

```bash
npm install @bull-board/api @bull-board/nestjs
```

## Scaling Strategies

### 1. Vertical Scaling
Increase rate limits and concurrency:

```bash
EMAIL_RATE_LIMIT=50
EMAIL_CONCURRENCY=10
```

### 2. Horizontal Scaling
Run multiple worker processes:

```bash
# Terminal 1
npm run start

# Terminal 2 (worker only)
npm run start:worker

# Terminal 3 (another worker)
npm run start:worker
```

### 3. Dedicated Workers
Separate API and worker servers:

**API Server:**
- Handles HTTP requests
- Enqueues jobs only

**Worker Servers:**
- Process email jobs
- Multiple instances for scale

## Performance Optimization

### Batch Processing

For large campaigns (10,000+ contacts):

```typescript
// Process in batches
const batchSize = 1000;
for (let i = 0; i < contacts.length; i += batchSize) {
  const batch = contacts.slice(i, i + batchSize);
  await Promise.all(
    batch.map(contact => emailQueue.add('send', {...}))
  );
  // Small delay between batches
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### Priority Queues

Add priority for transactional emails:

```typescript
// High priority (transactional)
await emailQueue.add('send', data, { priority: 1 });

// Normal priority (campaigns)
await emailQueue.add('send', data, { priority: 10 });
```

## Troubleshooting

### Jobs Not Processing

**Check Redis:**
```bash
redis-cli ping
# Should return: PONG
```

**Check Worker:**
```bash
# Ensure worker is running
ps aux | grep node
```

### High Failure Rate

**Check SMTP credentials:**
```bash
# Test SMTP connection
npm run test:smtp
```

**Review error logs:**
```typescript
// Check failed jobs
const failed = await emailQueue.getFailed();
console.log(failed.map(j => j.failedReason));
```

### Rate Limit Errors

**Reduce rate limit:**
```bash
EMAIL_RATE_LIMIT=10  # Lower from 14
```

**Add delays:**
```bash
EMAIL_RETRY_DELAY=5000  # Increase from 2000ms
```

## Best Practices

1. **Start Conservative**
   - Begin with low rate limits
   - Gradually increase based on success rate

2. **Monitor Bounces**
   - Track bounce rates
   - Remove invalid emails
   - Maintain sender reputation

3. **Separate Queues**
   - Transactional emails: High priority queue
   - Marketing campaigns: Separate queue

4. **Clean Up Jobs**
   - Remove completed jobs regularly
   - Archive failed jobs for analysis

5. **Test Before Scale**
   - Test with small campaigns first
   - Verify deliverability
   - Check spam scores

## Production Checklist

- [ ] Configure production SMTP credentials
- [ ] Set appropriate rate limits
- [ ] Enable job cleanup
- [ ] Set up monitoring/alerts
- [ ] Configure retry attempts
- [ ] Test failover scenarios
- [ ] Document runbook procedures
- [ ] Set up log aggregation

## Example Configurations

### Development (Mailtrap)
```bash
EMAIL_RATE_LIMIT=5
EMAIL_CONCURRENCY=2
EMAIL_RETRY_ATTEMPTS=3
```

### Production (AWS SES)
```bash
EMAIL_RATE_LIMIT=14
EMAIL_CONCURRENCY=5
EMAIL_RETRY_ATTEMPTS=5
```

### High Volume (SendGrid)
```bash
EMAIL_RATE_LIMIT=50
EMAIL_CONCURRENCY=10
EMAIL_RETRY_ATTEMPTS=3
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f backend`
- Review Redis: `redis-cli monitor`
- Test SMTP: Use Mailtrap for debugging
