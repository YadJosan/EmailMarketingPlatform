# Workspace-Level Data Isolation

## Overview
Complete data isolation ensures that resources in one workspace cannot be accessed or modified by users from another workspace, even if they share the same database.

## Architecture

### Database Design
Every workspace-scoped entity has a `workspaceId` foreign key:

```
┌─────────────┐
│  Workspace  │
└──────┬──────┘
       │
       ├─────► Contacts (workspaceId)
       ├─────► Audiences (workspaceId)
       ├─────► Campaigns (workspaceId)
       ├─────► Templates (workspaceId)
       ├─────► Forms (workspaceId)
       └─────► Analytics (workspaceId)
```

### Entity Relationships

**Workspace Entity:**
```typescript
@Entity('workspaces')
export class Workspace {
  @Column() name: string;
  @Column() slug: string;
  @Column() ownerId: string;
  
  @OneToMany(() => Contact, contact => contact.workspace)
  contacts: Contact[];
  
  @OneToMany(() => Campaign, campaign => campaign.workspace)
  campaigns: Campaign[];
  
  // ... other relations
}
```

**Scoped Entity Example:**
```typescript
@Entity('contacts')
export class Contact {
  @ManyToOne(() => Workspace)
  workspace: Workspace;
  
  @Column()
  workspaceId: string; // Required for isolation
  
  @Column() email: string;
  // ... other fields
}
```

## Isolation Mechanisms

### 1. Query-Level Isolation

All queries include `workspaceId` in the WHERE clause:

```typescript
// ✅ CORRECT - Workspace isolated
async findByWorkspace(workspaceId: string) {
  return this.contactRepo.find({ 
    where: { workspaceId },
  });
}

// ❌ WRONG - No isolation
async findAll() {
  return this.contactRepo.find(); // Returns ALL contacts
}
```

### 2. Service-Level Validation

Services validate workspace ownership before operations:

```typescript
async findOne(contactId: string, workspaceId: string) {
  const contact = await this.contactRepo.findOne({
    where: { id: contactId, workspaceId }, // Both conditions required
  });

  if (!contact) {
    throw new NotFoundException('Contact not found');
  }

  return contact;
}
```

### 3. Cross-Resource Validation

When linking resources, verify they belong to the same workspace:

```typescript
async addToAudience(contactId: string, audienceId: string, workspaceId: string) {
  const contact = await this.findOne(contactId, workspaceId);
  const audience = await this.audienceRepo.findOne({ 
    where: { id: audienceId, workspaceId },
  });

  // Verify both belong to same workspace
  if (contact.workspaceId !== audience.workspaceId) {
    throw new ForbiddenException('Resources must belong to same workspace');
  }
  
  // ... proceed with operation
}
```

### 4. Controller-Level Guards

Controllers verify user has workspace access:

```typescript
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  @Get(':workspaceId')
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Request() req,
  ) {
    // Verify user is member of workspace
    await this.verifyWorkspaceAccess(req.user.userId, workspaceId);
    return this.contactsService.findByWorkspace(workspaceId);
  }
}
```

## Implementation Checklist

### ✅ Entities
- [x] All workspace-scoped entities have `workspaceId` column
- [x] Foreign key relationships properly defined
- [x] ManyToOne relationship to Workspace entity

### ✅ Services
- [x] All queries include `workspaceId` filter
- [x] Create operations set `workspaceId`
- [x] Update/Delete operations verify `workspaceId`
- [x] Cross-resource operations validate same workspace
- [x] Proper error handling (NotFoundException, ForbiddenException)

### ✅ Controllers
- [x] Workspace ID passed from authenticated user context
- [x] User workspace membership verified
- [x] No direct access to resources without workspace context

## Security Guarantees

### 1. No Cross-Workspace Data Leakage
```typescript
// User A in Workspace 1 tries to access Contact from Workspace 2
const contact = await contactsService.findOne(contactId, workspace1Id);
// Result: NotFoundException (contact doesn't exist in workspace 1)
```

### 2. No Unauthorized Modifications
```typescript
// User tries to add Contact from Workspace 1 to Audience in Workspace 2
await contactsService.addToAudience(contact1Id, audience2Id, workspace1Id);
// Result: ForbiddenException (resources must belong to same workspace)
```

### 3. No Resource Enumeration
```typescript
// User cannot list all contacts across all workspaces
await contactsService.findAll(); // Method doesn't exist
await contactsService.findByWorkspace(workspaceId); // Only returns workspace contacts
```

## Testing Isolation

### Test Scenario 1: Basic Isolation
```typescript
// Setup
const workspace1 = await createWorkspace('Workspace 1');
const workspace2 = await createWorkspace('Workspace 2');
const contact1 = await createContact(workspace1.id, 'user1@example.com');
const contact2 = await createContact(workspace2.id, 'user2@example.com');

// Test
const contacts = await contactsService.findByWorkspace(workspace1.id);

// Assert
expect(contacts).toHaveLength(1);
expect(contacts[0].id).toBe(contact1.id);
expect(contacts).not.toContain(contact2);
```

### Test Scenario 2: Cross-Workspace Access Prevention
```typescript
// Try to access contact from different workspace
await expect(
  contactsService.findOne(contact2.id, workspace1.id)
).rejects.toThrow(NotFoundException);
```

### Test Scenario 3: Cross-Resource Validation
```typescript
// Try to link resources from different workspaces
await expect(
  contactsService.addToAudience(contact1.id, audience2.id, workspace1.id)
).rejects.toThrow(ForbiddenException);
```

## API Examples

### Correct Usage

**Get Workspace Contacts:**
```bash
GET /api/contacts/:workspaceId
Authorization: Bearer <token>

# Returns only contacts from specified workspace
# User must be member of workspace
```

**Create Contact:**
```bash
POST /api/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "workspace-uuid",
  "email": "contact@example.com",
  "firstName": "John"
}

# Contact is created in specified workspace
# User must be member of workspace
```

**Update Contact:**
```bash
PUT /api/contacts/:contactId
Authorization: Bearer <token>
Content-Type: application/json

{
  "workspaceId": "workspace-uuid",
  "firstName": "Jane"
}

# Only updates if contact belongs to workspace
# User must be member of workspace
```

## Database Indexes

For optimal performance with workspace isolation:

```sql
-- Composite indexes for workspace queries
CREATE INDEX idx_contacts_workspace ON contacts(workspaceId, createdAt);
CREATE INDEX idx_campaigns_workspace ON campaigns(workspaceId, status);
CREATE INDEX idx_templates_workspace ON templates(workspaceId, createdAt);
CREATE INDEX idx_audiences_workspace ON audiences(workspaceId, createdAt);

-- Unique constraints with workspace scope
CREATE UNIQUE INDEX idx_contacts_email_workspace ON contacts(email, workspaceId);
CREATE UNIQUE INDEX idx_templates_name_workspace ON templates(name, workspaceId);
```

## Performance Considerations

### Query Optimization
```typescript
// ✅ GOOD - Single query with workspace filter
const contacts = await this.contactRepo.find({
  where: { workspaceId },
  relations: ['audiences'],
});

// ❌ BAD - Multiple queries without workspace filter
const allContacts = await this.contactRepo.find();
const filtered = allContacts.filter(c => c.workspaceId === workspaceId);
```

### Batch Operations
```typescript
// ✅ GOOD - Batch with workspace filter
await this.contactRepo.update(
  { workspaceId, status: 'subscribed' },
  { status: 'unsubscribed' }
);

// ❌ BAD - Load all then filter
const contacts = await this.contactRepo.find();
const workspaceContacts = contacts.filter(c => c.workspaceId === workspaceId);
await Promise.all(workspaceContacts.map(c => this.contactRepo.save(c)));
```

## Migration Strategy

If adding workspace isolation to existing system:

1. **Add workspaceId column:**
```sql
ALTER TABLE contacts ADD COLUMN workspaceId UUID;
```

2. **Migrate existing data:**
```sql
-- Assign all existing contacts to default workspace
UPDATE contacts SET workspaceId = 'default-workspace-uuid' WHERE workspaceId IS NULL;
```

3. **Add NOT NULL constraint:**
```sql
ALTER TABLE contacts ALTER COLUMN workspaceId SET NOT NULL;
```

4. **Add foreign key:**
```sql
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_workspace 
  FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE;
```

5. **Update application code:**
- Add workspaceId to all queries
- Update services with validation
- Add workspace guards to controllers

## Monitoring & Auditing

### Log Workspace Access
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { userId, workspaceId, action } = request;
    
    this.logger.log({
      userId,
      workspaceId,
      action,
      timestamp: new Date(),
    });
    
    return next.handle();
  }
}
```

### Detect Isolation Violations
```typescript
// Alert if query returns resources from multiple workspaces
const contacts = await this.contactRepo.find();
const workspaces = new Set(contacts.map(c => c.workspaceId));

if (workspaces.size > 1) {
  this.logger.error('ISOLATION VIOLATION: Query returned multi-workspace data');
}
```

## Summary

Workspace-level data isolation is **fully implemented** with:

✅ Database-level foreign keys on all entities
✅ Query-level filtering by workspaceId
✅ Service-level validation and error handling
✅ Cross-resource workspace verification
✅ Controller-level access guards
✅ Comprehensive error messages
✅ Performance-optimized queries
✅ Security guarantees against data leakage

The system ensures complete data isolation between workspaces while maintaining performance and usability.
