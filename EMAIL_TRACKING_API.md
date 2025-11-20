# Email Tracking API Guide

## Overview

Track every email sent through campaigns with detailed per-contact metrics, engagement data, and retry capabilities.

## Campaign Email Tracking

### Email Status Flow

```
PENDING → SENDING → SENT → DELIVERED
                      ↓
                   FAILED (retryable)
                      ↓
                   BOUNCED / COMPLAINED
```

### Status Definitions

- **PENDING** - Queued for sending
- **SENDING** - Currently being sent
- **SENT** - Successfully sent to SMTP server
- **DELIVERED** - Confirmed delivery (via webhook)
- **FAILED** - Send failed (can retry)
- **BOUNCED** - Hard/soft bounce
- **COMPLAINED** - Marked as spam

## API Endpoints

### 1. Get Campaign Statistics

Get aggregate stats for a campaign.

```bash
GET /campaigns/:workspaceId/:campaignId/stats
```

**Response:**
```json
{
  "campaign": {
    "id": "uuid",
    "name": "Summer Sale 2025",
    "status": "sent",
    "sentAt": "2025-01-15T10:00:00Z"
  },
  "summary": {
    "total": 10000,
    "sent": 9950,
    "delivered": 9900,
    "bounced": 50,
    "complained": 5,
    "uniqueOpens": 4500,
    "uniqueClicks": 1200,
    "totalOpens": 8500,
    "totalClicks": 2400,
    "openRate": "45.00",
    "clickRate": "12.00",
    "clickToOpenRate": "26.67"
  },
  "byStatus": [
    { "status": "sent", "count": 9950 },
    { "status": "delivered", "count": 9900 },
    { "status": "bounced", "count": 50 }
  ]
}
```

### 2. Get All Recipients

List all recipients with their engagement metrics.

```bash
GET /campaigns/:workspaceId/:campaignId/recipients
```

**Response:**
```json
[
  {
    "id": "campaign-email-uuid",
    "contact": {
      "id": "contact-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "status": "delivered",
    "sentAt": "2025-01-15T10:05:00Z",
    "deliveredAt": "2025-01-15T10:05:30Z",
    "openCount": 3,
    "clickCount": 1,
    "lastOpenedAt": "2025-01-16T14:30:00Z",
    "lastClickedAt": "2025-01-15T15:20:00Z"
  }
]
```

### 3. Get Recipient Details

Get detailed tracking for a specific contact.

```bash
GET /campaigns/:workspaceId/:campaignId/recipients/:contactId
```

**Response:**
```json
{
  "id": "campaign-email-uuid",
  "contact": {
    "id": "contact-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "status": "delivered",
  "sentAt": "2025-01-15T10:05:00Z",
  "deliveredAt": "2025-01-15T10:05:30Z",
  "openCount": 3,
  "clickCount": 1,
  "lastOpenedAt": "2025-01-16T14:30:00Z",
  "lastClickedAt": "2025-01-15T15:20:00Z",
  "events": [
    {
      "type": "sent",
      "timestamp": "2025-01-15T10:05:00Z",
      "metadata": { "messageId": "abc123" }
    },
    {
      "type": "delivered",
      "timestamp": "2025-01-15T10:05:30Z",
      "metadata": {}
    },
    {
      "type": "opened",
      "timestamp": "2025-01-15T14:20:00Z",
      "metadata": { "userAgent": "Mozilla/5.0...", "ip": "192.168.1.1" }
    },
    {
      "type": "clicked",
      "timestamp": "2025-01-15T15:20:00Z",
      "metadata": { "url": "https://example.com/product" }
    }
  ]
}
```

### 4. Retry Failed Emails

Retry all failed emails in a campaign.

```bash
POST /campaigns/:workspaceId/:campaignId/retry-failed
```

**Response:**
```json
{
  "message": "Retrying 15 failed emails",
  "retried": 15,
  "total": 15
}
```

### 5. Retry Single Recipient

Retry email for a specific contact.

```bash
POST /campaigns/:workspaceId/:campaignId/recipients/:contactId/retry
```

**Response:**
```json
{
  "message": "Email queued for retry",
  "campaignEmailId": "uuid",
  "contact": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## Event Types

### Email Events

Each action creates an `EmailEvent` record:

| Event Type | Description | Metadata |
|------------|-------------|----------|
| `sent` | Email sent to SMTP | `messageId` |
| `delivered` | Confirmed delivery | `timestamp` |
| `opened` | Email opened | `userAgent`, `ip` |
| `clicked` | Link clicked | `url`, `userAgent`, `ip` |
| `bounced` | Delivery failed | `bounceType`, `reason` |
| `complained` | Marked as spam | `feedbackType` |
| `unsubscribed` | User unsubscribed | `method` |

## Tracking Metrics

### Per-Contact Metrics

**CampaignEmail Entity:**
```typescript
{
  status: EmailStatus,
  sentAt: Date,
  deliveredAt: Date,
  openCount: number,        // Total opens
  clickCount: number,       // Total clicks
  lastOpenedAt: Date,       // Most recent open
  lastClickedAt: Date,      // Most recent click
  messageId: string,        // SMTP message ID
  error: string             // Error message if failed
}
```

### Campaign-Level Metrics

- **Total Recipients** - All contacts targeted
- **Sent** - Successfully sent
- **Delivered** - Confirmed delivery
- **Bounced** - Failed delivery
- **Complained** - Spam reports
- **Unique Opens** - Contacts who opened
- **Unique Clicks** - Contacts who clicked
- **Total Opens** - All open events
- **Total Clicks** - All click events
- **Open Rate** - (Unique Opens / Total) × 100
- **Click Rate** - (Unique Clicks / Total) × 100
- **Click-to-Open Rate** - (Unique Clicks / Unique Opens) × 100

## Usage Examples

### Monitor Campaign Performance

```typescript
// Get campaign stats
const stats = await fetch(
  `/campaigns/${workspaceId}/${campaignId}/stats`
);

console.log(`Open Rate: ${stats.summary.openRate}%`);
console.log(`Click Rate: ${stats.summary.clickRate}%`);
```

### Find Engaged Contacts

```typescript
// Get all recipients
const recipients = await fetch(
  `/campaigns/${workspaceId}/${campaignId}/recipients`
);

// Filter highly engaged
const engaged = recipients.filter(r => 
  r.openCount > 2 && r.clickCount > 0
);

console.log(`${engaged.length} highly engaged contacts`);
```

### Retry Failed Sends

```typescript
// Retry all failed
const result = await fetch(
  `/campaigns/${workspaceId}/${campaignId}/retry-failed`,
  { method: 'POST' }
);

console.log(`Retrying ${result.retried} emails`);
```

### Track Individual Contact

```typescript
// Get contact details
const details = await fetch(
  `/campaigns/${workspaceId}/${campaignId}/recipients/${contactId}`
);

// Show timeline
details.events.forEach(event => {
  console.log(`${event.type} at ${event.timestamp}`);
});
```

## Database Schema

### campaign_emails Table

```sql
CREATE TABLE campaign_emails (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  contact_id UUID REFERENCES contacts(id),
  status VARCHAR(20),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP,
  last_clicked_at TIMESTAMP,
  message_id VARCHAR(255),
  error TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_campaign_emails_campaign ON campaign_emails(campaign_id);
CREATE INDEX idx_campaign_emails_contact ON campaign_emails(contact_id);
CREATE INDEX idx_campaign_emails_status ON campaign_emails(status);
```

### email_events Table

```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY,
  campaign_email_id UUID REFERENCES campaign_emails(id),
  event_type VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP
);

CREATE INDEX idx_email_events_campaign_email ON email_events(campaign_email_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_created ON email_events(created_at);
```

## Webhook Integration

To track opens, clicks, bounces, and complaints, integrate with your email provider's webhooks:

### AWS SES
```bash
# Configure SNS topic for bounce/complaint notifications
aws ses set-identity-notification-topic \
  --identity noreply@yourdomain.com \
  --notification-type Bounce \
  --sns-topic arn:aws:sns:region:account:topic
```

### SendGrid
```bash
# Configure Event Webhook
POST https://api.sendgrid.com/v3/user/webhooks/event/settings
{
  "enabled": true,
  "url": "https://yourdomain.com/api/webhooks/sendgrid",
  "bounce": true,
  "click": true,
  "open": true,
  "spam_report": true
}
```

## Best Practices

1. **Monitor Bounce Rates**
   - Keep below 5%
   - Remove hard bounces immediately
   - Investigate soft bounces

2. **Track Engagement**
   - Segment by engagement level
   - Re-engage inactive contacts
   - Reward highly engaged users

3. **Handle Failures**
   - Retry failed sends automatically
   - Investigate persistent failures
   - Update contact status

4. **Respect Unsubscribes**
   - Process immediately
   - Update contact status
   - Exclude from future campaigns

5. **Privacy Compliance**
   - Store minimal tracking data
   - Respect DNT headers
   - Provide opt-out options

## Troubleshooting

### High Bounce Rate

**Check:**
- Email validation on import
- List hygiene practices
- Sender reputation

**Fix:**
```typescript
// Remove bounced contacts
const bounced = recipients.filter(r => r.status === 'bounced');
await updateContactsStatus(bounced, 'bounced');
```

### Low Open Rate

**Check:**
- Subject line quality
- Send time optimization
- Sender name recognition

**Analyze:**
```typescript
const stats = await getCampaignStats(campaignId);
if (parseFloat(stats.summary.openRate) < 15) {
  console.log('Low open rate - review subject line');
}
```

### Failed Sends

**Check:**
- SMTP credentials
- Rate limits
- Email content (spam filters)

**Retry:**
```typescript
await retryFailedEmails(campaignId, workspaceId);
```

## Performance Tips

1. **Index Optimization**
   - Index campaign_id, contact_id, status
   - Composite indexes for common queries

2. **Batch Queries**
   - Fetch recipients in batches
   - Use pagination for large campaigns

3. **Cache Stats**
   - Cache campaign stats (5-minute TTL)
   - Invalidate on new events

4. **Archive Old Data**
   - Archive events older than 90 days
   - Keep summary stats indefinitely
