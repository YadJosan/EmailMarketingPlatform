# Workspace Members API

## Overview
Complete workspace member management with role-based access control.

## Roles
- **Owner**: Full control, can transfer ownership
- **Admin**: Can invite/remove members, change roles (except owner)
- **Member**: Basic access to workspace resources

## Endpoints

### Get Workspace Members
```http
GET /workspaces/:id/members
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "userId": "uuid",
    "workspaceId": "uuid",
    "role": "owner",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

### Invite Member
```http
POST /workspaces/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Permissions:** Owner or Admin

**Response:**
```json
{
  "userId": "uuid",
  "workspaceId": "uuid",
  "role": "member",
  "joinedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Member Role
```http
PUT /workspaces/:id/members/:memberId/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

**Permissions:** Owner only

**Response:**
```json
{
  "userId": "uuid",
  "workspaceId": "uuid",
  "role": "admin",
  "joinedAt": "2024-01-01T00:00:00.000Z"
}
```

### Remove Member
```http
DELETE /workspaces/:id/members/:memberId
Authorization: Bearer <token>
```

**Permissions:** 
- Owner can remove anyone (except themselves)
- Admin can remove members (not other admins or owner)

**Response:**
```json
{
  "message": "Member removed successfully"
}
```

### Leave Workspace
```http
POST /workspaces/:id/leave
Authorization: Bearer <token>
```

**Note:** Owner cannot leave. Must transfer ownership first.

**Response:**
```json
{
  "message": "Left workspace successfully"
}
```

### Transfer Ownership
```http
POST /workspaces/:id/transfer-ownership
Authorization: Bearer <token>
Content-Type: application/json

{
  "newOwnerId": "uuid"
}
```

**Permissions:** Owner only

**Response:**
```json
{
  "message": "Ownership transferred successfully"
}
```

## Permission Matrix

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View members | ✅ | ✅ | ✅ |
| Invite member | ✅ | ✅ | ❌ |
| Remove member | ✅ | ✅* | ❌ |
| Change role | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |
| Leave workspace | ❌** | ✅ | ✅ |

*Admin can only remove members, not other admins or owner
**Owner must transfer ownership before leaving

## Testing Examples

### Invite a member
```bash
curl -X POST http://localhost:3000/workspaces/WORKSPACE_ID/members \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "member@example.com", "role": "member"}'
```

### Get all members
```bash
curl http://localhost:3000/workspaces/WORKSPACE_ID/members \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update member role
```bash
curl -X PUT http://localhost:3000/workspaces/WORKSPACE_ID/members/USER_ID/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### Remove member
```bash
curl -X DELETE http://localhost:3000/workspaces/WORKSPACE_ID/members/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```
