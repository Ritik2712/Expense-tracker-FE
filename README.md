# Expense Tracker Frontend (Next.js)

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

App runs at `http://localhost:3000`.
Backend URL is read from `NEXT_PUBLIC_API_URL` (default `.env.example` points to Render).

## Tech
- Next.js (JavaScript)
- Tailwind CSS
- Axios

## Route Coverage
- Auth: `/auth`, `/auth/admin`, `/auth/login`
- Users: `/users/me`, `/users/update/{id}`, `/users/{id}`
- Accounts: all CRUD routes
- Transactions: all CRUD/list/get routes
- Admin: all admin routes
