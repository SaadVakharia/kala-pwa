# KalaField — Kala Group PWA

Field operations management PWA built with React + Vite + Firebase + Tailwind CSS.

## Quick Start

```bash
npm install
cp .env.example .env   # fill in Firebase keys
npm run dev
```

## Project Directory & Architecture

```
src/
├── api/             # Firebase and Firestore API connections
├── assets/          # Static media and graphics
├── components/      # UI components
│   ├── shared/      # Cards, badges, modals, empty states
│   └── ui/          # Standardized fields: Input, Button, OtpInput
├── hooks/           # Real-time state hooks for Firestore collections
├── layouts/         # Base AppLayout routing shell
├── pages/           # Route pages categorized by role access
├── routes/          # Protected routing logic
├── store/           # Auth and session state (Zustand)
└── utils/           # Shared helper functions (formatting, date-based greets)
```

## Shared UI & Design Tokens

To maintain UI/UX consistency, the workspace enforces the use of core design components. Inline HTML form inputs and custom CSS buttons are deprecated in favor of:

1. **`<Input />`** (`/src/components/ui/Input.jsx`)
   - Standardized input fields (email, tel, password, name).
   - Built-in support for dynamic left icons, right icons (e.g. eye visibility toggles), mobile prefixes (`🇮🇳 +91`), and form error displays.
2. **`<Button />`** (`/src/components/ui/Button.jsx`)
   - Consistent hover/active states and border radius design matching Kala brand tokens.
   - Customizable async `loading` spinners and `loadingLabel` indicators.
3. **`<OtpInput />`** (`/src/components/ui/OtpInput.jsx`)
   - Custom 6-digit OTP verification interface.
   - Encapsulates focus transitions, delete handling, and clipboard paste functionality.

## Shared Helpers & Configurations

- **Centralized Roles Config**: User labels (`ROLE_LABELS`) are exported from the auth store (`/src/store/authStore.js`) as a single source of truth.
- **Phone Formatting**: Standardized number parsing (`formatPhone`) is exported from `/src/utils/helpers.js`.
- **Greeting Banner**: Time-of-day greetings (`greeting()`) are unified across admin and employee dashboards via `/src/utils/helpers.js`.

---

## Roles
- `admin` → `/admin`
- `employee` → `/employee`
- `rsp_technician` → `/rsp`
- `rsp_issue` → `/rsp-issue`
- `client` → `/client`

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