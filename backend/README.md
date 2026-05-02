# AutoCashier - Backend

Minimal Express + TypeScript scaffold for AutoCashier backend.

Run locally:

```bash
cd backend
npm install
cp .env.example .env
# edit .env and set SUPABASE keys + JWT_SECRET
npm run dev
```

API:
- GET /api/health — healthcheck

Next steps:
- Implement auth, products, inventory controllers and routes
