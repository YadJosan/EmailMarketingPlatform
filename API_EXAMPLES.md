# API Examples

Complete examples for testing the email marketing platform API.

## Authentication

### Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

## Workspaces

### Create Workspace
```bash
curl -X POST http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Marketing Agency",
    "slug": "my-agency"
  }'
```

### List Workspaces
```bash
curl http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Contacts

### Create Contact
```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "workspace-uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "customFields": {
      "company": "Acme Inc",
      "role": "CEO",
      "industry": "Technology"
    },
    "tags": ["vip", "enterprise"]
  }'
```

### List Contacts
```bash
curl http://localhost:3000/api/contacts/workspace-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Import Contacts from CSV
```bash
# Create contacts.csv first:
# email,first_name,last_name,company,role
# john@example.com,John,Doe,Acme Inc,CEO
# jane@example.com,Jane,Smith,Tech Corp,CTO

curl -X POST http://localhost:3000/api/contacts/workspace-uuid/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@contacts.csv" \
  -F "audienceId=audience-uuid"
```

Response:
```json
{
  "total": 2,
  "imported": 2,
  "skipped": 0,
  "errors": []
}
```

## Audiences

### Create Audience
```bash
curl -X POST http://localhost:3000/api/audiences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "workspace-uuid",
    "name": "Newsletter Subscribers",
    "description": "Main newsletter list"
  }'
```

## Campaigns

### Create Campaign
```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "workspace-uuid",
    "name": "Welcome Campaign",
    "subject": "Welcome to our platform, {{first_name}}!",
    "previewText": "Get started with these simple steps",
    "fromName": "Your Company",
    "fromEmail": "noreply@yourdomain.com",
    "replyTo": "support@yourdomain.com",
    "audienceId": "audience-uuid",
    "content": {
      "blocks": [
        {
          "type": "text",
          "content": "<h1>Welcome {{first_name}}!</h1><p>Thanks for joining us.</p>"
        },
        {
          "type": "button",
          "content": "Get Started",
          "props": {
            "url": "https://yourdomain.com/onboarding",
            "color": "#0066cc"
          }
        }
      ]
    }
  }'
```

### Send Campaign Immediately
```bash
curl -X POST http://localhost:3000/api/campaigns/campaign-uuid/send \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Schedule Campaign
```bash
curl -X POST http://localhost:3000/api/campaigns/campaign-uuid/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledAt": "2025-11-20T09:00:00Z"
  }'
```

## Templates

### Create Template
```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "workspace-uuid",
    "name": "Welcome Email Template",
    "content": {
      "blocks": [
        {
          "type": "text",
          "content": "<h1>Welcome!</h1>"
        },
        {
          "type": "image",
          "props": {
            "src": "https://example.com/logo.png",
            "alt": "Company Logo"
          }
        },
        {
          "type": "text",
          "content": "<p>Hello {{first_name}},</p><p>Welcome to our platform!</p>"
        },
        {
          "type": "button",
          "content": "Get Started",
          "props": {
            "url": "https://example.com/start",
            "color": "#0066cc",
            "textColor": "#ffffff"
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "text",
          "content": "<p style=\"font-size: 12px; color: #666;\">© 2025 Your Company</p>"
        }
      ]
    }
  }'
```

### List Templates
```bash
curl http://localhost:3000/api/templates/workspace-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Analytics

### Get Campaign Stats
```bash
curl http://localhost:3000/api/analytics/campaigns/campaign-uuid/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "campaign_id": "campaign-uuid",
  "sent": 1000,
  "delivered": 980,
  "opened": 350,
  "clicked": 120,
  "bounced": 15,
  "complained": 2,
  "unsubscribed": 5,
  "open_rate": 0.357,
  "click_rate": 0.122
}
```

## Forms

### Create Embeddable Form
```bash
curl -X POST http://localhost:3000/api/forms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "workspace-uuid",
    "audienceId": "audience-uuid",
    "name": "Newsletter Signup",
    "fields": [
      {
        "name": "email",
        "type": "email",
        "label": "Email Address",
        "required": true
      },
      {
        "name": "firstName",
        "type": "text",
        "label": "First Name",
        "required": false
      }
    ],
    "doubleOptIn": true,
    "successMessage": "Thanks! Check your email to confirm."
  }'
```

### Submit Form (Public Endpoint)
```bash
curl -X POST http://localhost:3000/api/forms/form-uuid/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "firstName": "Jane"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Thanks! Check your email to confirm."
}
```

## Segments

### Create Segment
```bash
curl -X POST http://localhost:3000/api/segments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "workspace-uuid",
    "audienceId": "audience-uuid",
    "name": "VIP Customers",
    "filterRules": {
      "conditions": [
        {
          "field": "tags",
          "operator": "contains",
          "value": "vip"
        },
        {
          "field": "customFields.company",
          "operator": "exists",
          "value": true
        }
      ]
    }
  }'
```

## Webhooks (SES Notifications)

### SES Bounce Notification
```bash
# This is sent by AWS SNS, not called manually
# Example payload:

curl -X POST http://localhost:3000/api/webhooks/ses \
  -H "Content-Type: application/json" \
  -d '{
    "Type": "Notification",
    "Message": "{\"notificationType\":\"Bounce\",\"bounce\":{\"bounceType\":\"Permanent\",\"bouncedRecipients\":[{\"emailAddress\":\"bounce@example.com\"}]},\"mail\":{\"destination\":[\"bounce@example.com\"]}}"
  }'
```

## Testing Workflow

### Complete Campaign Flow

1. **Sign up and get token:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.accessToken')
```

2. **Create workspace:**
```bash
WORKSPACE_ID=$(curl -s -X POST http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Workspace","slug":"test-workspace"}' \
  | jq -r '.id')
```

3. **Create audience:**
```bash
AUDIENCE_ID=$(curl -s -X POST http://localhost:3000/api/audiences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"workspaceId\":\"$WORKSPACE_ID\",\"name\":\"Test List\"}" \
  | jq -r '.id')
```

4. **Add contacts:**
```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"workspaceId\":\"$WORKSPACE_ID\",
    \"email\":\"john@example.com\",
    \"firstName\":\"John\"
  }"
```

5. **Create campaign:**
```bash
CAMPAIGN_ID=$(curl -s -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"workspaceId\":\"$WORKSPACE_ID\",
    \"name\":\"Test Campaign\",
    \"subject\":\"Hello!\",
    \"fromName\":\"Test\",
    \"fromEmail\":\"test@example.com\",
    \"replyTo\":\"test@example.com\",
    \"audienceId\":\"$AUDIENCE_ID\",
    \"content\":{\"blocks\":[{\"type\":\"text\",\"content\":\"Hello!\"}]}
  }" \
  | jq -r '.id')
```

6. **Send campaign:**
```bash
curl -X POST http://localhost:3000/api/campaigns/$CAMPAIGN_ID/send \
  -H "Authorization: Bearer $TOKEN"
```

7. **Check stats:**
```bash
curl http://localhost:3000/api/analytics/campaigns/$CAMPAIGN_ID/stats \
  -H "Authorization: Bearer $TOKEN"
```

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### 400 Bad Request
```json
{
  "message": ["email must be an email"],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "statusCode": 500
}
```

## Rate Limits

- API: 100 requests/minute per user
- Form submissions: 5/minute per IP
- Email sending: 14/second (SES sandbox), 50+/second (production)

## Pagination

For list endpoints, use query parameters:
```bash
curl "http://localhost:3000/api/contacts/workspace-uuid?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

## Filtering

Filter contacts by status:
```bash
curl "http://localhost:3000/api/contacts/workspace-uuid?status=subscribed" \
  -H "Authorization: Bearer $TOKEN"
```

## Sorting

Sort contacts by creation date:
```bash
curl "http://localhost:3000/api/contacts/workspace-uuid?sort=createdAt&order=desc" \
  -H "Authorization: Bearer $TOKEN"
```
