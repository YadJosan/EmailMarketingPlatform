# Segments & Audience API Documentation

## Overview
Dynamic segment builder with filter rules stored in JSONB, allowing complex contact filtering and real-time evaluation.

## Features
- ✅ Create segments with filter rules
- ✅ Dynamic segment evaluation
- ✅ Multiple filter operators
- ✅ AND/OR logic
- ✅ Custom field filtering
- ✅ Real-time contact count
- ✅ Test rules before saving

---

## Filter Operators

### String Operators
- `equals` - Exact match
- `not_equals` - Not equal to
- `contains` - Contains substring (case-insensitive)
- `not_contains` - Does not contain substring
- `starts_with` - Starts with string
- `ends_with` - Ends with string

### Numeric Operators
- `greater_than` - Greater than value
- `less_than` - Less than value

### Array Operators
- `in` - Value in array
- `not_in` - Value not in array

### Existence Operators
- `exists` - Field exists/is not null
- `not_exists` - Field does not exist/is null

---

## Filter Rules Structure

```typescript
{
  "operator": "AND" | "OR",
  "conditions": [
    {
      "field": "email" | "firstName" | "lastName" | "status" | "source" | "customFieldName",
      "operator": "equals" | "contains" | "greater_than" | ...,
      "value": any
    }
  ]
}
```

---

## API Endpoints

### 1. Create Segment

```http
POST /api/segments
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "workspace-uuid",
  "name": "VIP Customers",
  "audienceId": "audience-uuid",
  "filterRules": {
    "operator": "AND",
    "conditions": [
      {
        "field": "status",
        "operator": "equals",
        "value": "subscribed"
      },
      {
        "field": "company",
        "operator": "contains",
        "value": "Enterprise"
      }
    ]
  }
}
```

**Response:**
```json
{
  "id": "segment-uuid",
  "workspaceId": "workspace-uuid",
  "name": "VIP Customers",
  "audienceId": "audience-uuid",
  "filterRules": {
    "operator": "AND",
    "conditions": [...]
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. List Segments

```http
GET /api/segments/:workspaceId
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "segment-uuid",
    "name": "VIP Customers",
    "audienceId": "audience-uuid",
    "audience": {
      "id": "audience-uuid",
      "name": "All Customers"
    },
    "filterRules": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 3. Get Segment

```http
GET /api/segments/:workspaceId/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "segment-uuid",
  "name": "VIP Customers",
  "filterRules": {
    "operator": "AND",
    "conditions": [...]
  }
}
```

---

### 4. Update Segment

```http
PUT /api/segments/:workspaceId/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "filterRules": {
    "operator": "OR",
    "conditions": [...]
  }
}
```

---

### 5. Delete Segment

```http
DELETE /api/segments/:workspaceId/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Segment deleted successfully"
}
```

---

### 6. Evaluate Segment

Get all contacts matching the segment rules.

```http
GET /api/segments/:workspaceId/:id/evaluate
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "contact-uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "subscribed",
    "customFields": {
      "company": "Enterprise Corp"
    }
  }
]
```

---

### 7. Get Segment Count

Get the number of contacts matching the segment.

```http
GET /api/segments/:workspaceId/:id/count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "count": 1250
}
```

---

### 8. Test Filter Rules

Test filter rules without creating a segment.

```http
POST /api/segments/:workspaceId/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "audienceId": "audience-uuid",
  "filterRules": {
    "operator": "AND",
    "conditions": [
      {
        "field": "status",
        "operator": "equals",
        "value": "subscribed"
      }
    ]
  }
}
```

**Response:**
```json
{
  "count": 1250,
  "preview": [
    {
      "id": "contact-uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ]
}
```

---

## Example Segments

### Example 1: Active Subscribers

```json
{
  "name": "Active Subscribers",
  "filterRules": {
    "operator": "AND",
    "conditions": [
      {
        "field": "status",
        "operator": "equals",
        "value": "subscribed"
      }
    ]
  }
}
```

### Example 2: Enterprise Customers

```json
{
  "name": "Enterprise Customers",
  "filterRules": {
    "operator": "AND",
    "conditions": [
      {
        "field": "company",
        "operator": "contains",
        "value": "Enterprise"
      },
      {
        "field": "status",
        "operator": "equals",
        "value": "subscribed"
      }
    ]
  }
}
```

### Example 3: High-Value Contacts

```json
{
  "name": "High-Value Contacts",
  "filterRules": {
    "operator": "AND",
    "conditions": [
      {
        "field": "lifetime_value",
        "operator": "greater_than",
        "value": 10000
      },
      {
        "field": "status",
        "operator": "equals",
        "value": "subscribed"
      }
    ]
  }
}
```

### Example 4: Engaged Users (OR Logic)

```json
{
  "name": "Engaged Users",
  "filterRules": {
    "operator": "OR",
    "conditions": [
      {
        "field": "last_opened",
        "operator": "exists",
        "value": null
      },
      {
        "field": "last_clicked",
        "operator": "exists",
        "value": null
      }
    ]
  }
}
```

### Example 5: Specific Domains

```json
{
  "name": "Gmail Users",
  "filterRules": {
    "operator": "AND",
    "conditions": [
      {
        "field": "email",
        "operator": "ends_with",
        "value": "@gmail.com"
      }
    ]
  }
}
```

### Example 6: Multiple Tags

```json
{
  "name": "VIP Premium",
  "filterRules": {
    "operator": "AND",
    "conditions": [
      {
        "field": "tags",
        "operator": "in",
        "value": ["vip", "premium"]
      }
    ]
  }
}
```

---

## Field Types

### Standard Fields
- `email` - Contact email address
- `firstName` - Contact first name
- `lastName` - Contact last name
- `status` - Contact status (subscribed, unsubscribed, bounced, complained)
- `source` - Contact source (import, form, api, manual)
- `tags` - Array of tags

### Custom Fields
Any field not in the standard list is treated as a custom field and queried from the JSONB `customFields` column.

Examples:
- `company`
- `phone`
- `country`
- `lifetime_value`
- `last_purchase_date`

---

## Query Performance

### Indexes
For optimal performance, create indexes on frequently queried fields:

```sql
-- Index on status
CREATE INDEX idx_contacts_status ON contacts(status);

-- Index on custom fields (GIN index for JSONB)
CREATE INDEX idx_contacts_custom_fields ON contacts USING GIN (customFields);

-- Composite index for workspace + status
CREATE INDEX idx_contacts_workspace_status ON contacts(workspaceId, status);
```

### Best Practices
1. **Limit conditions**: Keep conditions under 10 for best performance
2. **Use indexes**: Index frequently filtered fields
3. **Test first**: Use `/test` endpoint before creating segment
4. **Cache counts**: Cache segment counts for large datasets
5. **Audience first**: Filter by audience before applying segment rules

---

## Use Cases

### 1. Email Campaign Targeting
```
Segment: "Active Customers"
Rules: status = subscribed AND last_purchase < 30 days ago
Use: Send re-engagement campaign
```

### 2. Personalization
```
Segment: "Enterprise Tier"
Rules: company contains "Enterprise" OR lifetime_value > 50000
Use: Send premium content
```

### 3. Win-back Campaign
```
Segment: "Inactive Users"
Rules: status = subscribed AND last_opened NOT exists
Use: Re-engagement email
```

### 4. Geographic Targeting
```
Segment: "US Customers"
Rules: country = "USA" AND status = subscribed
Use: Region-specific offers
```

### 5. Behavioral Segmentation
```
Segment: "Frequent Buyers"
Rules: purchase_count > 5 AND status = subscribed
Use: Loyalty program invitation
```

---

## cURL Examples

### Create Segment
```bash
curl -X POST http://localhost:3000/api/segments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "WORKSPACE_ID",
    "name": "VIP Customers",
    "filterRules": {
      "operator": "AND",
      "conditions": [
        {
          "field": "status",
          "operator": "equals",
          "value": "subscribed"
        }
      ]
    }
  }'
```

### Test Rules
```bash
curl -X POST http://localhost:3000/api/segments/WORKSPACE_ID/test \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filterRules": {
      "operator": "AND",
      "conditions": [
        {
          "field": "company",
          "operator": "contains",
          "value": "Enterprise"
        }
      ]
    }
  }'
```

### Evaluate Segment
```bash
curl http://localhost:3000/api/segments/WORKSPACE_ID/SEGMENT_ID/evaluate \
  -H "Authorization: Bearer TOKEN"
```

### Get Count
```bash
curl http://localhost:3000/api/segments/WORKSPACE_ID/SEGMENT_ID/count \
  -H "Authorization: Bearer TOKEN"
```

---

## Summary

The segments system provides:
- ✅ Dynamic contact filtering
- ✅ JSONB-based filter rules
- ✅ Multiple operators (string, numeric, array, existence)
- ✅ AND/OR logic
- ✅ Custom field support
- ✅ Real-time evaluation
- ✅ Performance optimized
- ✅ Test before save
- ✅ Workspace isolated

Perfect for targeted email campaigns and contact segmentation!
