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

## SSR vs CSR Decision (Auth vs Dashboard)
We intentionally split rendering strategy based on data needs:

- Auth pages (login/register) are SSR/static-friendly.
  These pages do not require any client-only data to render.
  They can be served immediately without waiting for user tokens.

- Dashboard and protected pages are CSR.
  These screens require a user token to fetch and display data.
  Our token is stored in `localStorage`, which is only available in the browser.
  Because the server cannot access `localStorage`, these pages must render on the client
  and fetch data after mount.

If we later move the token to an `httpOnly` cookie, protected SSR becomes possible.
