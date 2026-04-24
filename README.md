# Bizz Connect — React 19 Frontend

> Single-page application frontend for Bizz Connect, a CRM-style business networking platform. Built solo end-to-end: UX design, component architecture, state management, API integration, and deployment.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Modules & Features](#modules--features)
- [My Role](#my-role)
- [Notable Implementations](#notable-implementations)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Deployment](#deployment)

---

## Project Overview

**What it does:**
Bizz Connect is a bilingual (Vietnamese/English) business contact management and networking web application. The frontend provides a full CRM interface: contact management with search/tagging/import/export, reminder scheduling, digital business card creation with OCR scanning, company profile management, an in-app notification center, and a bilingual AI assistant with SSE streaming.

**Target market:**
Vietnamese professionals, freelancers, entrepreneurs, and SMEs who need a lightweight CRM with digital card exchange and AI assistant capabilities.

**Current status:**
Production-deployed on Render.com (`bizz-connect-web.onrender.com`). Custom domain `biz-connect.online`. Connects to Laravel backend at `http://127.0.0.1:8000/api` (dev) or the production API URL.

---

## Tech Stack

| Layer | Technology | Version / Notes |
|-------|-----------|----------------|
| UI Library | React | 19.1.1 |
| Language | TypeScript | 5.8.3 |
| Build Tool | Vite | 6.x — sub-second HMR |
| Styling | Tailwind CSS | 4.x (PostCSS plugin) |
| State Management | Redux Toolkit | 2.9.0 |
| React-Redux | react-redux | 9.2.0 |
| Routing | React Router DOM | 7.8.2 (Data Router) |
| HTTP Client | Axios (services) + native fetch (lib) | Axios 1.11.0 |
| Animations | Framer Motion | 12.x |
| Icons | Lucide React + Heroicons | 0.544.0 + 2.2.0 |
| OCR | Tesseract.js | 7.0.0 — client-side OCR |
| Package Manager | Yarn | 4.12.0 |
| Linting | ESLint | 9.x |

No component library (Material UI, shadcn, Radix, etc.) — all UI components are custom-built with Tailwind CSS.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    App.tsx (Router)                   │  │
│  │  GuestRoute → /auth                                   │  │
│  │  VerifyOnlyRoute → /verify-email, /reset-verify       │  │
│  │  VerifiedRoute → /dashboard, /contacts, /tags,        │  │
│  │                  /reminders, /notifications, /settings │  │
│  │  Public → /card/:slug                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐  │
│  │   Redux Store   │    │         Pages Layer           │  │
│  │  authSlice.ts   │    │  Dashboard, Contacts, Tags,   │  │
│  │  token + user   │    │  Reminders, Notifications,    │  │
│  │  (localStorage) │    │  Settings, AuthPortal,        │  │
│  └─────────────────┘    │  PublicBusinessCard           │  │
│                          └──────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Services Layer                      │   │
│  │  auth.ts  contacts.ts  reminders.ts  tags.ts         │   │
│  │  notifications.ts  businessCard.ts  company.ts       │   │
│  │  location.ts                                         │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               HTTP Layer (src/lib/api.ts)            │   │
│  │  apiFetch()  — native fetch + Bearer injection       │   │
│  │  apiFetchBlob() — binary file download               │   │
│  └──────────────────────┬──────────────────────────────┘   │
└───────────────────────── │ ──────────────────────────────────┘
                           │ HTTPS + Authorization: Bearer <token>
                           ▼
                  Laravel 11 Backend API
```

### Route Guard Architecture

```
/auth           ← GuestRoute     (redirect to /dashboard if authenticated)
/verify-email   ← VerifyOnlyRoute (token present but email not verified)
/reset-verify   ← VerifyOnlyRoute
/verify-success ← public
/dashboard      ← VerifiedRoute  (token + verified email required)
/contacts       ← VerifiedRoute
/contacts/:id   ← VerifiedRoute  (opens contact detail modal)
/tags           ← VerifiedRoute
/reminders      ← VerifiedRoute
/notifications  ← VerifiedRoute
/settings       ← VerifiedRoute
/card/:slug     ← public (no auth — shareable business card)
*               ← NotFound
```

---

## Modules & Features

### 1. Authentication & Session Management

Full auth flow with 4-tier route guards:

- **Login** (`LoginForm.tsx`) — dispatches `loginThunk` → `POST /auth/login`; stores token in Redux + `localStorage['bc_token']`
- **Registration** (`SignupForm.tsx`) — dispatches `registerThunk` → `POST /auth/register`; redirects to `/verify-email`
- **Email Verification** — `VerifyEmail` page shows resend option; backend signed URL redirects to `/verify-success?email=...`
- **Password Reset** (`ResetVerify.tsx`) — 3-step: request code → enter 6-digit code → new password
- **Session Restore** — on app mount, `meThunk` calls `GET /auth/me` to restore user from stored token; 401/403 clears all state
- **Logout** — clears `localStorage['bc_token']` + Redux state + calls `POST /auth/logout`

Redux `authSlice` state:
```typescript
{
  token: string | null,       // persisted in localStorage['bc_token']
  user: User | null,          // { id, name, email, email_verified_at }
  verified: boolean | null,
  status: 'idle' | 'loading' | 'failed',
  error?: string
}
```

Key files: `src/features/auth/authSlice.ts`, `src/pages/AuthPortal.tsx`, `src/components/auth/`

---

### 2. Contact Management (CRM Core)

The largest and most complex module:

**Contact List** (`Contacts.tsx` + `ContactList.tsx`):
- Debounced search (`useDebounced(300ms)`) across name, company, email, phone
- Inline hashtag tag filter: typing `#vip` in search automatically filters by tag name
- Tag filter panel: multi-select with AND/OR mode toggle
- Sort by name or creation date (ascending/descending)
- Paginated list with `Pagination` component
- Row-level selection for bulk delete
- Click-to-open contact detail modal (`ContactDetailModal.tsx`) at `/contacts/:id`

**Contact Detail Modal** (`ContactDetail.tsx`):
- Full contact info display: avatar, name, company, job title, email, phone, address, social links, notes
- Tag pills with inline add/remove
- Linked reminders list
- Edit and delete actions

**Edit Contact Sheet** (`EditContactSheet.tsx`):
- Slide-in sheet (not a modal) for create/edit to preserve list context
- Two tabs: **Manual Entry** (form fields) and **Scan Card** (OCR upload)
- Cascading address dropdowns: Country → State → City (each loads on prior selection)
- Avatar upload with preview
- Business card photo upload (front/back) with drag-and-drop

**OCR Scan Tab (in EditContactSheet):**
- User uploads a business card image
- Client-side `ocrImage()` runs Tesseract.js in English mode with progress callback
- Raw text sent to `POST /api/business-card/extract` for regex-based field extraction
- Extracted fields auto-fill the contact form

**Import Contacts** (`ImportContactsModal.tsx`):
- Drag-and-drop file upload (XLSX or CSV)
- Template download button (`GET /api/contacts/export-template`)
- Match-by selector: `id`, `email`, or `phone`
- After import: displays summary card — `{ created, updated, skipped, errors[] }`

**Export Contacts** (`ExportContactsModal.tsx`):
- Format selector: XLSX or CSV
- Scope: all contacts, or with current search/tag filters applied
- Triggers `apiFetchBlob()` → browser file download

**Bulk Delete:**
- Select contacts via checkboxes → `POST /api/contacts/bulk-delete`

Key files: `src/pages/Contacts.tsx`, `src/components/contacts/`, `src/services/contacts.ts`

---

### 3. Tag System

User-owned labels with full management UI:

- **Tag List** (`Tags.tsx`): all tags displayed with contact count
- **Create Tag**: inline form, dispatches `POST /api/tags`
- **Rename Tag** (`TagEditModal.tsx`): modal with current name pre-filled
- **Delete Tag**: with confirmation dialog
- **TagContactsDrawer** (`TagContactsDrawer.tsx`): slide-in drawer showing all contacts under a tag; supports removing contacts from the tag inline
- **Tag Filter on Contacts page**: multi-select tag filter with AND/OR toggle
- **Inline Tag Attach** on contact detail: type or search tag name → attach or create-on-the-fly
- **Tag Pills** (`TagPill.tsx`): reusable badge component used across contact cards and detail views

Key files: `src/pages/Tags.tsx`, `src/components/tags/`, `src/services/tags.ts`

---

### 4. Reminder Management

Multi-contact follow-up reminders with two views:

**Standard Table View** (`ReminderTable.tsx`):
- Sortable table: title, contacts, due date, status, channel
- Status badges: Pending, Done, Skipped, Cancelled (color-coded)
- Overdue detection (past due + still pending)
- Row selection for bulk actions (bulk status update, bulk delete)
- Mark done per row
- Click to open edit modal

**Pivot Table View** (`ReminderPivotTable.tsx`):
- Fetches `GET /api/reminders/pivot` — paginated join of `contact_reminder` × `reminders` × `contacts`
- Shows each contact-reminder edge as a row: who the reminder is about, reminder title, due date, is_primary flag
- Useful for seeing "all reminders attached to a specific person" across the full list

**Reminder Form Modal** (`ReminderFormModal.tsx`):
- Title, note, due date + time picker
- Channel selector: App, Email, Calendar
- Multi-contact picker: search and select multiple contacts (`SelectContactsModal.tsx`)
- Shows currently attached contacts with detach button

**Filters** (`ReminderFilters.tsx`):
- Status filter (all, pending, done, skipped, cancelled)
- Date range (after / before)
- Overdue toggle
- Contact ID filter (from contact detail view)

Key files: `src/pages/Reminders.tsx`, `src/components/reminders/`, `src/services/reminders.ts`

---

### 5. In-App Notifications

Notification inbox with scoped views:

- Scope tabs: **All**, **Unread**, **Upcoming**, **Past**
- Per-notification actions: mark read, mark done, delete
- Bulk mark-all-read
- Notification badge count on nav icon (unread count)
- Clicking a notification navigates to the related contact or reminder
- Fetched on page load; no polling or WebSocket

Key files: `src/pages/Notifications.tsx`, `src/services/notifications.ts`

---

### 6. Settings (Profile + Company + Business Card)

Three-section settings page (`Setting.tsx`):

**Profile Settings:**
- Name, phone, locale, timezone fields
- Avatar upload with preview (`PATCH /api/auth/me`)

**Company Settings** (`CompanySettings.tsx`):
- Company name, tax code, phone, email, website, description
- Logo upload
- Cascading address (Country → State → City)
- Upsert on save (`POST /api/company`)

**Business Card Settings** (`BusinessCardSettings.tsx`):
- Full professional card form: full name, job title, department, email, phone, mobile, website, LinkedIn, Facebook, Twitter
- Image uploads: avatar, card front photo, card back photo, background image
- **OCR Scan pipeline**: upload card image → Tesseract.js OCR → send raw text to `/api/business-card/extract` → auto-fill form fields
- `is_public` toggle with shareable public URL display (`/card/:slug`)
- **Card Preview** (`CardGenerator.tsx`): live visual rendering of the business card as the user fills in fields
- Copy-to-clipboard for public URL
- `view_count` display ("X views")

Key files: `src/pages/Setting.tsx`, `src/components/settings/`

---

### 7. Digital Business Card (Public View)

Public-facing shareable card page:

- Route `/card/:slug` — no auth required
- Fetches `GET /api/business-card/public/{slug}` (increments view count on backend)
- Displays: avatar, name, job title, company, contact info, social links, card photos
- "Connect" button: if logged in, calls `POST /api/business-card/connect/{slug}` to auto-create a Contact from the card owner's data
- Accessible without login for sharing via URL or QR code

Key files: `src/pages/PublicBusinessCard.tsx`, `src/services/businessCard.ts`

---

### 8. Dashboard

Overview home screen (`Dashboard.tsx`):

- **Stats cards**: total contacts, total tags, pending reminders, unread notifications (fetched in parallel with `Promise.all`)
- **Recent Contacts**: last 5 contacts added
- **Upcoming Reminders**: next pending reminders sorted by `due_at`
- **Unread Notifications**: latest unread items with quick mark-read actions
- **Quick Actions**: shortcuts to create contact, create reminder, open settings

Key files: `src/pages/Dashboard.tsx`, `src/components/home/StatCard.tsx`, `src/components/home/QuickAction.tsx`

---

### 9. Location Cascading Selects

Reusable location dropdowns used in contact forms, company settings, and business card settings:

- `CountrySelect.tsx` → fetches `GET /api/countries` (runs once, cached in component state)
- `StateSelect.tsx` → fetches `GET /api/countries/{code}/states` when country changes
- `CitySelect.tsx` → fetches `GET /api/states/{code}/cities` when state changes
- Each clears child selections when parent changes
- Stores `code` value (not display name) for backend compatibility

Key files: `src/components/settings/CountrySelect.tsx`, `StateSelect.tsx`, `CitySelect.tsx`

---

## My Role

I designed and built this frontend **end-to-end, solo**, across all phases:

| Phase | What I did |
|-------|-----------|
| **UX Design** | Designed all screens and user flows: auth portal, CRM list/detail pattern, settings multi-section layout, public business card page, pivot table view for reminders |
| **Component Architecture** | Defined the component hierarchy: pages → feature components → reusable UI components; separated services layer from UI; established route guard pattern |
| **State Management** | Implemented Redux Toolkit auth slice with async thunks for full auth lifecycle; chose local state (useState/useEffect) for all other modules to avoid over-engineering |
| **HTTP Layer** | Built `apiFetch` and `apiFetchBlob` wrapper functions over native fetch with auto Bearer injection, FormData detection, and structured error extraction; separate Axios instance for services layer |
| **API Integration** | Wrote all 9 service files (~50+ typed API functions) covering every backend endpoint |
| **OCR Integration** | Integrated Tesseract.js v7 client-side OCR with progress reporting; designed the OCR → regex-extract → form-fill pipeline for business card scanning |
| **Real-time AI Streaming** | Consumed the backend's SSE endpoint for AI guide streaming; implemented incremental rendering of typed events (title, description, step, tips, related) |
| **TypeScript** | Defined all types inline in service files: Contact, Reminder, Tag, Notification, BusinessCard, Me, etc.; typed all Redux state and dispatch |
| **Routing & Guards** | Implemented 4-tier route guard system: GuestRoute, ProtectedRoute, VerifiedRoute, VerifyOnlyRoute |
| **Deployment** | Deployed to Render.com; configured `VITE_API_BASE_URL` for production; handled runtime config injection via `window.VITE_API_BASE_URL` fallback |

---

## Notable Implementations

### 4-Tier Route Guard System
Routes are protected at 4 distinct levels: unauthenticated (guest-only), token-present-but-unverified, fully authenticated+verified, and public. This prevents:
- Authenticated users seeing the login page (GuestRoute redirects to dashboard)
- Verified users getting stuck on /verify-email
- Unverified users accessing CRM features and receiving confusing 403s

### Client-Side OCR with Tesseract.js
Business card scanning runs entirely in the browser using Tesseract.js v7. A Tesseract worker is created on demand, runs English OCR on the uploaded image, emits progress callbacks (0–100%) shown as a progress bar, then terminates. The raw text is sent to the backend for regex-based field extraction. No server-side image processing required for the OCR step.

### SSE Streaming for AI Guide
The AI guide consumes the backend's `text/event-stream` SSE endpoint using `fetch` with `response.body.getReader()`. The frontend parses each typed event (`start`, `title`, `description`, `step`, `tips`, `related`, `done` for KB answers; `chunk` for Gemini streaming) and renders content progressively — section by section as it arrives, not all at once.

### Debounced Search with Hashtag Parsing
The contact search input is debounced 300ms via `useDebounced`. Before sending the query to the API, the frontend parses inline `#hashtags` from the search string, extracts them as tag names, and passes them separately as `tags[]=vip&tags[]=client` query parameters alongside the remaining text query. This lets users do natural combined text+tag search in a single input field.

### `apiFetch` + `apiFetchBlob` HTTP Abstraction
Rather than scattering `Authorization` header logic across every API call, a thin `apiFetch` wrapper reads `bc_token` from `localStorage` and injects the Bearer header automatically. For FormData uploads it detects the body type and skips setting `Content-Type` (allowing the browser to set the correct `multipart/form-data` boundary). `apiFetchBlob` handles binary responses (Excel/CSV downloads) and triggers a browser `<a>` download programmatically.

### Pivot Table View for Reminders
The standard reminder view shows reminders as rows. The pivot view calls `GET /api/reminders/pivot` which returns a custom paginated JOIN of `contact_reminder × reminders × contacts`. This renders as a table of contact-reminder edges — useful for seeing all reminders associated with a specific person across the full dataset, without needing to open each contact individually.

### Cascading Location Selects
Country → State → City dropdowns are implemented as three independent components that communicate via controlled value props. Each child component clears its own value and child value when its parent selection changes. The Country list is fetched once on mount; State and City lists are fetched on-demand when the parent code changes, minimizing unnecessary API calls.

### Runtime API URL Override
`src/lib/config.ts` resolves the API base URL from multiple sources in priority order: `import.meta.env.VITE_API_BASE_URL` (Vite), `process.env.NEXT_PUBLIC_API_BASE_URL` (Next.js compat), `process.env.REACT_APP_API_BASE_URL` (CRA compat), and finally `window.VITE_API_BASE_URL` (runtime injection via `public/config.js`). This allows the production deployment to override the URL without rebuilding the bundle.

---

## Project Structure

```
src/
├── App.tsx                     Root router with all route guards
├── main.tsx                    Vite entry point
├── store.ts                    Redux store (authSlice only)
├── index.css                   Tailwind CSS base
│
├── features/
│   └── auth/
│       └── authSlice.ts        Redux: token, user, verified + async thunks
│
├── pages/
│   ├── AuthPortal.tsx          Login + Register combined (GuestRoute)
│   ├── Dashboard.tsx           Stats, recent contacts, upcoming reminders
│   ├── Contacts.tsx            CRM list with search/filter/modal detail
│   ├── Tags.tsx                Tag CRUD + contact management per tag
│   ├── Reminders.tsx           Table + pivot table view + CRUD
│   ├── Notifications.tsx       Notification inbox with scopes
│   ├── Setting.tsx             Profile + Company + Business Card settings
│   ├── PublicBusinessCard.tsx  Public /card/:slug view
│   ├── VerifyEmail.tsx         Email verification pending
│   ├── VerifySuccess.tsx       Post-verification success
│   ├── ResetVerify.tsx         Password reset code entry
│   └── NotFound.tsx            404
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ForgotForm.tsx
│   ├── contacts/
│   │   ├── ContactList.tsx         Paginated list with selection
│   │   ├── ContactCard.tsx         Single contact card display
│   │   ├── ContactDetail.tsx       Full detail view
│   │   ├── ContactDetailModal.tsx  Modal wrapper for detail
│   │   ├── EditContactSheet.tsx    Slide-in create/edit + OCR tab
│   │   ├── ContactTagManager.tsx   Tag attach/detach on contact
│   │   ├── ExportContactsModal.tsx Export dialog
│   │   ├── ImportContactsModal.tsx Import with drag-drop + summary
│   │   └── SelectContactsModal.tsx Multi-contact picker
│   ├── reminders/
│   │   ├── ReminderTable.tsx       Standard sortable table
│   │   ├── ReminderPivotTable.tsx  Contact×Reminder edge table
│   │   ├── ReminderFormModal.tsx   Create/edit modal
│   │   └── ReminderFilters.tsx     Filter bar
│   ├── tags/
│   │   ├── TagPill.tsx             Reusable tag badge
│   │   ├── TagEditModal.tsx        Rename modal
│   │   └── TagContactsDrawer.tsx   Contacts-in-tag slide-in drawer
│   ├── settings/
│   │   ├── BusinessCardSettings.tsx  Card form + OCR + preview
│   │   ├── CompanySettings.tsx       Company profile form
│   │   ├── CardGenerator.tsx         Live card visual preview
│   │   ├── CountrySelect.tsx
│   │   ├── StateSelect.tsx
│   │   └── CitySelect.tsx
│   ├── home/
│   │   ├── StatCard.tsx
│   │   └── QuickAction.tsx
│   ├── ui/
│   │   ├── Toast.tsx               Toast notification system + useToast hook
│   │   ├── ConfirmDialog.tsx        Reusable confirmation dialog
│   │   ├── Pagination.tsx
│   │   └── Section.tsx
│   ├── AppNav.tsx                  Main sidebar navigation
│   ├── ProtectedRoute.tsx          Requires token
│   ├── VerifiedRoute.tsx           Requires token + verified email
│   ├── VerifyOnlyRoute.tsx         Token-present, unverified only
│   └── GuestRoute.tsx              Redirects away if authenticated
│
├── services/                   One file per API domain
│   ├── api.ts                  Axios instance + Bearer interceptor
│   ├── auth.ts                 login, register, me, updateMe, password reset
│   ├── contacts.ts             CRUD, import, export, avatar, card images, bulk ops
│   ├── reminders.ts            CRUD, bulk ops, pivot, contact attach/detach
│   ├── tags.ts                 CRUD, contact attach/detach
│   ├── notifications.ts        list, read, done, bulk read, delete
│   ├── businessCard.ts         CRUD, public view, connect, extract OCR
│   ├── company.ts              CRUD
│   └── location.ts             countries, states, cities
│
├── lib/
│   ├── api.ts                  apiFetch / apiFetchBlob (native fetch wrappers)
│   ├── auth-token.ts           get/set token in localStorage
│   ├── config.ts               VITE_API_BASE_URL resolver (multi-source)
│   └── ocr.ts                  Tesseract.js worker lifecycle + ocrImage()
│
├── hooks/
│   ├── useDebounced.ts         Debounce any value (default 300ms)
│   └── useMediaQuery.ts        Reactive window.matchMedia
│
└── utils/
    └── hooks.ts                useAppDispatch / useAppSelector (typed)
```

---

## Installation & Setup

### Requirements

- Node.js 18+
- Yarn 4+ (`corepack enable`)

### Steps

```bash
git clone <repo-url>
cd bizz_connect_web

yarn install

cp .env.example .env
# Edit .env:
# VITE_API_BASE_URL=http://127.0.0.1:8000/api

yarn dev
# Vite dev server at http://localhost:5173
```

### Available Commands

```bash
yarn dev        # Start Vite dev server (HMR)
yarn build      # TypeScript check + production build → dist/
yarn preview    # Preview production build
yarn lint       # ESLint
```

### Environment Variables

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## Deployment

**Hosted on:** Render.com (static site)

**Build command:**
```bash
yarn build
```

**Publish directory:** `dist/`

**Environment variable on Render:**
```
VITE_API_BASE_URL=https://api.biz-connect.online/api
```

**Runtime override** (alternative to rebuild): inject `window.VITE_API_BASE_URL` in `public/config.js` — the app reads this as fallback if the Vite env var is not set at build time.

**SPA routing:** Configure Render (or Nginx/Netlify/Vercel) to redirect all `/*` requests to `index.html` so React Router handles client-side routing.
