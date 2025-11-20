# Email Marketing Platform

Modern email marketing platform built with NestJS, PostgreSQL, and Redis.

## Features (MVP)

- Multi-tenant workspaces
- Contact & audience management
- CSV import
- Email campaigns with scheduling
- Block-based template editor
- Open & click tracking
- Analytics dashboard
- Embeddable forms
- REST API

## Tech Stack

- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL
- **Cache/Queue:** Redis + BullMQ
- **Email:** Amazon SES
- **Frontend:** Next.js (separate repo)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL and Redis:
```bash
# Using Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
docker run -d -p 6379:6379 redis:7
```

3. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Run migrations:
```bash
npm run migration:run
```

5. Start development server:
```bash
npm run start:dev
```

## Project Structure

```
src/
├── auth/           # Authentication & authorization
├── workspaces/     # Multi-tenant workspaces
├── contacts/       # Contact & audience management
├── campaigns/      # Email campaigns
├── templates/      # Email templates
├── analytics/      # Tracking & analytics
├── forms/          # Embeddable forms
├── email/          # Email sending service
├── common/         # Shared utilities
└── config/         # Configuration
```

## API Documentation

Once running, visit: http://localhost:3000/api/docs

## License

MIT
