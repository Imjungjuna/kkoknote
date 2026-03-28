# KkokNote — Project Context

## 1. Project Overview

KkokNote is an **embeddable feedback widget SaaS** for indie hackers and developers.
Website owners embed a single `<script>` tag to get a fully functional feedback board, upvoting system, and changelog — no backend setup required.

**Core user roles:**

- **Admin (project owner):** Creates projects, manages feedback via a Kanban dashboard
- **End user (widget user):** Submits feedback, votes on existing feedback, views changelog — anonymously or identified

**Current stage:** MVP / pre-launch. Beta waitlist at `/join-betaTesters`.

---

## 2. Tech Stack & Architecture

| Layer          | Choice                                                               |
| -------------- | -------------------------------------------------------------------- |
| Framework      | Next.js 16.2.1 — **App Router**                                      |
| Language       | TypeScript                                                           |
| UI             | React 19                                                             |
| Styling        | Tailwind CSS v4 (PostCSS), IBM Plex Sans KR + Times as default fonts |
| State          | Zustand                                                              |
| Backend        | Supabase (Postgres + Auth + Realtime)                                |
| Auth           | Supabase Auth                                                        |
| Widget bundler | esbuild (IIFE format → `public/kkoknote-widget-sdk.js`)              |
| Icons          | lucide-react                                                         |
| Animation      | Remotion (planned — for animated video/motion content)               |

**Architecture notes:**

- The widget runs inside a **Shadow DOM** to isolate styles from the host site
- Widget state lives in Zustand (`useWidgetStore`) and syncs via Supabase Realtime
- Admin dashboard is fully CSR — no SSR data fetching; loads via Supabase browser client on mount
- API routes act as thin proxies (auth validation, CORS headers) — business logic is in Supabase RLS
- The Next.js middleware (`proxy.ts` → `lib/supabase/proxy.ts`) handles session refresh and route guards

---

## 3. Coding Conventions

### Naming

- **Files:** PascalCase for components (`BetaSignupForm.tsx`), camelCase for stores (`useWidgetStore.ts`), kebab-case for config files
- **Components:** PascalCase named default exports
- **Stores:** `use[StoreName]` (Zustand pattern)
- **Types/Interfaces:** PascalCase (`WidgetFeedback`, `AdminFeedback`, `IdentifiedUser`)
- **Variables/functions:** camelCase
- **LocalStorage keys:** namespaced with `kkoknote:` prefix (e.g., `kkoknote:identify`, `kkoknote:votes:${projectKey}:${feedbackId}`)
- **Status literals:** lowercase string unions (`"pending" | "progress" | "done"`)

### Error Handling

- Supabase calls: always check `if (error)` after operations; never throw — set UI state instead
- RLS/auth errors fail silently to avoid leaking information
- User-facing error messages are in Korean (e.g., `"너무 자주 보냈어. 잠시만 쉬어줘"`)
- Try-catch in async handlers with `finally` to reset loading state

### Forms (Client Components)

- Always `"use client"` with `useState` for field/loading/error/success state
- Use `void (async () => { ... })()` pattern for event handlers (avoids returning a Promise from onClick/onSubmit)
- Supabase browser client called directly from the component — no server actions

### Rendering Strategy

- **Server Components (default):** layout files, static landing pages
- **Client Components (`"use client"`):** all forms, dashboard, widget, anything with state or Supabase browser client
- **API Routes:** thin handlers — auth check, status validation, then Supabase operation
- No `getServerSideProps` / `getStaticProps` (App Router only)

### Rate Limiting

- Client-side only (MVP): sliding window of 5 requests per 60 seconds
- Implemented via ref-based timestamp queues (`submitQueueRef`, `voteQueueRef`)
- Returns `{ allowed: boolean, remainingSec: number }`

---

## 4. Directory Structure

```
kkoknote/
├── app/
│   ├── (admin)/                     # Route group — auth-protected admin pages
│   │   ├── dashboard/page.tsx       # Kanban board (CSR, Zustand + Realtime)
│   │   └── login/page.tsx           # Email/password login form
│   ├── api/
│   │   ├── admin/feedbacks/[feedbackId]/status/route.ts  # Update feedback status (auth required)
│   │   └── widget/
│   │       ├── config/route.ts      # GET project config by projectKey (CORS-aware)
│   │       └── sdk.js/route.ts      # Serves the widget SDK bundle
│   ├── join-betaTesters/page.tsx    # Beta signup landing page (Server Component)
│   ├── layout.tsx                   # Root layout — fonts, metadata, html/body
│   ├── page.tsx                     # Redirects → /join-betaTesters
│   └── globals.css                  # Tailwind v4 import, CSS variables, animations
│
├── components/
│   ├── BetaSignupForm.tsx           # Client Component — beta email signup with Supabase insert
│   └── widget/
│       ├── WidgetLoader.tsx         # Creates Shadow DOM host, mounts React root
│       ├── WidgetUI.tsx             # Main widget UI — tabs, feedback form, voting, updates
│       └── sdk-entry.ts            # window.KkokNote API bootstrap (init, identify)
│
├── src/store/
│   ├── useWidgetStore.ts            # Widget state: feedbacks, updates, user ID, voting, realtime
│   └── useAdminStore.ts            # Admin state: projects, feedbacks, realtime subscription
│
├── lib/supabase/
│   ├── client.ts                   # createBrowserClient — use in Client Components
│   ├── server.ts                   # createServerClient — use in Server Components / Route Handlers
│   ├── proxy.ts                    # Middleware logic: session refresh + route guards
│   ├── middleware.ts               # (placeholder)
│   └── database.types.ts          # (placeholder — replace with `supabase gen types` output)
│
├── utils/supabase/
│   └── middleware.ts               # Alternative middleware Supabase client (Next.js middleware context)
│
├── supabase/sql/
│   ├── kkoknote_schema.sql         # Core schema + RLS policies
│   └── beta_registrations.sql     # Beta waitlist table + RLS policies
│
├── scripts/
│   └── build-widget-sdk.mjs       # esbuild: bundles sdk-entry.ts → public/kkoknote-widget-sdk.js
│
├── proxy.ts                        # Next.js middleware entry (re-exports from lib/supabase/proxy.ts)
└── public/
    └── kkoknote-widget-sdk.js     # Generated widget SDK (do not edit manually)
```

**Component separation rule:** UI + logic live together in the same component file (no separate container/presentational split). Shared state goes into Zustand stores.

---

## 5. Core Data Schema

### Tables

**`projects`**

```
id          uuid PK
user_id     uuid FK → auth.users
name        text
domain      text  -- exact Origin string (e.g. "https://customer.com") — used for RLS
theme_color text  -- hex color
created_at  timestamptz
updated_at  timestamptz
```

**`feedbacks`**

```
id              uuid PK
project_id      uuid FK → projects
content         text
status          feedback_status  -- enum: 'pending' | 'progress' | 'done'
upvotes         integer
user_identifier text  -- anonymous localStorage UUID for attribution
created_at      timestamptz
updated_at      timestamptz
```

**`updates`** (changelog entries, admin-created)

```
id          uuid PK
project_id  uuid FK → projects
title       text
content     text  -- Markdown
created_at  timestamptz
```

**`beta_registrations`**

```
id         uuid PK
email      text UNIQUE  -- lowercased before insert
created_at timestamptz
```

### Key RLS Rules

- Widget (anon) can INSERT/SELECT feedbacks only if `request.headers.origin` matches `projects.domain`
- Widget (anon) can UPDATE `upvotes` only — status changes require admin auth
- Admin (authenticated) scoped to their own `projects` via `user_id = auth.uid()`
- `beta_registrations`: anon INSERT allowed, authenticated SELECT only

### Key TypeScript Types

```typescript
// Shared status enum
type FeedbackStatus = "pending" | "progress" | "done";

// Widget store
type WidgetFeedback = {
  id: string;
  content: string;
  status: FeedbackStatus;
  upvotes: number;
};
type WidgetUpdate = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};
type IdentifiedUser = { id: string; email?: string | null };

// Admin store
type AdminFeedback = {
  id: string;
  project_id: string;
  content: string;
  status: FeedbackStatus;
  upvotes: number;
};

// Widget public API (window.KkokNote)
type InitArgs = { projectKey: string };
type IdentifyArgs = { id: string; email?: string };
```
