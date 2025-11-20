# Audience & Segmentation Testing Guide

## Overview
Complete testing guide for audiences (static lists) and segments (dynamic filters with JSONB rules).

---

## Prerequisites

### 1. Have Some Contacts
First, create test contacts to work with:

```bash
# Set your variables
TOKEN="your-jwt-token"
WORKSPACE_ID="your-workspace-id"

# Create test contacts
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "email": "john@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "subscribed",
    "customFields": {
      "company": "Enterprise Corp",
      "plan": "premium",
      "revenue": 50000
    },
    "tags": ["vip", "customer"]
  }'

curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "email": "jane@yahoo.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "status": "subscribed",
    "customFields": {
      "company": "Startup Inc",
      "plan": "basic",
      "revenue": 5000
    },
    "tags": ["customer"]
  }'

curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "email": "bob@company.com",
    "firstName": "Bob",
    "lastName": "Johnson",
    "status": "unsubscribed",
    "customFields": {
      "company": "Tech LLC",
      "plan": "free"
    }
  }'
```

---

## Part 1: Audiences (Static Lists)

### Test 1: Create Audience

```bash
curl -X POST http://localhost:3000/api/contacts/$WORKSPACE_ID/audiences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Newsletter Subscribers",
    "description": "All users subscribed to newsletter"
  }'
```

**Expected Response:**
```json
{
  "id": "audience-uuid",
  "workspaceId": "workspace-uuid",
  "name": "Newsletter Subscribers",
  "description": "All users subscribed to newsletter",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**✅ Success Criteria:**
- Returns 201 status
- Has valid UUID
- Name and description match

### Test 2: List Audiences

```bash
curl http://localhost:3000/api/contacts/$WORKSPACE_ID/audiences/list \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": "audience-uuid",
    "name": "Newsletter Subscribers",
    "description": "All users subscribed to newsletter",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**✅ Success Criteria:**
- Returns array
- Shows all audiences in workspace
- Sorted by creation date

### Test 3: Add Contact to Audience

```bash
# Get contact ID from previous step
CONTACT_ID="contact-uuid"
AUDIENCE_ID="audience-uuid"

curl -X POST http://localhost:3000/api/contacts/$WORKSPACE_ID/$CONTACT_ID/audiences/$AUDIENCE_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "id": "contact-uuid",
  "email": "john@gmail.com",
  "audiences": [
    {
      "id": "audience-uuid",
      "name": "Newsletter Subscribers"
    }
  ]
}
```

**✅ Success Criteria:**
- Contact now has audience in array
- Many-to-many relationship works
- Can add same contact to multiple audiences

### Test 4: Verify Many-to-Many Relationship

```bash
# Add same contact to another audience
curl -X POST http://localhost:3000/api/contacts/$WORKSPACE_ID/audiences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIP Customers"
  }'

# Add contact to second audience
AUDIENCE_2_ID="second-audience-uuid"

curl -X POST http://localhost:3000/api/contacts/$WORKSPACE_ID/$CONTACT_ID/audiences/$AUDIENCE_2_ID \
  -H "Authorization: Bearer $TOKEN"

# Verify contact is in both audiences
curl http://localhost:3000/api/contacts/$WORKSPACE_ID/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "id": "contact-uuid",
  "email": "john@gmail.com",
  "audiences": [
    {"id": "audience-1", "name": "Newsletter Subscribers"},
    {"id": "audience-2", "name": "VIP Customers"}
  ]
}
```

**✅ Success Criteria:**
- Contact appears in multiple audiences
- No duplicates
- Relationship persists

---

## Part 2: Segments (Dynamic Filters)

### Test 5: Create Simple Segment

```bash
curl -X POST http://localhost:3000/api/segments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
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
  }'
```

**Expected Response:**
```json
{
  "id": "segment-uuid",
  "workspaceId": "workspace-uuid",
  "name": "Active Subscribers",
  "filterRules": {
    "operator": "AND",
    "conditions": [...]
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**✅ Success Criteria:**
- Segment created with JSONB rules
- Rules stored correctly
- Returns segment ID

### Test 6: Test Filter Rules (Before Saving)

```bash
curl -X POST http://localhost:3000/api/segments/$WORKSPACE_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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

**Expected Response:**
```json
{
  "count": 2,
  "preview": [
    {
      "id": "contact-1",
      "email": "john@gmail.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    {
      "id": "contact-2",
      "email": "jane@yahoo.com",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  ]
}
```

**✅ Success Criteria:**
- Returns matching contact count
- Shows preview of first 10 contacts
- Filters work correctly

### Test 7: Complex Segment with Multiple Conditions

```bash
curl -X POST http://localhost:3000/api/segments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "name": "High-Value Gmail Users",
    "filterRules": {
      "operator": "AND",
      "conditions": [
        {
          "field": "email",
          "operator": "ends_with",
          "value": "@gmail.com"
        },
        {
          "field": "status",
          "operator": "equals",
          "value": "subscribed"
        },
        {
          "field": "revenue",
          "operator": "greater_than",
          "value": 10000
        }
      ]
    }
  }'
```

**✅ Success Criteria:**
- Multiple conditions work together
- Custom field filtering works
- Numeric comparison works

### Test 8: Segment with OR Logic

```bash
curl -X POST http://localhost:3000/api/segments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "name": "Gmail or Yahoo Users",
    "filterRules": {
      "operator": "OR",
      "conditions": [
        {
          "field": "email",
          "operator": "ends_with",
          "value": "@gmail.com"
        },
        {
          "field": "email",
          "operator": "ends_with",
          "value": "@yahoo.com"
        }
      ]
    }
  }'
```

**✅ Success Criteria:**
- OR logic works correctly
- Returns contacts matching ANY condition
- Count is correct

### Test 9: Evaluate Segment

```bash
SEGMENT_ID="segment-uuid"

curl http://localhost:3000/api/segments/$WORKSPACE_ID/$SEGMENT_ID/evaluate \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": "contact-uuid",
    "email": "john@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "subscribed",
    "customFields": {
      "company": "Enterprise Corp",
      "revenue": 50000
    }
  }
]
```

**✅ Success Criteria:**
- Returns all matching contacts
- Includes full contact data
- Dynamic evaluation works

### Test 10: Get Segment Count

```bash
curl http://localhost:3000/api/segments/$WORKSPACE_ID/$SEGMENT_ID/count \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "count": 1
}
```

**✅ Success Criteria:**
- Returns accurate count
- Fast query (uses COUNT)
- Updates dynamically

### Test 11: Custom Field Filtering

```bash
curl -X POST http://localhost:3000/api/segments/$WORKSPACE_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filterRules": {
      "operator": "AND",
      "conditions": [
        {
          "field": "company",
          "operator": "contains",
          "value": "Enterprise"
        },
        {
          "field": "plan",
          "operator": "equals",
          "value": "premium"
        }
      ]
    }
  }'
```

**✅ Success Criteria:**
- JSONB custom fields queryable
- String operators work (contains, equals)
- Case-insensitive search works

### Test 12: Tag Filtering

```bash
curl -X POST http://localhost:3000/api/segments/$WORKSPACE_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**✅ Success Criteria:**
- Array field filtering works
- IN operator works correctly
- Returns contacts with any matching tag

### Test 13: Existence Operators

```bash
curl -X POST http://localhost:3000/api/segments/$WORKSPACE_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filterRules": {
      "operator": "AND",
      "conditions": [
        {
          "field": "company",
          "operator": "exists",
          "value": null
        },
        {
          "field": "phone",
          "operator": "not_exists",
          "value": null
        }
      ]
    }
  }'
```

**✅ Success Criteria:**
- EXISTS checks if field has value
- NOT_EXISTS checks if field is null/missing
- Works for both standard and custom fields

### Test 14: Segment with Audience Filter

```bash
curl -X POST http://localhost:3000/api/segments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "name": "VIP Newsletter Subscribers",
    "audienceId": "'$AUDIENCE_ID'",
    "filterRules": {
      "operator": "AND",
      "conditions": [
        {
          "field": "tags",
          "operator": "in",
          "value": ["vip"]
        }
      ]
    }
  }'
```

**✅ Success Criteria:**
- Filters within specific audience
- Combines static list + dynamic rules
- Returns only contacts in both audience AND matching rules

---

## All Filter Operators Test

### String Operators
```bash
# EQUALS
{"field": "status", "operator": "equals", "value": "subscribed"}

# NOT_EQUALS
{"field": "status", "operator": "not_equals", "value": "unsubscribed"}

# CONTAINS
{"field": "email", "operator": "contains", "value": "gmail"}

# NOT_CONTAINS
{"field": "email", "operator": "not_contains", "value": "spam"}

# STARTS_WITH
{"field": "email", "operator": "starts_with", "value": "john"}

# ENDS_WITH
{"field": "email", "operator": "ends_with", "value": "@gmail.com"}
```

### Numeric Operators
```bash
# GREATER_THAN
{"field": "revenue", "operator": "greater_than", "value": 10000}

# LESS_THAN
{"field": "revenue", "operator": "less_than", "value": 5000}
```

### Array Operators
```bash
# IN
{"field": "status", "operator": "in", "value": ["subscribed", "bounced"]}

# NOT_IN
{"field": "status", "operator": "not_in", "value": ["unsubscribed", "complained"]}
```

### Existence Operators
```bash
# EXISTS
{"field": "company", "operator": "exists", "value": null}

# NOT_EXISTS
{"field": "phone", "operator": "not_exists", "value": null}
```

---

## Performance Testing

### Test with Large Dataset

```bash
# Create 1000 contacts
for i in {1..1000}; do
  curl -X POST http://localhost:3000/api/contacts \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "workspaceId": "'$WORKSPACE_ID'",
      "email": "user'$i'@example.com",
      "firstName": "User",
      "lastName": "'$i'",
      "status": "'$([ $((i % 2)) -eq 0 ] && echo "subscribed" || echo "unsubscribed")'",
      "customFields": {
        "revenue": '$((RANDOM % 100000))'
      }
    }' > /dev/null 2>&1 &
  
  if [ $((i % 100)) -eq 0 ]; then
    wait
    echo "Created $i contacts..."
  fi
done
wait

echo "✅ Created 1000 contacts"

# Test segment performance
echo "Testing segment evaluation..."
time curl -X POST http://localhost:3000/api/segments/$WORKSPACE_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filterRules": {
      "operator": "AND",
      "conditions": [
        {
          "field": "status",
          "operator": "equals",
          "value": "subscribed"
        },
        {
          "field": "revenue",
          "operator": "greater_than",
          "value": 50000
        }
      ]
    }
  }'
```

**✅ Success Criteria:**
- Query completes in < 1 second
- Returns accurate count
- No timeout errors

---

## Verification Checklist

### Audiences (Static Lists)
- [ ] Can create audience
- [ ] Can list audiences
- [ ] Can add contact to audience
- [ ] Contact can be in multiple audiences
- [ ] Many-to-many relationship works
- [ ] Workspace isolation enforced

### Segments (Dynamic Filters)
- [ ] Can create segment with rules
- [ ] Can test rules before saving
- [ ] String operators work (equals, contains, etc.)
- [ ] Numeric operators work (greater_than, less_than)
- [ ] Array operators work (in, not_in)
- [ ] Existence operators work (exists, not_exists)
- [ ] AND logic works
- [ ] OR logic works
- [ ] Custom field filtering works
- [ ] Can evaluate segment dynamically
- [ ] Can get segment count
- [ ] Can combine audience + segment
- [ ] JSONB storage works
- [ ] Performance is acceptable

### Integration
- [ ] Segments update when contacts change
- [ ] Workspace isolation enforced
- [ ] No cross-workspace data leakage
- [ ] Proper error handling
- [ ] API responses are correct

---

## Common Issues & Solutions

### Issue: Segment returns no results
**Check:**
1. Are there contacts matching the criteria?
2. Is the operator correct?
3. Are custom field names spelled correctly?
4. Is the value type correct (string vs number)?

### Issue: Custom field filtering not working
**Solution:**
- Custom fields are case-sensitive
- Check field exists in customFields JSONB
- Use correct operator for data type

### Issue: Performance slow with many contacts
**Solution:**
```sql
-- Add indexes
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_custom_fields ON contacts USING GIN (customFields);
```

---

## Summary

**Audiences:**
✅ Static lists of contacts
✅ Many-to-many relationship
✅ Manual contact assignment
✅ Simple and fast

**Segments:**
✅ Dynamic filtering with rules
✅ JSONB-based filter storage
✅ Real-time evaluation
✅ Multiple operators
✅ AND/OR logic
✅ Custom field support
✅ Performance optimized

**Perfect for:**
- Targeted email campaigns
- Contact organization
- Behavioral segmentation
- Dynamic list building
- Complex filtering needs
