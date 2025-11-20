# Workspace Isolation - Quick Reference

## For Developers: How to Maintain Workspace Isolation

### Rule #1: Always Include workspaceId in Queries

```typescript
// ✅ DO THIS
async findContacts(workspaceId: string) {
  return this.repo.find({ where: { workspaceId } });
}

// ❌ NEVER DO THIS
async findContacts() {
  return this.repo.find(); // Returns ALL workspaces!
}
```

### Rule #2: Validate workspaceId on Single Resource Access

```typescript
// ✅ DO THIS
async getContact(contactId: string, workspaceId: string) {
  const contact = await this.repo.findOne({
    where: { id: contactId, workspaceId } // Both required!
  });
  
  if (!contact) {
    throw new NotFoundException('Contact not found');
  }
  
  return contact;
}

// ❌ NEVER DO THIS
async getContact(contactId: string) {
  return this.repo.findOne({ where: { id: contactId } });
}
```

### Rule #3: Set workspaceId on Create

```typescript
// ✅ DO THIS
async create(workspaceId: string, data: CreateDto) {
  const entity = this.repo.create({
    ...data,
    workspaceId, // Always set this!
  });
  return this.repo.save(entity);
}

// ❌ NEVER DO THIS
async create(data: CreateDto) {
  return this.repo.save(data); // Missing workspaceId!
}
```

### Rule #4: Verify Cross-Resource Operations

```typescript
// ✅ DO THIS
async addContactToAudience(contactId: string, audienceId: string, workspaceId: string) {
  const contact = await this.getContact(contactId, workspaceId);
  const audience = await this.getAudience(audienceId, workspaceId);
  
  // Double-check they're in same workspace
  if (contact.workspaceId !== audience.workspaceId) {
    throw new ForbiddenException('Resources must be in same workspace');
  }
  
  // ... proceed
}

// ❌ NEVER DO THIS
async addContactToAudience(contactId: string, audienceId: string) {
  const contact = await this.repo.findOne({ where: { id: contactId } });
  const audience = await this.audienceRepo.findOne({ where: { id: audienceId } });
  // No workspace validation!
}
```

### Rule #5: Controller Methods Must Pass workspaceId

```typescript
// ✅ DO THIS
@Get(':workspaceId/contacts')
async getContacts(
  @Param('workspaceId') workspaceId: string,
  @Request() req,
) {
  // Verify user has access to workspace
  await this.verifyAccess(req.user.userId, workspaceId);
  return this.service.findByWorkspace(workspaceId);
}

// ❌ NEVER DO THIS
@Get('contacts')
async getContacts(@Request() req) {
  return this.service.findAll(); // No workspace context!
}
```

## Common Patterns

### Pattern 1: List Resources
```typescript
async findByWorkspace(workspaceId: string) {
  return this.repo.find({
    where: { workspaceId },
    order: { createdAt: 'DESC' },
  });
}
```

### Pattern 2: Get Single Resource
```typescript
async findOne(id: string, workspaceId: string) {
  const entity = await this.repo.findOne({
    where: { id, workspaceId },
  });
  
  if (!entity) {
    throw new NotFoundException('Resource not found');
  }
  
  return entity;
}
```

### Pattern 3: Update Resource
```typescript
async update(id: string, workspaceId: string, data: UpdateDto) {
  const entity = await this.findOne(id, workspaceId);
  Object.assign(entity, data);
  return this.repo.save(entity);
}
```

### Pattern 4: Delete Resource
```typescript
async delete(id: string, workspaceId: string) {
  const entity = await this.findOne(id, workspaceId);
  await this.repo.remove(entity);
  return { message: 'Deleted successfully' };
}
```

### Pattern 5: Bulk Operations
```typescript
async bulkUpdate(workspaceId: string, ids: string[], data: UpdateDto) {
  // Verify all IDs belong to workspace
  const entities = await this.repo.find({
    where: { id: In(ids), workspaceId },
  });
  
  if (entities.length !== ids.length) {
    throw new NotFoundException('Some resources not found');
  }
  
  entities.forEach(entity => Object.assign(entity, data));
  return this.repo.save(entities);
}
```

## Testing Checklist

When adding a new feature, verify:

- [ ] Entity has `workspaceId` column
- [ ] Entity has `@ManyToOne(() => Workspace)` relationship
- [ ] All find queries include `workspaceId` filter
- [ ] Create operations set `workspaceId`
- [ ] Update/delete verify `workspaceId`
- [ ] Cross-resource operations validate same workspace
- [ ] Controller passes `workspaceId` to service
- [ ] User workspace access is verified
- [ ] Tests cover cross-workspace access attempts
- [ ] Tests verify isolation between workspaces

## Quick Test

```typescript
describe('Workspace Isolation', () => {
  it('should not access resources from other workspace', async () => {
    const ws1 = await createWorkspace('WS1');
    const ws2 = await createWorkspace('WS2');
    const contact = await createContact(ws2.id, 'test@example.com');
    
    // Try to access WS2 contact from WS1 context
    await expect(
      service.findOne(contact.id, ws1.id)
    ).rejects.toThrow(NotFoundException);
  });
});
```

## Red Flags 🚩

Watch out for these anti-patterns:

```typescript
// 🚩 Query without workspaceId
this.repo.find()

// 🚩 findOne without workspaceId
this.repo.findOne({ where: { id } })

// 🚩 Update without verification
this.repo.update({ id }, data)

// 🚩 Delete without verification
this.repo.delete({ id })

// 🚩 Cross-resource without validation
contact.audiences.push(audience)

// 🚩 Controller without workspace context
@Get('all')
findAll() { ... }
```

## Summary

**Golden Rule:** Every database operation must be scoped to a workspace.

If you can answer "yes" to these questions, you're good:
1. Does the query filter by `workspaceId`?
2. Does the create operation set `workspaceId`?
3. Does the update/delete verify `workspaceId`?
4. Are cross-resource operations validated?
5. Does the controller verify user workspace access?

If any answer is "no", you have an isolation vulnerability! 🔒
