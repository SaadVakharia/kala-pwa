# KalaField — Kala Group PWA

Field operations management PWA built with React + Vite + Supabase.

## Quick Start

```bash
npm install
cp .env.example .env   # fill in Supabase keys
npm run dev
```

## Roles
- `admin` → /admin
- `employee` → /employee
- `rsp_technician` → /rsp
- `rsp_issue` → /rsp-issue
- `client` → /client

## Supabase Setup
1. Create project at https://app.supabase.com
2. Enable Email Auth: Authentication → Providers → Email
3. Add `role` to user metadata when creating users:
   ```sql
   -- Run in SQL Editor
   UPDATE auth.users
   SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
   WHERE email = 'admin@kalagroup.com';
   ```

## PWA Icons
Pre-generated in `/public/`. Replace with final brand assets when ready.

## Deploy
Push to GitHub → connect to Vercel → set env vars → deploy.
Must be HTTPS for PWA install to work.
