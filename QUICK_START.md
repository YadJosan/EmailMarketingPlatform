# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Backend (Already Running!)
```bash
# Backend is already running on http://localhost:3000
# Check status:
curl http://localhost:3000/api/auth/login
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will be at: http://localhost:3001

### 3. Create Your First Account
Visit http://localhost:3001 and sign up!

## 📝 Quick Test

### Create Account & Workspace
```bash
# Sign up
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo123!"}' \
  | jq -r '.accessToken')

# Create workspace
WORKSPACE_ID=$(curl -s -X POST http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Workspace","slug":"demo"}' \
  | jq -r '.id')

echo "Workspace ID: $WORKSPACE_ID"
```

### Import Contacts
```bash
# Create contacts.csv
cat > contacts.csv << EOF
email,first_name,last_name,company
john@example.com,John,Doe,Acme Inc
jane@example.com,Jane,Smith,Tech Corp
EOF

# Import
curl -X POST http://localhost:3000/api/contacts/$WORKSPACE_ID/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@contacts.csv"
```

### Send Campaign
```bash
# Create campaign
CAMPAIGN_ID=$(curl -s -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"workspaceId\":\"$WORKSPACE_ID\",
    \"name\":\"Welcome Email\",
    \"subject\":\"Welcome!\",
    \"fromName\":\"Demo\",
    \"fromEmail\":\"demo@example.com\",
    \"replyTo\":\"demo@example.com\",
    \"content\":{\"blocks\":[{\"type\":\"text\",\"content\":\"Hello!\"}]}
  }" \
  | jq -r '.id')

# Send it
curl -X POST http://localhost:3000/api/campaigns/$CAMPAIGN_ID/send \
  -H "Authorization: Bearer $TOKEN"
```

## 🔧 Configure AWS SES

1. **Get AWS Credentials:**
   - Go to AWS Console → IAM
   - Create user with SES permissions
   - Get Access Key ID & Secret

2. **Update .env:**
```bash
AWS_ACCESS_KEY_ID=your-key-here
AWS_SECRET_ACCESS_KEY=your-secret-here
SES_FROM_EMAIL=verified@yourdomain.com
```

3. **Verify Email in SES:**
   - AWS Console → SES → Verified identities
   - Add email address
   - Check inbox for verification link

4. **Restart Backend:**
```bash
# Backend will auto-reload with new env vars
```

## 📊 Check Status

### Backend Health
```bash
curl http://localhost:3000/api/auth/login
# Should return 401 (expected - no credentials)
```

### Database
```bash
docker ps
# Should show postgres and redis running
```

### Frontend
Visit http://localhost:3001

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Docker
docker ps

# Restart containers
docker-compose restart
```

### Frontend errors
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Database connection error
```bash
# Check PostgreSQL
docker logs mailchimp-postgres-1

# Restart
docker-compose restart postgres
```

## 📚 Next Steps

1. **Read Documentation:**
   - `README.md` - Overview
   - `SETUP.md` - Detailed setup
   - `API_EXAMPLES.md` - API usage
   - `FEATURES.md` - Feature list

2. **Configure AWS SES** (see above)

3. **Build Frontend Features:**
   - Campaign builder UI
   - Contact management
   - Analytics dashboard

4. **Deploy to Production:**
   - Backend: Heroku/Railway/Render
   - Frontend: Vercel/Netlify
   - Database: Managed PostgreSQL

## 🎯 Key URLs

- **Backend API:** http://localhost:3000/api
- **Frontend:** http://localhost:3001
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## 💡 Pro Tips

1. **Use jq for JSON parsing:**
```bash
brew install jq  # macOS
```

2. **Save your token:**
```bash
export TOKEN="your-jwt-token"
```

3. **Test with Postman:**
   - Import API examples
   - Set Authorization header

4. **Monitor logs:**
```bash
# Backend logs (already visible in terminal)
# Docker logs
docker-compose logs -f
```

## 🎉 You're Ready!

Your email marketing platform is running. Start building!

**Questions?** Check the documentation files or test the API endpoints.
