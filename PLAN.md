# LetsLive Admin Dashboard — Project Plan

## Overview
A standalone Next.js admin dashboard for LetsLive Tours internal team. Connects to the existing `letslive-engine` backend API. Features role-based access control (RBAC) with 4 authority levels.

---

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand (auth store)
- **API**: Fetch with credentials (same `letslive-engine` backend on port 5000)
- **Auth**: JWT via HTTP-only cookies (existing backend auth system)

---

## Role Hierarchy & Permissions

| Feature | Admin | Manager | Staff | Guest (Read-only) |
|---------|-------|---------|-------|--------------------|
| **Dashboard stats** | ✅ Full | ✅ Full | ✅ Limited | ✅ View only |
| **Users** | CRUD + role change | View + edit | View only | ❌ |
| **Destinations** | CRUD | CRUD | View + edit | View only |
| **Packages** | CRUD | CRUD | CRUD | View only |
| **Bookings** | CRUD + status | View + status update | View + status update | View only |
| **Reviews** | CRUD + approve/reject | Approve/reject | View only | View only |
| **Enquiries** | CRUD + assign | View + respond | View + respond | View only |
| **Careers** | CRUD | CRUD | View only | View only |
| **Newsletter** | View + export | View | ❌ | ❌ |
| **Settings** | ✅ Full | ❌ | ❌ | ❌ |
| **Activity Logs** | ✅ Full | View own | View own | ❌ |
| **Staff Management** | Create/edit/delete staff | ❌ | ❌ | ❌ |

### Role Definitions
- **Admin**: Full system access. Can manage staff accounts, change roles, access settings, view all logs.
- **Manager**: Can manage content (destinations, packages, careers) and handle bookings/enquiries. Cannot manage users or settings.
- **Staff**: Day-to-day operations — process bookings, respond to enquiries, manage packages. Cannot delete content or manage users.
- **Guest**: Read-only access to view data. Useful for stakeholders or new hires in training.

---

## Pages & Routes

```
/login                          — Admin login page
/                               — Dashboard overview (stats, charts, recent activity)
/bookings                       — Bookings list with filters, search, status updates
/bookings/[id]                  — Booking detail + status management
/destinations                   — Destinations table with CRUD
/destinations/new               — Create destination form
/destinations/[id]/edit         — Edit destination form
/packages                       — Packages table with CRUD
/packages/new                   — Create package form
/packages/[id]/edit             — Edit package form
/users                          — Users table (customers)
/users/[id]                     — User detail (bookings, reviews, activity)
/staff                          — Staff/team management (admin only)
/staff/new                      — Invite/create staff member
/reviews                        — Reviews moderation (approve/reject/delete)
/enquiries                      — Enquiries list with status + response
/enquiries/[id]                 — Enquiry detail + reply
/careers                        — Job listings management
/careers/new                    — Create job listing
/careers/[id]/edit              — Edit job listing
/careers/[id]/applications      — View applications for a job
/newsletter                     — Subscriber list + export
/settings                       — System settings (admin only)
/activity                       — Activity/audit logs
```

---

## UI Layout

### Sidebar (collapsible)
- Logo
- Navigation grouped by section:
  - **Overview**: Dashboard
  - **Operations**: Bookings, Enquiries
  - **Content**: Destinations, Packages, Careers
  - **Community**: Reviews, Newsletter
  - **Team**: Users, Staff (admin only)
  - **System**: Settings (admin only), Activity Logs
- User avatar + role badge at bottom
- Collapse toggle

### Top Bar
- Breadcrumbs
- Search (global)
- Notifications bell
- Quick actions dropdown
- User menu (profile, logout)

### Design System
- Dark sidebar (#0f172a) with light content area (#f8fafc)
- Accent: Teal (#0891b2) matching the main site
- Cards with subtle shadows, rounded corners
- Data tables with sorting, filtering, pagination
- Toast notifications for actions
- Confirmation modals for destructive actions

---

## Backend Changes Required (letslive-engine)

### New/Updated User Roles
Current: `user`, `admin`
New: `user`, `staff`, `manager`, `admin`, `guest`

### New Endpoints Needed
- `GET /api/admin/stats` — Dashboard statistics (bookings count, revenue, users, etc.)
- `GET /api/admin/activity` — Activity/audit logs
- `POST /api/admin/staff` — Create staff account (admin only)
- `PUT /api/admin/staff/:id/role` — Change staff role (admin only)
- `GET /api/newsletter/subscribers` — List all subscribers with pagination
- `GET /api/newsletter/export` — Export subscribers as CSV
- `PUT /api/enquiries/:id/respond` — Staff response to enquiry
- `GET /api/bookings/stats` — Booking statistics (by status, revenue over time)

### Middleware Updates
- Update `adminOnly` middleware → `roleCheck(['admin', 'manager', 'staff'])` with granular permissions
- Add activity logging middleware for audit trail

---

## Implementation Phases

### Phase 1: Project Setup & Auth
- Initialize Next.js project with Tailwind
- Login page with role-based redirect
- Auth context/store (Zustand)
- Protected layout with sidebar + topbar
- Role-based route guards

### Phase 2: Dashboard Overview
- Stats cards (total bookings, revenue, users, packages)
- Revenue chart (line/bar)
- Recent bookings table
- Recent enquiries
- Quick action buttons

### Phase 3: Bookings Management
- Bookings table with filters (status, date range, destination)
- Booking detail page
- Status update flow (pending → confirmed → completed / cancelled)
- Bulk actions

### Phase 4: Content Management (Destinations + Packages)
- Destinations CRUD with image upload fields
- Packages CRUD with itinerary builder
- Rich form with tabs (basic info, media, itinerary, pricing)
- Featured toggle, active/inactive toggle

### Phase 5: Users & Staff
- Customer list with search/filter
- User detail (their bookings, reviews)
- Staff management (admin only) — invite, role change, deactivate
- Role badges and permission indicators

### Phase 6: Reviews & Enquiries
- Reviews moderation queue (pending approval)
- Approve/reject with one click
- Enquiries inbox with status (new, in-progress, resolved)
- Reply to enquiry (sends email)

### Phase 7: Careers & Newsletter
- Job listings CRUD
- Applications viewer per job
- Newsletter subscriber list with export to CSV

### Phase 8: Settings & Activity Logs
- System settings (site name, email config, etc.)
- Activity/audit log viewer with filters
- Role permission matrix display

---

## File Structure

```
letslive-admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              — Sidebar + Topbar wrapper
│   │   │   ├── page.tsx                — Dashboard overview
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── destinations/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── packages/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── staff/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── enquiries/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── careers/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   ├── [id]/edit/page.tsx
│   │   │   │   └── [id]/applications/page.tsx
│   │   │   ├── newsletter/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── activity/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Spinner.tsx
│   │   ├── charts/
│   │   │   ├── RevenueChart.tsx
│   │   │   └── BookingsChart.tsx
│   │   └── guards/
│   │       └── RoleGuard.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── usePermission.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── permissions.ts
│   │   └── utils.ts
│   ├── stores/
│   │   └── authStore.ts
│   └── types/
│       └── index.ts
├── public/
├── .env
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── package.json
```

---

## Design Tokens

```
Colors:
  - Sidebar BG: #0f172a (slate-900)
  - Sidebar Active: #0891b2 (cyan-600)
  - Content BG: #f8fafc (slate-50)
  - Card BG: #ffffff
  - Primary: #0891b2 (cyan-600)
  - Success: #10b981 (emerald-500)
  - Warning: #f59e0b (amber-500)
  - Danger: #ef4444 (red-500)
  - Text Primary: #0f172a (slate-900)
  - Text Secondary: #64748b (slate-500)
  - Border: #e2e8f0 (slate-200)

Typography:
  - Headings: Inter (700)
  - Body: Inter (400/500)
  - Mono: JetBrains Mono (for IDs, codes)

Spacing:
  - Sidebar width: 260px (collapsed: 72px)
  - Topbar height: 64px
  - Content padding: 24px
  - Card padding: 20px
  - Border radius: 12px (cards), 8px (inputs), 6px (badges)
```
