# Campaigns API Documentation

## Overview
Complete campaign management system with audience/segment targeting, merge tags, scheduling, and status workflow.

## Features
- ✅ Create campaigns with subject, preview text, from/reply-to
- ✅ Target audience (static list) or segment (dynamic filter)
- ✅ Campaign status workflow (draft → scheduled → sending → sent)
- ✅ Schedule campaigns for future sending
- ✅ Send immediately
- ✅ Merge tags ({{first_name}}, {{email}}, custom fields)
- ✅ Preview emails with sample contact
- ✅ Get recipient count before sending
- ✅ Pause/resume campaigns

---

## Campaign Status Workflow

```
DRAFT → SCHEDULED → SENDING → SENT
  ↓         ↓
PAUSED ← PAUSED
```

- **DRAFT**: Campaign being created/edited
- **SCHEDULED**: Campaign scheduled for future send
- **SENDING**: Campaign currently being sent
- **SENT**: Campaign completed
- **PAUSED**: Campaign paused (can resume)

---

## API Endpoints

### 1. Create Campaign

```http
POST /api/campaigns
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "workspace-uuid",
  "name": "Summer Sale 2024",
  "subject": "Hi {{first_name}}, Check out our summer deals!",
  "previewText": "Save up to 50% on selected items",
  "fromName": "Marketing Team",
  "fromEmail": "marketing@company.com",
  "replyTo": "support@company.com",
  "content": "<h1>Hello {{first_name}}!</h1><p>We have great deals for you...</p>",
  "audienceId": "audience-uuid",
  "segmentId": null
}
```

**Response:**
```json
{
  "id": "campaign-uuid",
  "workspaceId": "workspace-uuid",
  "name": "Summer Sale 2024",
  "subject": "Hi {{first_name}}, Check out our summer deals!",
  "previewText": "Save up to 50% on selected items",
  "fromName": "Marketing Team",
  "fromEmail": "marketing@company.com",
  "replyTo": "support@company.com",
  "content": "<h1>Hello {{first_name}}!</h1>...",
  "audienceId": "audience-uuid",
  "segmentId": null,
  "status": "draft",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. List Campaigns

```http
GET /api/campaigns/:workspaceId
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "campaign-uuid",
    "name": "Summer Sale 2024",
    "subject": "Hi {{first_name}}, Check out our summer deals!",
    "status": "draft",
    "audienceId": "audience-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 3. Get Campaign

```http
GET /api/campaigns/:workspaceId/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "campaign-uuid",
  "name": "Summer Sale 2024",
  "subject": "Hi {{first_name}}, Check out our summer deals!",
  "previewText": "Save up to 50% on selected items",
  "fromName": "Marketing Team",
  "fromEmail": "marketing@company.com",
  "replyTo": "support@company.com",
  "content": "<h1>Hello {{first_name}}!</h1>...",
  "status": "draft",
  "audience": {
    "id": "audience-uuid",
    "name": "Newsletter Subscribers"
  },
  "segment": null
}
```

---

### 4. Update Campaign

```http
PUT /api/campaigns/:workspaceId/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Updated subject line",
  "previewText": "New preview text",
  "content": "<h1>Updated content</h1>"
}
```

---

### 5. Delete Campaign

Only draft campaigns can be deleted.

```http
DELETE /api/campaigns/:workspaceId/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Campaign deleted successfully"
}
```

---

### 6. Send Campaign Immediately

```http
POST /api/campaigns/:workspaceId/:id/send
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "campaign-uuid",
  "status": "sent",
  "sentAt": "2024-01-01T12:00:00.000Z"
}
```

---

### 7. Schedule Campaign

```http
POST /api/campaigns/:workspaceId/:id/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "scheduledAt": "2024-01-15T10:00:00.000Z"
}
```

**Response:**
```json
{
  "id": "campaign-uuid",
  "status": "scheduled",
  "scheduledAt": "2024-01-15T10:00:00.000Z"
}
```

---

### 8. Pause Campaign

```http
POST /api/campaigns/:workspaceId/:id/pause
Authorization: Bearer <token>
```

---

### 9. Resume Campaign

```http
POST /api/campaigns/:workspaceId/:id/resume
Authorization: Bearer <token>
```

---

### 10. Preview Email

Preview how the email will look with merge tags replaced.

```http
GET /api/campaigns/:workspaceId/:id/preview
Authorization: Bearer <token>
Content-Type: application/json

{
  "contactId": "contact-uuid"
}
```

**Response:**
```json
{
  "subject": "Hi John, Check out our summer deals!",
  "previewText": "Save up to 50% on selected items",
  "fromName": "Marketing Team",
  "fromEmail": "marketing@company.com",
  "replyTo": "support@company.com",
  "html": "<h1>Hello John!</h1><p>We have great deals for you...</p>",
  "contact": {
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### 11. Get Recipient Count

Get the number of contacts that will receive the campaign.

```http
GET /api/campaigns/:workspaceId/:id/recipients/count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "count": 1250
}
```

---

## Targeting Options

### Option 1: Target Audience (Static List)

```json
{
  "audienceId": "audience-uuid",
  "segmentId": null
}
```

Sends to all subscribed contacts in the audience.

### Option 2: Target Segment (Dynamic Filter)

```json
{
  "audienceId": null,
  "segmentId": "segment-uuid"
}
```

Sends to all contacts matching the segment's filter rules at send time.

### Option 3: Target Segment within Audience

```json
{
  "audienceId": "audience-uuid",
  "segmentId": "segment-uuid"
}
```

Sends to contacts that are both in the audience AND match the segment rules.

---

## Merge Tags

### Standard Merge Tags

- `{{first_name}}` - Contact's first name
- `{{last_name}}` - Contact's last name
- `{{email}}` - Contact's email address
- `{{full_name}}` - Contact's full name (first + last)

### Custom Field Merge Tags

Any custom field can be used as a merge tag:

- `{{company}}` - Custom field: company
- `{{phone}}` - Custom field: phone
- `{{country}}` - Custom field: country
- `{{plan}}` - Custom field: plan

### Example Usage

**Subject:**
```
Hi {{first_name}}, special offer for {{company}}!
```

**Content:**
```html
<h1>Hello {{first_name}} {{last_name}}!</h1>
<p>We noticed you're from {{country}}.</p>
<p>As a {{plan}} customer, you get exclusive access...</p>
<p>Questions? Reply to {{email}}</p>
```

**Rendered for John Doe:**
```html
<h1>Hello John Doe!</h1>
<p>We noticed you're from USA.</p>
<p>As a premium customer, you get exclusive access...</p>
<p>Questions? Reply to john@example.com</p>
```

---

## Example Campaigns

### Example 1: Newsletter to All Subscribers

```json
{
  "name": "Weekly Newsletter",
  "subject": "This week's top stories",
  "fromName": "Newsletter Team",
  "fromEmail": "newsletter@company.com",
  "replyTo": "hello@company.com",
  "content": "<h1>Weekly Newsletter</h1>...",
  "audienceId": "newsletter-audience-id"
}
```

### Example 2: Targeted Campaign to High-Value Customers

```json
{
  "name": "VIP Exclusive Offer",
  "subject": "{{first_name}}, exclusive offer just for you",
  "previewText": "As a valued customer, you get early access",
  "fromName": "VIP Team",
  "fromEmail": "vip@company.com",
  "replyTo": "vip@company.com",
  "content": "<h1>Hi {{first_name}}!</h1><p>Your company {{company}} qualifies...</p>",
  "segmentId": "high-value-segment-id"
}
```

### Example 3: Re-engagement Campaign

```json
{
  "name": "Win-back Campaign",
  "subject": "We miss you, {{first_name}}!",
  "previewText": "Come back and get 20% off",
  "fromName": "Customer Success",
  "fromEmail": "success@company.com",
  "replyTo": "support@company.com",
  "content": "<h1>We miss you!</h1><p>Here's 20% off your next purchase...</p>",
  "segmentId": "inactive-users-segment-id"
}
```

---

## Workflow Examples

### Workflow 1: Create and Send Immediately

```bash
# 1. Create campaign
CAMPAIGN_ID=$(curl -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "name": "Flash Sale",
    "subject": "24-hour flash sale!",
    "fromName": "Sales Team",
    "fromEmail": "sales@company.com",
    "replyTo": "sales@company.com",
    "content": "<h1>Flash Sale!</h1>",
    "audienceId": "'$AUDIENCE_ID'"
  }' | jq -r '.id')

# 2. Preview
curl http://localhost:3000/api/campaigns/$WORKSPACE_ID/$CAMPAIGN_ID/preview \
  -H "Authorization: Bearer $TOKEN"

# 3. Check recipient count
curl http://localhost:3000/api/campaigns/$WORKSPACE_ID/$CAMPAIGN_ID/recipients/count \
  -H "Authorization: Bearer $TOKEN"

# 4. Send
curl -X POST http://localhost:3000/api/campaigns/$WORKSPACE_ID/$CAMPAIGN_ID/send \
  -H "Authorization: Bearer $TOKEN"
```

### Workflow 2: Schedule for Later

```bash
# 1. Create campaign
# 2. Schedule for tomorrow at 10 AM
curl -X POST http://localhost:3000/api/campaigns/$WORKSPACE_ID/$CAMPAIGN_ID/schedule \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledAt": "2024-01-15T10:00:00.000Z"
  }'
```

### Workflow 3: Test with Segment

```bash
# 1. Test segment rules first
curl -X POST http://localhost:3000/api/segments/$WORKSPACE_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filterRules": {
      "operator": "AND",
      "conditions": [
        {"field": "status", "operator": "equals", "value": "subscribed"}
      ]
    }
  }'

# 2. Create segment
SEGMENT_ID=$(curl -X POST http://localhost:3000/api/segments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "name": "Active Subscribers",
    "filterRules": {...}
  }' | jq -r '.id')

# 3. Create campaign with segment
curl -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "name": "Targeted Campaign",
    "subject": "Special offer",
    "fromName": "Team",
    "fromEmail": "team@company.com",
    "replyTo": "team@company.com",
    "content": "<h1>Hello!</h1>",
    "segmentId": "'$SEGMENT_ID'"
  }'
```

---

## Best Practices

### 1. Always Preview Before Sending
```bash
curl http://localhost:3000/api/campaigns/$WORKSPACE_ID/$CAMPAIGN_ID/preview \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Check Recipient Count
```bash
curl http://localhost:3000/api/campaigns/$WORKSPACE_ID/$CAMPAIGN_ID/recipients/count \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test with Small Segment First
Create a test segment with your own email, send campaign, verify it looks good.

### 4. Use Descriptive Names
- ✅ "Summer Sale 2024 - Newsletter Subscribers"
- ❌ "Campaign 1"

### 5. Set Proper Reply-To
Always set a monitored reply-to address for customer responses.

### 6. Use Preview Text
Helps improve open rates by showing in email client previews.

### 7. Test Merge Tags
Ensure all merge tags have fallback values or handle missing data.

---

## Error Handling

### Campaign must target audience or segment
```json
{
  "statusCode": 400,
  "message": "Campaign must target an audience or segment"
}
```

**Solution:** Set either `audienceId` or `segmentId`

### Can only delete draft campaigns
```json
{
  "statusCode": 403,
  "message": "Can only delete draft campaigns"
}
```

**Solution:** Only draft campaigns can be deleted

### Campaign not found
```json
{
  "statusCode": 404,
  "message": "Campaign not found"
}
```

**Solution:** Check campaign ID and workspace ID

---

## Summary

The campaign system provides:
- ✅ Complete CRUD operations
- ✅ Audience targeting (static lists)
- ✅ Segment targeting (dynamic filters)
- ✅ Merge tags for personalization
- ✅ Preview functionality
- ✅ Recipient count
- ✅ Schedule for later
- ✅ Send immediately
- ✅ Status workflow
- ✅ Pause/resume
- ✅ Workspace isolation

Perfect for sending targeted, personalized email campaigns!
