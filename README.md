# KalaField — Kala Group PWA

Field operations management PWA built with React + Vite + Firebase.

## Quick Start

```bash
npm install
cp .env.example .env   # fill in Firebase keys
npm run dev
```

## Roles
- `admin` → /admin
- `employee` → /employee
- `rsp_technician` → /rsp
- `rsp_issue` → /rsp-issue
- `client` → /client

## Firebase Setup
1. Create project at https://console.firebase.google.com
2. Enable **Authentication → Sign-in method → Phone**
3. Create **Firestore Database** (start in test mode)
4. Register a **Web app** → copy config to `.env`

### Environment Variables
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Firestore Collections
```
profiles    → auto-created on first login { fullName, phone, role }
projects    → { name, location, client, status, startDate, endDate }
issues      → { status, title, description, siteId, reportedBy }
```

### Assign a Role (Firestore)
Users are created automatically on first OTP login with role `employee`.
To change a role, use the Admin → Team Members screen, or manually update in Firestore:
```
profiles → [uid] → role: "admin"
```

Valid roles: `admin` `employee` `rsp_technician` `rsp_issue` `client`

## Auth
- **OTP Login** — Firebase Phone Auth (no Twilio needed)
- **Password Login** — phone-based email convention (`91XXXXXXXXXX@kalafield.app`)

## PWA Icons
Pre-generated in `/public/`. Replace with final brand assets when ready.

## Deploy
Push to GitHub → connect to Vercel → add env vars → deploy.
Add `vercel.json` for client-side routing:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
Must be HTTPS for PWA install prompt to work.