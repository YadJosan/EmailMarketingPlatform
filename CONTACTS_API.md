# Contacts API Documentation

## Overview
Complete CRUD operations for managing contacts with workspace isolation, filtering, tagging, and bulk operations.

## Base URL
```
http://localhost:3000/api/contacts
```

All endpoints require authentication via JWT token in the Authorization header.

---

## Endpoints

### 1. Create Contact

Create a new contact in a workspace.

```http
POST /api/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "workspace-uuid",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "customFields": {
    "company": "Acme Inc",
    "phone": "+1234567890"
  },
  "tags": ["customer", "vip"],
  "source": "manual"
}
```

**Response:**
```json
{
  "id": "contact-uuid",
  "workspaceId": "workspace-uuid",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "customFields": {
    "company": "Acme Inc",
    "phone": "+1234567890"
  },
  "tags": ["customer", "vip"],
  "status": "subscribed",
  "source": "manual",
  "subscribedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. List Contacts

Get all contacts in a workspace with optional filtering.

```http
GET /api/contacts/:workspaceId
GET /api/contacts/:workspaceId?status=subscribed
GET /api/contacts/:workspaceId?tag=vip
GET /api/contacts/:workspaceId?search=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`subscribed`, `unsubscribed`, `bounced`, `complained`)
- `tag` (optional): Filter by tag
- `search` (optional): Search in email, firstName, lastName

**Response:**
```json
[
  {
    "id": "contact-uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "subscribed",
    "tags": ["customer", "vip"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 3. Get Single Contact

Get a specific contact by ID.

```http
GET /api/contacts/:workspaceId/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "contact-uuid",
  "workspaceId": "workspace-uuid",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "customFields": {
    "company": "Acme Inc"
  },
  "tags": ["customer"],
  "status": "subscribed",
  "source": "manual",
  "subscribedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Update Contact

Update contact information.

```http
PUT /api/contacts/:workspaceId/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "customFields": {
    "company": "New Company"
  }
}
```

**Response:**
```json
{
  "id": "contact-uuid",
  "email": "john@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "customFields": {
    "company": "New Company"
  },
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 5. Delete Contact

Delete a contact permanently.

```http
DELETE /api/contacts/:workspaceId/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Contact deleted successfully"
}
```

---

### 6. Subscribe Contact

Mark a contact as subscribed.

```http
POST /api/contacts/:workspaceId/:id/subscribe
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "contact-uuid",
  "status": "subscribed",
  "subscribedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 7. Unsubscribe Contact

Mark a contact as unsubscribed.

```http
POST /api/contacts/:workspaceId/:id/unsubscribe
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "contact-uuid",
  "status": "unsubscribed",
  "unsubscribedAt": "2024-01-02T00:00:00.000Z"
}
```

---

### 8. Add Tags

Add tags to a contact.

```http
POST /api/contacts/:workspaceId/:id/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "tags": ["premium", "newsletter"]
}
```

**Response:**
```json
{
  "id": "contact-uuid",
  "tags": ["customer", "vip", "premium", "newsletter"]
}
```

---

### 9. Remove Tags

Remove tags from a contact.

```http
DELETE /api/contacts/:workspaceId/:id/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "tags": ["vip"]
}
```

**Response:**
```json
{
  "id": "contact-uuid",
  "tags": ["customer", "premium", "newsletter"]
}
```

---

### 10. Bulk Delete

Delete multiple contacts at once.

```http
POST /api/contacts/:workspaceId/bulk-delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": ["contact-uuid-1", "contact-uuid-2", "contact-uuid-3"]
}
```

**Response:**
```json
{
  "message": "3 contacts deleted successfully"
}
```

---

### 11. Bulk Add Tags

Add tags to multiple contacts at once.

```http
POST /api/contacts/:workspaceId/bulk-tag
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": ["contact-uuid-1", "contact-uuid-2"],
  "tags": ["campaign-2024", "promo"]
}
```

**Response:**
```json
{
  "message": "Tags added to 2 contacts"
}
```

---

### 12. Import from CSV

Import contacts from a CSV file.

```http
POST /api/contacts/:workspaceId/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: contacts.csv
audienceId: audience-uuid
```

**CSV Format:**
```csv
email,firstName,lastName,company,phone
john@example.com,John,Doe,Acme Inc,+1234567890
jane@example.com,Jane,Smith,Tech Corp,+0987654321
```

**Response:**
```json
{
  "imported": 2,
  "failed": 0,
  "contacts": [
    {
      "id": "contact-uuid-1",
      "email": "john@example.com"
    },
    {
      "id": "contact-uuid-2",
      "email": "jane@example.com"
    }
  ]
}
```

---

## Audience Management

### 13. Create Audience

Create a new audience (list/segment).

```http
POST /api/contacts/:workspaceId/audiences
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Newsletter Subscribers",
  "description": "All users subscribed to newsletter"
}
```

**Response:**
```json
{
  "id": "audience-uuid",
  "workspaceId": "workspace-uuid",
  "name": "Newsletter Subscribers",
  "description": "All users subscribed to newsletter",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 14. List Audiences

Get all audiences in a workspace.

```http
GET /api/contacts/:workspaceId/audiences/list
Authorization: Bearer <token>
```

**Response:**
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

---

### 15. Add Contact to Audience

Add a contact to an audience.

```http
POST /api/contacts/:workspaceId/:contactId/audiences/:audienceId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "contact-uuid",
  "email": "john@example.com",
  "audiences": [
    {
      "id": "audience-uuid",
      "name": "Newsletter Subscribers"
    }
  ]
}
```

---

## Contact Statuses

- `subscribed`: Active contact, can receive emails
- `unsubscribed`: Opted out, should not receive emails
- `bounced`: Email bounced, invalid address
- `complained`: Marked as spam

## Contact Sources

- `manual`: Manually added
- `import`: Imported from CSV
- `form`: Submitted via form
- `api`: Added via API

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Contact not found"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You do not have access to this workspace"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid email format"
}
```

---

## cURL Examples

### Create Contact
```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "WORKSPACE_ID",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### List Contacts
```bash
curl http://localhost:3000/api/contacts/WORKSPACE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search Contacts
```bash
curl "http://localhost:3000/api/contacts/WORKSPACE_ID?search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Contact
```bash
curl -X PUT http://localhost:3000/api/contacts/WORKSPACE_ID/CONTACT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane"
  }'
```

### Delete Contact
```bash
curl -X DELETE http://localhost:3000/api/contacts/WORKSPACE_ID/CONTACT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Add Tags
```bash
curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/CONTACT_ID/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["vip", "premium"]
  }'
```

### Bulk Delete
```bash
curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/bulk-delete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["contact-id-1", "contact-id-2"]
  }'
```

---

## Best Practices

1. **Always include workspaceId**: Ensures proper data isolation
2. **Use bulk operations**: More efficient for multiple contacts
3. **Validate emails**: Check format before creating contacts
4. **Handle unsubscribes**: Respect user preferences
5. **Use tags**: Organize contacts for better segmentation
6. **Custom fields**: Store additional data as needed
7. **Import validation**: Validate CSV data before import

---

## Rate Limits

- Standard: 100 requests per minute
- Bulk operations: 10 requests per minute
- Import: 5 requests per minute

---

## Workspace Isolation

All contact operations are workspace-scoped:
- Contacts can only be accessed within their workspace
- Cross-workspace operations are prevented
- User must be a member of the workspace
- All queries automatically filter by workspaceId

This ensures complete data isolation and security.
