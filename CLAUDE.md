# bizz_connect_web — React Frontend

## Tech Stack

- React 19.1.1 + TypeScript 5.8.3
- Vite 6.0.0 (build tool)
- Redux Toolkit 2.9.0 (state management)
- React Router DOM 7.8.2 (routing)
- Tailwind CSS 4.1.12 (styling)
- Axios / native fetch (HTTP via `src/lib/api.ts`)
- Framer Motion (animations)
- Heroicons + Lucide React (icons)
- Yarn 4.12.0 (package manager)

## Project Structure

```
src/
├── App.tsx              Main router tree
├── main.tsx             Entry point
├── store.ts             Redux store (authSlice only)
├── index.css            Tailwind base styles
├── components/
│   ├── auth/            LoginForm, SignupForm, ForgotForm
│   ├── contacts/        ContactList, ContactCard, ContactDetail,
│   │                    EditContactSheet, ImportContactsModal,
│   │                    ExportContactsModal, ContactTagManager
│   ├── reminders/       ReminderTable, ReminderFilters,
│   │                    ReminderFormModal, ReminderPivotTable
│   ├── tags/            TagPill, TagEditModal, TagContactsDrawer
│   ├── settings/        CompanySettings, BusinessCardSettings,
│   │                    CountrySelect, StateSelect, CitySelect
│   ├── home/            StatCard, QuickAction
│   ├── ui/              Pagination, Section, Toast
│   ├── AppNav.tsx       Sidebar navigation
│   ├── ProtectedRoute.tsx
│   ├── GuestRoute.tsx
│   ├── VerifiedRoute.tsx
│   ├── VerifyOnlyRoute.tsx
│   └── EmptyState.tsx
├── features/
│   └── auth/authSlice.ts   Redux state for auth
├── pages/
│   ├── AuthPortal.tsx      Login/Signup combined
│   ├── Dashboard.tsx
│   ├── Contacts.tsx
│   ├── Tags.tsx
│   ├── Reminders.tsx
│   ├── Notifications.tsx
│   ├── Setting.tsx
│   ├── VerifyEmail.tsx
│   ├── ForgotPassword.tsx
│   ├── PublicBusinessCard.tsx
│   ├── NotFound.tsx
│   ├── VerifySuccess.tsx
│   └── ResetVerify.tsx
├── services/            One file per API domain
│   ├── api.ts           (re-exports / base config)
│   ├── auth.ts
│   ├── contacts.ts      (CRUD, import, export)
│   ├── reminders.ts
│   ├── tags.ts
│   ├── notifications.ts
│   ├── businessCard.ts
│   ├── company.ts
│   └── location.ts
├── hooks/
│   ├── useDebounced.ts
│   └── useMediaQuery.ts
├── lib/
│   ├── api.ts           apiFetch, apiFetchBlob helpers
│   ├── auth-token.ts    get/set/clear token in localStorage (key: bc_token)
│   └── config.ts        VITE_API_BASE_URL
└── utils/
```

## Routing (App.tsx)

```
/                     → redirect to /dashboard
/auth                 → AuthPortal         (GuestRoute)
/dashboard            → Dashboard          (VerifiedRoute)
/contacts             → Contacts           (VerifiedRoute)
/tags                 → Tags               (VerifiedRoute)
/reminders            → Reminders          (VerifiedRoute)
/notifications        → Notifications      (VerifiedRoute)
/settings             → Setting            (VerifiedRoute)
/verify-email         → VerifyEmail        (VerifyOnlyRoute)
/verify-success       → VerifySuccess
/reset-verify         → ResetVerify
/forgot-password      → ForgotPassword     (GuestRoute)
/card/:slug           → PublicBusinessCard (public)
*                     → NotFound
```

### Route Guards

| Component | Behavior |
|-----------|---------|
| GuestRoute | Redirects to /dashboard if already authenticated |
| ProtectedRoute | Redirects to /auth if no token |
| VerifiedRoute | Redirects to /verify-email if email not verified |
| VerifyOnlyRoute | Only for authenticated but unverified users |

## Redux State (src/features/auth/authSlice.ts)

```ts
state = {
  token: string | null,    // persisted in localStorage
  user: User | null,
  verified: boolean,
  status: 'idle' | 'loading' | 'succeeded' | 'failed',
  error: string | null,
}

// Thunks
registerThunk(data)
loginThunk(credentials)
meThunk()                  // fetch current user
resendVerifyThunk()
requestPwReset(email)
verifyPwReset({ code, email, password })

// Actions
logout()
setToken(token)
setUser(user)
```

## HTTP Client (src/lib/api.ts)

- `apiFetch(path, options)` — wraps native fetch with:
  - Base URL from `VITE_API_BASE_URL`
  - `Authorization: Bearer <bc_token>` header injection
  - Auto-detects FormData (skips Content-Type for file uploads)
  - Extracts error messages from response JSON
- `apiFetchBlob(path, options)` — same but returns `Blob` (for file downloads)

## Services Layer Pattern

Each service file exports functions that call `apiFetch`:

```ts
// Example: contacts.ts
export const getContacts = (params) => apiFetch('/contacts', { params })
export const createContact = (data) => apiFetch('/contacts', { method: 'POST', body: data })
export const importContacts = (formData) => apiFetch('/contacts/import', { method: 'POST', body: formData })
export const exportContacts = (filters) => apiFetchBlob('/contacts/export', { method: 'POST', body: filters })
```

## Environment

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Dev Commands

```bash
yarn install      # install deps
yarn dev          # Vite dev server → http://localhost:5173
yarn build        # production build → dist/
yarn lint         # ESLint
yarn preview      # preview production build
```

## Key Patterns

- **Contacts** support full-text search (debounced via `useDebounced`)
- **Import/Export** uses FormData + `apiFetchBlob` for file handling
- **Reminders** have a pivot-table view showing contact × reminder matrix
- **Tags** use a drawer (`TagContactsDrawer`) to show all contacts under a tag
- **Business cards** have a public URL `/card/:slug` that works without auth
- **Location** selects (Country → State → City) are cascading dependent dropdowns
- **AI Guide** is accessed via backend SSE stream (`/api/guides/ask-stream`)
- Auth token (`bc_token`) lives in localStorage; Redux reads from there on init
