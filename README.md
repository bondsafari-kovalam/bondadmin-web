# Bond Central Admin

Central admin dashboard for the Bond Group (Next.js App Router, Tailwind v4, shadcn/Base UI, Recharts).
All figures are **demo data** until the backend is connected.

```bash
npm run dev      # http://localhost:3000
npm run build    # type-checks and builds
```

## Folder structure

```
app/                         Routes only. Each page.tsx composes components; no reusable UI lives here.
  layout.tsx                 Root HTML, fonts, global CSS
  (admin)/layout.tsx         Wraps every admin page in <AdminShell> (sidebar + header + providers)
  (admin)/page.tsx           /                 Overview
  (admin)/companies/page.tsx /companies        Companies list
  (admin)/companies/[id]/    /companies/:id    Company details — layout.tsx holds the header, tabs
                             and access check; one page per tab:
                             page.tsx (Overview), activities/, courses/, bookings/, team/, settings/

components/
  ui/                        shadcn primitives (Button, Card, Select, Dialog…). Don't put app logic here.
  layout/                    App shell: admin-shell, sidebar, mobile-nav, top-bar, nav-items
  providers/                 React context: demo role/state, in-session companies and catalog stores
  shared/                    Reusable across pages: PageHeader, SectionCard, KpiCard/KpiGrid,
                             FilterSelect, SearchInput, SegmentedControl, FormSelect, Field,
                             EmptyState, NoticeBanner, StatusMessage, ConfirmDialog, StatusBadge, ActivityFeed
  charts/                    Chart components (trend, status donut, revenue by company)
  overview/                  Widgets used only on the Overview
  companies/                 Widgets used only on the Companies pages
  catalog/                   Activities & courses: CatalogManager, ActivityForm/CourseForm,
                             ActivityTable/CourseTable, preview dialog

hooks/                       Data hooks (useDemoResult, useDashboardData)
lib/                         Logic with no UI
  dashboard.ts               Overview figures: getDashboardData, periods
  companies.ts               Company metrics, search / filter / sort
  catalog.ts                 Activity & course create / update / delete / publish — every write is
                             scoped by companyId — plus search and filters
  permissions.ts             Mock role config (UI only — not security)
  format.ts                  ₹, number, date formatting
  validation/                Form validation
  mock/                      Demo data only — replace with API calls later
types/                       Shared TypeScript types
```

## Adding a new page

1. Create `app/(admin)/<route>/page.tsx` — it gets the sidebar and header automatically.
2. Put its widgets in `components/<feature>/`; promote anything a second page needs to `components/shared/`.
3. Keep calculations in `lib/<feature>.ts` and types in `types/<feature>.ts`.
4. Give the nav item an `href` in `components/layout/nav-items.ts`.
