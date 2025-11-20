# Email Marketing Platform - Setup Guide

## Prerequisites

- Node.js 18+ installed
- Docker Desktop installed and running
- AWS account with SES access (for production email sending)

## Backend Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start PostgreSQL and Redis:**
```bash
docker-compose up -d
```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` (already done)
   - Update AWS SES credentials in `.env`:
     ```
     AWS_REGION=us-east-1
     AWS_ACCESS_KEY_ID=your-actual-key
     AWS_SECRET_ACCESS_KEY=your-actual-secret
     SES_FROM_EMAIL=verified@yourdomain.com
     ```

4. **Start the backend:**
```bash
npm run start:dev
```

Backend will run on http://localhost:3000

## Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the frontend:**
```bash
npm run dev
```

Frontend will run on http://localhost:3001

## AWS SES Configuration

### 1. Verify Your Email/Domain

In AWS SES Console:
- Go to "Verified identities"
- Click "Create identity"
- Choose "Email address" or "Domain"
- Follow verification steps

### 2. Request Production Access

By default, SES is in sandbox mode (can only send to verified emails):
- Go to SES Console → Account dashboard
- Click "Request production access"
- Fill out the form explaining your use case

### 3. Set Up SNS for Bounce/Complaint Notifications

1. Create SNS Topic:
   ```bash
   aws sns create-topic --name ses-notifications
   ```

2. Subscribe your webhook endpoint:
   ```bash
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT:ses-notifications \
     --protocol https \
     --notification-endpoint https://yourdomain.com/api/webhooks/ses
   ```

3. Configure SES to publish to SNS:
   - Go to SES Console → Configuration sets
   - Create configuration set
   - Add event destination → SNS
   - Select your topic

## Testing the Platform

### 1. Create an Account

Visit http://localhost:3001 and sign up with your email.

### 2. Create a Workspace

```bash
curl -X POST http://localhost:3000/api/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Workspace", "slug": "my-workspace"}'
```

### 3. Import Contacts

Create a CSV file (`contacts.csv`):
```csv
email,first_name,last_name,company
john@example.com,John,Doe,Acme Inc
jane@example.com,Jane,Smith,Tech Corp
```

Upload via API:
```bash
curl -X POST http://localhost:3000/api/contacts/WORKSPACE_ID/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@contacts.csv" \
  -F "audienceId=AUDIENCE_ID"
```

### 4. Create and Send a Campaign

```bash
# Create campaign
curl -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "WORKSPACE_ID",
    "name": "Welcome Campaign",
    "subject": "Welcome to our platform!",
    "fromName": "Your Company",
    "fromEmail": "noreply@yourdomain.com",
    "replyTo": "support@yourdomain.com",
    "audienceId": "AUDIENCE_ID",
    "content": {"blocks": [{"type": "text", "content": "Hello {{first_name}}!"}]}
  }'

# Send campaign
curl -X POST http://localhost:3000/api/campaigns/CAMPAIGN_ID/send \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. View Analytics

```bash
curl http://localhost:3000/api/analytics/campaigns/CAMPAIGN_ID/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### Workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces` - List user workspaces

### Contacts
- `POST /api/contacts` - Add contact
- `GET /api/contacts/:workspaceId` - List contacts
- `POST /api/contacts/:workspaceId/import` - Import CSV

### Campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/:id/send` - Send campaign

### Analytics
- `GET /api/analytics/campaigns/:id/stats` - Campaign stats

### Forms
- `POST /api/forms` - Create embeddable form
- `POST /api/forms/:id/submit` - Public form submission

### Webhooks
- `POST /api/webhooks/ses` - SES bounce/complaint notifications

## Database Schema

TypeORM will auto-create tables in development mode. For production, generate and run migrations:

```bash
npm run migration:generate -- -n InitialSchema
npm run migration:run
```

## Troubleshooting

### Backend won't start
- Check if PostgreSQL and Redis are running: `docker ps`
- Check logs: `docker logs mailchimp-postgres-1`

### Emails not sending
- Verify SES credentials in `.env`
- Check if email/domain is verified in SES
- Check SES sending limits (14 emails/sec in sandbox)

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check CORS settings in `src/main.ts`

## Production Deployment

### Backend (Heroku/Railway/Render)

1. Set environment variables
2. Use managed PostgreSQL and Redis
3. Set `NODE_ENV=production`
4. Disable TypeORM `synchronize` (use migrations)

### Frontend (Vercel/Netlify)

1. Set `NEXT_PUBLIC_API_URL` to your backend URL
2. Deploy with `npm run build`

## Next Steps

- [ ] Add A/B testing for campaigns
- [ ] Build drag-and-drop template editor
- [ ] Add automation flows (drip sequences)
- [ ] Implement landing page builder
- [ ] Add SMS/push notifications
- [ ] Integrate with Stripe for billing
- [ ] Add team collaboration features
- [ ] Build mobile app

## Support

For issues or questions, check the README.md or create an issue in the repository.
