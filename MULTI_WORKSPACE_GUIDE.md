# Multi-Workspace User Guide

## Overview
Users can belong to multiple workspaces with different roles in each workspace. This enables collaboration across teams and organizations.

## How It Works

### Database Structure
The system uses a **many-to-many relationship** between Users and Workspaces through the `workspace_members` junction table:

```
User (1) ←→ (N) WorkspaceMember (N) ←→ (1) Workspace
```

**Key Tables:**
- `users`: User accounts
- `workspaces`: Workspace entities
- `workspace_members`: Junction table with role information

### User-Workspace Relationship

A single user can:
- ✅ Own multiple workspaces
- ✅ Be an admin in some workspaces
- ✅ Be a regular member in others
- ✅ Switch between workspaces seamlessly
- ✅ Have different permissions in each workspace

## User Flows

### 1. Creating Your First Workspace
When a user signs up, they can create their first workspace:
```
User Signs Up → Dashboard → Create Workspace → Becomes Owner
```

### 2. Joining Additional Workspaces
Users can be invited to other workspaces:
```
Owner/Admin invites by email → User receives invitation → User joins workspace
```

### 3. Managing Multiple Workspaces
Users see all their workspaces on the dashboard:
```
Dashboard → Shows all workspaces with role badges → Click to enter
```

## API Examples

### Get All User's Workspaces
```bash
curl http://localhost:3000/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
[
  {
    "workspaceId": "uuid-1",
    "userId": "user-uuid",
    "role": "owner",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "workspace": {
      "id": "uuid-1",
      "name": "My Company",
      "slug": "my-company",
      "plan": "pro"
    }
  },
  {
    "workspaceId": "uuid-2",
    "userId": "user-uuid",
    "role": "admin",
    "joinedAt": "2024-01-15T00:00:00.000Z",
    "workspace": {
      "id": "uuid-2",
      "name": "Client Project",
      "slug": "client-project",
      "plan": "free"
    }
  },
  {
    "workspaceId": "uuid-3",
    "userId": "user-uuid",
    "role": "member",
    "joinedAt": "2024-02-01T00:00:00.000Z",
    "workspace": {
      "id": "uuid-3",
      "name": "Team Workspace",
      "slug": "team-workspace",
      "plan": "enterprise"
    }
  }
]
```

### Invite User to Workspace
```bash
curl -X POST http://localhost:3000/workspaces/WORKSPACE_ID/members \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "colleague@example.com",
    "role": "member"
  }'
```

## Frontend Features

### Dashboard View
The dashboard displays all workspaces with:
- Workspace name and slug
- User's role badge (owner/admin/member)
- Plan type
- Quick access button

### Role Badges
- **Purple badge**: Owner
- **Blue badge**: Admin
- **Gray badge**: Member

### Workspace Switching
Users can easily switch between workspaces:
1. Click "Back to Dashboard" from any workspace
2. Select a different workspace from the list
3. Context switches to the new workspace

## Permission Isolation

Each workspace has **isolated permissions**:

**Example Scenario:**
```
User: john@example.com

Workspace A (Owner):
  ✅ Can invite members
  ✅ Can remove members
  ✅ Can change roles
  ✅ Can transfer ownership
  ✅ Full access to all resources

Workspace B (Admin):
  ✅ Can invite members
  ✅ Can remove members (not admins)
  ❌ Cannot change roles
  ❌ Cannot transfer ownership
  ✅ Full access to resources

Workspace C (Member):
  ❌ Cannot invite members
  ❌ Cannot remove members
  ❌ Cannot change roles
  ❌ Cannot transfer ownership
  ✅ Can view and use resources
```

## Use Cases

### 1. Freelancer/Agency
```
Personal Workspace (Owner)
  └─ Your own campaigns

Client A Workspace (Admin)
  └─ Manage client campaigns

Client B Workspace (Member)
  └─ View-only access
```

### 2. Enterprise Team
```
Marketing Department (Owner)
  └─ Full control

Sales Department (Admin)
  └─ Manage sales campaigns

Company-wide (Member)
  └─ View company updates
```

### 3. Collaboration
```
Main Business (Owner)
  └─ Your primary workspace

Partner Workspace (Admin)
  └─ Joint venture campaigns

Contractor Workspace (Member)
  └─ Limited access for contractors
```

## Best Practices

### For Workspace Owners
1. **Invite carefully**: Only invite trusted users
2. **Assign appropriate roles**: Give minimum necessary permissions
3. **Regular audits**: Review members periodically
4. **Transfer ownership**: Plan for succession

### For Members
1. **Respect permissions**: Don't try to access restricted features
2. **Leave gracefully**: Use the "Leave Workspace" feature when done
3. **Communicate**: Ask for role changes if needed

### For Admins
1. **Manage members**: Keep the team organized
2. **Don't remove other admins**: Coordinate with owner first
3. **Invite strategically**: Discuss with owner before inviting

## Technical Implementation

### Backend Service Method
```typescript
async findByUser(userId: string) {
  return this.memberRepo.find({
    where: { userId },
    relations: ['workspace'],
  });
}
```

This query returns all workspace memberships for a user, including:
- The membership details (role, joinedAt)
- The full workspace object
- Automatically filtered by userId

### Frontend Display
```typescript
const fetchWorkspaces = async () => {
  const response = await api.get('/workspaces');
  setWorkspaces(response.data); // Array of all user's workspaces
};
```

## Security Considerations

1. **Permission Checks**: Every action verifies user's role in that specific workspace
2. **Workspace Isolation**: Users can only see workspaces they're members of
3. **Role Enforcement**: Backend validates permissions on every request
4. **Token-based Auth**: JWT tokens ensure secure access

## Future Enhancements

Potential features to add:
- [ ] Workspace invitations via email with accept/decline
- [ ] Pending invitations list
- [ ] Workspace activity feed
- [ ] Cross-workspace resource sharing
- [ ] Workspace templates
- [ ] Bulk member management
- [ ] Member activity tracking
- [ ] Workspace usage analytics per user

## Summary

The multi-workspace feature is **fully functional** and allows:
- ✅ Users to belong to unlimited workspaces
- ✅ Different roles in each workspace
- ✅ Easy workspace switching
- ✅ Proper permission isolation
- ✅ Collaborative team management
- ✅ Scalable architecture

Users can seamlessly work across multiple organizations, teams, and projects while maintaining proper access control and security.
