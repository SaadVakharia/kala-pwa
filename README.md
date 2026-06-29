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
│   ├── shared/      # Cards, badges, modals, empty states (e.g. ManageClientsModal)
│   └── ui/          # Standardized fields: Input, Button, OtpInput
├── hooks/           # Real-time state hooks for Firestore collections
├── layouts/         # Base AppLayout routing shell
├── pages/           # Route pages categorized by role access (e.g. CreateProject, ProjectDetails)
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

## Core Features & Updates

### 1. Unified Client Management
- **Manage Clients Dashboard**: Admins can now manage all client entities directly from the **Projects** list. Includes quick add, inline renaming, and safe deletion.
- **Project Reference Check**: Deleting a client automatically scans the `projects` collection and triggers a prominent warning on the UI showing the number of attached projects to prevent broken data relationships.

### 2. Standalone Create/Edit Site Page
- **Detailed Form**: Replaced the project creator modal with a standalone stacked-card page (`/admin/projects/new`).
- **Project Value**: Replaced the panel-count model with a monetary project value field in Crores (Cr) with native Indian Rupee (₹) styling.
- **Multiple Site Files**: Supports uploading multiple PDF, DOC, or image files. Each file can be custom-named, stored in Firebase, and listed inside `ProjectDetails` as a downloadable file element.
- **Responsive Header**: Redesigned header layouts that adapt gracefully to mobile viewport heights by wrapping actions (like "Manage Clients" and "Add Project") rather than overflowing.

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
clients     → store clients { name, createdAt, updatedAt }
projects    → store sites { name, clientId, location, status, projectValue, siteFiles, startDate, endDate }
issues      → store site tickets { status, title, description, siteId, reportedBy }
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