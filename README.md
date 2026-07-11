# FixPro Admin Dashboard

Next.js 14 + Tailwind CSS admin panel for the FixPro service marketplace backend.

## Quick Start

```bash
cd admin-dashboard
npm install
cp .env.local.example .env.local   # edit NEXT_PUBLIC_API_URL
npm run dev                          # runs on http://localhost:3000
```

The backend must be running (default `http://localhost:3001`).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Backend REST API base URL |

## Pages

| Route | Status | Backend endpoints used |
|---|---|---|
| `/login` | ✅ Fully wired | `POST /api/auth/login` |
| `/dashboard` | ✅ Fully wired | `GET /api/admin/stats` |
| `/dashboard/utilisateurs` | ✅ Fully wired | `GET /api/admin/users`, `GET /api/admin/users/stats`, `PATCH /api/admin/users/:id/approve`, `PATCH /api/admin/users/:id/reject` |
| `/dashboard/techniciens` | ✅ Fully wired | Same as utilisateurs, filtered to role=WORKER |
| `/dashboard/reservations` | ✅ Fully wired | `GET /api/admin/reservations` |
| `/dashboard/avis` | ✅ Fully wired | `GET /api/admin/reviews` |
| `/dashboard/notifications` | ✅ Fully wired | `GET /api/admin/notifications` |
| `/dashboard/categories` | ✅ Fully wired | `GET /api/admin/services` |
| `/dashboard/paiements` | 🚧 Stub | Requires a payment system (Stripe/Flouci) — no backend model yet |
| `/dashboard/abonnements` | 🚧 Stub | Requires a `Subscription` model in Prisma |
| `/dashboard/messages` | 🚧 Stub | `Message` model exists; needs `GET /api/admin/messages` endpoint |
| `/dashboard/zones` | 🚧 Stub | Data is in `Worker.serviceArea`; needs map integration |
| `/dashboard/parametres` | ✅ Config | Shows API URL, health link |

## Backend Changes Made

All changes are in `FixPRO_Backend/`:

### New files
- `controllers/adminController.js` — all admin query/action logic
- `routes/admin.js` — admin-only route definitions

### Modified files
- `server.js` — registered `GET /api/admin/*` routes (protected by JWT + `role=ADMIN`)

### Existing approval workflow (already in place before this PR)
- New `WORKER` registrations → `accountStatus = PENDING_APPROVAL`
- Login blocked if `PENDING_APPROVAL` or `REJECTED`
- `protect` middleware blocks API calls from pending/rejected workers

### Admin API reference

```
GET    /api/admin/stats                    # Dashboard overview
GET    /api/admin/users/stats              # User stat cards (totals + monthly deltas)
GET    /api/admin/users?role=&status=&search=&page=&limit=
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id/approve        # Set accountStatus = APPROVED
PATCH  /api/admin/users/:id/reject         # Set accountStatus = REJECTED
PATCH  /api/admin/users/:id/status         # Set accountStatus to any valid value
GET    /api/admin/reservations?status=&page=
GET    /api/admin/reviews?page=
GET    /api/admin/notifications?page=
GET    /api/admin/services?category=&page=
```

All endpoints require `Authorization: Bearer <admin-jwt>`.

## Architecture

```
admin-dashboard/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # All authenticated pages share sidebar layout
│   │   │   ├── layout.tsx        # Auth guard + Sidebar
│   │   │   ├── page.tsx          # Tableau de bord
│   │   │   ├── utilisateurs/
│   │   │   ├── techniciens/
│   │   │   ├── reservations/
│   │   │   ├── avis/
│   │   │   ├── notifications/
│   │   │   ├── categories/
│   │   │   └── ...               # Stub pages
│   │   └── login/
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   ├── layout/TopBar.tsx
│   │   └── ui/StubPage.tsx
│   ├── lib/api.ts                 # Typed fetch wrapper + token management
│   └── types/index.ts             # Shared TypeScript types
```

## Auth Flow

1. Admin logs in via `/login` → `POST /api/auth/login`
2. Backend checks `role === 'ADMIN'`; login page additionally enforces this client-side
3. JWT stored in `localStorage` as `fixpro_admin_token`
4. Dashboard layout reads the token on mount; redirects to `/login` if missing
5. Every API call passes `Authorization: Bearer <token>`; 401 responses auto-redirect to `/login`
