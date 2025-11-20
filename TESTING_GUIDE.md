# Complete Testing Guide

## Prerequisites

### 1. Start the Backend
```bash
npm run start:dev
```

**Check:** Backend should be running on http://localhost:3000

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

**Check:** Frontend should be running on http://localhost:3001

### 3. Database Running
```bash
docker-compose up -d
```

**Check:** PostgreSQL and Redis should be running

---

## Testing Checklist

### ✅ 1. Authentication System

#### Test Signup
1. Go to http://localhost:3001
2. Click "Sign Up"
3. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
   - First Name: `Test`
   - Last Name: `User`
4. Click "Sign Up"

**Expected:** Success message, email verification notice

#### Test Email Verification (if Mailtrap configured)
1. Check Mailtrap inbox
2. Click verification link
3. Should redirect to login

**Expected:** Email verified successfully

#### Test Login
1. Go to http://localhost:3001
2. Enter credentials
3. Click "Login"

**Expected:** Redirect to dashboard

#### Test Google OAuth (if configured)
1. Click "Continue with Google"
2. Authorize with Google account

**Expected:** Redirect to dashboard

#### Test Forgot Password
1. Click "Forgot Password?"
2. Enter email
3. Check Mailtrap for reset link
4. Click link and set new password

**Expected:** Password reset successfully

---

### ✅ 2. Workspace Management

#### Test Create Workspace
1. Login to dashboard
2. Click "Create Workspace"
3. Enter:
   - Name: `My Marketing Agency`
   - Slug: `my-marketing-agency`
4. Click "Create"

**Expected:** New workspace appears in list

**API Test:**
```bash
# Get your token from browser localStorage
TOKEN="your-jwt-token"

# Create workspace
curl -X POST http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workspace",
    "slug": "test-workspace"
  }'
```

#### Test List Workspaces
```bash
curl http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Array of workspaces with your role

---

### ✅ 3. Workspace Members

#### Test Invite Member
1. Go to workspace
2. Click "Members" in sidebar
3. Click "Invite Member"
4. Enter email and select role
5. Click "Invite"

**Expected:** Member added to list

**API Test:**
```bash
WORKSPACE_ID="your-workspace-id"

curl -X POST http://localhost:3000/api/workspaces/$WORKSPACE_ID/members \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "member@example.com",
    "role": "member"
  }'
```

#### Test List Members
```bash
curl http://localhost:3000/api/workspaces/$WORKSPACE_ID/members \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Update Role
```bash
MEMBER_ID="member-user-id"

curl -X PUT http://localhost:3000/api/workspaces/$WORKSPACE_ID/members/$MEMBER_ID/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

#### Test Remove Member
```bash
curl -X DELETE http://localhost:3000/api/workspaces/$WORKSPACE_ID/members/$MEMBER_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

### ✅ 4. Contacts Management

#### Test Create Contact (UI)
1. Go to workspace
2. Click "Contacts" in sidebar
3. Click "+ Add Contact"
4. Fill in:
   - Email: `john@example.com`
   - First Name: `John`
   - Last Name: `Doe`
5. Click "Create"

**Expected:** Contact appears in list

#### Test Create Contact (API)
```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "customFields": {
      "company": "Acme Inc",
      "phone": "+1234567890"
    },
    "tags": ["customer", "vip"]
  }'
```

#### Test List Contacts
```bash
curl http://localhost:3000/api/contacts/$WORKSPACE_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Search Contacts
```bash
curl "http://localhost:3000/api/contacts/$WORKSPACE_ID?search=john" \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Filter by Status
```bash
curl "http://localhost:3000/api/contacts/$WORKSPACE_ID?status=subscribed" \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Update Contact
```bash
CONTACT_ID="contact-uuid"

curl -X PUT http://localhost:3000/api/contacts/$WORKSPACE_ID/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Johnny",
    "customFields": {
      "company": "New Company"
    }
  }'
```

#### Test Delete Contact
```bash
curl -X DELETE http://localhost:3000/api/contacts/$WORKSPACE_ID/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

### ✅ 5. CSV Import

#### Test Import (UI)
1. Go to Contacts page
2. Click "📥 Import CSV"
3. Download template
4. Fill template with data
5. Upload file
6. Click "Validate CSV"
7. Review validation results
8. Click "Import Contacts"

**Expected:** Import statistics displayed

#### Test Validate CSV (API)
```bash
curl -X POST http://localhost:3000/api/contacts/$WORKSPACE_ID/validate-csv \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@contacts.csv"
```

**Expected:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "preview": [...]
}
```

#### Test Import CSV (API)
```bash
curl -X POST http://localhost:3000/api/contacts/$WORKSPACE_ID/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@contacts.csv" \
  -F "updateExisting=false"
```

**Expected:**
```json
{
  "total": 100,
  "imported": 95,
  "updated": 0,
  "skipped": 3,
  "failed": 2,
  "errors": [...],
  "warnings": [...]
}
```

---

### ✅ 6. Audiences

#### Test Create Audience
```bash
curl -X POST http://localhost:3000/api/contacts/$WORKSPACE_ID/audiences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Newsletter Subscribers",
    "description": "All newsletter subscribers"
  }'
```

#### Test List Audiences
```bash
curl http://localhost:3000/api/contacts/$WORKSPACE_ID/audiences/list \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Add Contact to Audience
```bash
AUDIENCE_ID="audience-uuid"

curl -X POST http://localhost:3000/api/contacts/$WORKSPACE_ID/$CONTACT_ID/audiences/$AUDIENCE_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

### ✅ 7. Segments (Dynamic Filtering)

#### Test Create Segment
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

#### Test Filter Rules
```bash
curl -X POST http://localhost:3000/api/segments/$WORKSPACE_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filterRules": {
      "operator": "AND",
      "conditions": [
        {
          "field": "email",
          "operator": "contains",
          "value": "@gmail.com"
        },
        {
          "field": "status",
          "operator": "equals",
          "value": "subscribed"
        }
      ]
    }
  }'
```

**Expected:**
```json
{
  "count": 25,
  "preview": [
    {
      "id": "...",
      "email": "user@gmail.com",
      "firstName": "User",
      "lastName": "Name"
    }
  ]
}
```

#### Test Evaluate Segment
```bash
SEGMENT_ID="segment-uuid"

curl http://localhost:3000/api/segments/$WORKSPACE_ID/$SEGMENT_ID/evaluate \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Get Segment Count
```bash
curl http://localhost:3000/api/segments/$WORKSPACE_ID/$SEGMENT_ID/count \
  -H "Authorization: Bearer $TOKEN"
```

---

### ✅ 8. Workspace Isolation

#### Test Cross-Workspace Access Prevention
```bash
# Create second workspace
curl -X POST http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Workspace 2",
    "slug": "workspace-2"
  }'

WORKSPACE_2_ID="second-workspace-id"

# Create contact in workspace 1
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "'$WORKSPACE_ID'",
    "email": "test@workspace1.com"
  }'

# Try to access workspace 1 contact from workspace 2 context
curl http://localhost:3000/api/contacts/$WORKSPACE_2_ID/$CONTACT_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** 404 Not Found (contact not accessible from different workspace)

---

## Quick Test Script

Save this as `test.sh`:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 Email Marketing Platform - Quick Test"
echo "========================================"

# 1. Test Backend Health
echo -n "Testing backend... "
if curl -s http://localhost:3000/api/workspaces > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Backend not responding${NC}"
    exit 1
fi

# 2. Test Frontend
echo -n "Testing frontend... "
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Frontend not responding${NC}"
    exit 1
fi

# 3. Test Database
echo -n "Testing database... "
if docker ps | grep -q postgres; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Database not running${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}All services are running!${NC}"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3001"
echo "2. Sign up or login"
echo "3. Create a workspace"
echo "4. Start testing features!"
```

Run it:
```bash
chmod +x test.sh
./test.sh
```

---

## Common Issues & Solutions

### Issue: Backend not starting
**Solution:**
```bash
# Clear dist folder
rm -rf dist

# Reinstall dependencies
npm install

# Start again
npm run start:dev
```

### Issue: Database connection error
**Solution:**
```bash
# Restart Docker containers
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs postgres
```

### Issue: Frontend build errors
**Solution:**
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Issue: CORS errors
**Solution:** Check `.env` file has correct `FRONTEND_URL=http://localhost:3001`

### Issue: JWT token expired
**Solution:** Logout and login again to get new token

---

## Browser DevTools Testing

### Get JWT Token
1. Open browser DevTools (F12)
2. Go to Application/Storage → Local Storage
3. Find `token` key
4. Copy the value

### Test API in Browser Console
```javascript
// Set your token
const token = localStorage.getItem('token');

// Test API call
fetch('http://localhost:3000/api/workspaces', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(console.log);
```

---

## Performance Testing

### Test with Many Contacts
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
      "lastName": "'$i'"
    }' &
done
wait

echo "Created 1000 contacts"
```

### Test Segment Performance
```bash
# Test segment with 1000 contacts
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
        }
      ]
    }
  }'
```

---

## Summary Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] Database connected
- [ ] Can signup/login
- [ ] Can create workspace
- [ ] Can invite members
- [ ] Can create contacts
- [ ] Can import CSV
- [ ] Can create audiences
- [ ] Can create segments
- [ ] Workspace isolation working
- [ ] Search and filters working
- [ ] No console errors

**All checked?** 🎉 Your email marketing platform is working perfectly!
