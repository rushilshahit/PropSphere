# apps/web — Frontend Context

Read root `CLAUDE.md` first. This file extends it with frontend-specific context auto-loaded when working inside `apps/web/`.

---

## What This App Is

React 18 + Vite SPA. No SSR. Entry: `src/main.tsx`. Routes: `src/router.tsx` (all pages lazy-loaded via `React.lazy`).

---

## Key Paths

```
src/
├── api/              ← TanStack Query hooks (one file per domain, 14 files)
│   ├── properties.ts
│   ├── agents.ts
│   ├── collections.ts
│   └── ...
├── components/
│   └── ui/           ← Shared primitives (Badge, Button, Dropdown, Input, RangeSlider, Skeleton, Spinner, Tabs)
├── features/         ← Feature modules (see layout below) — 17 total
│   ├── home/
│   ├── search/
│   ├── listing/
│   ├── map/
│   ├── sold/
│   ├── suburb/
│   ├── collections/
│   ├── auth/
│   ├── agent/
│   ├── agency/
│   ├── agent-signup/
│   ├── owner-listing/
│   ├── offers/
│   ├── account/
│   ├── alerts/
│   ├── finance/
│   └── dashboard/
├── store/            ← Redux root store setup only
│   ├── index.ts
│   ├── rootReducer.ts
│   └── hooks.ts      ← typed useAppDispatch/useAppSelector
└── router.tsx        ← Route definitions
```

Feature-owned Redux slices (`searchSlice.ts`, `mapSlice.ts`, `authSlice.ts`, plus a collections slice) live inside each feature's own `store/` folder (e.g. `features/search/store/searchSlice.ts`), not in the root `src/store/` — only `auth`, `collections`, `map`, and `search` currently have one. See `docs/folder-structure.md` for the full per-feature breakdown, including which features are new since this file was last written (`account`, `agency`, `agent-signup`, `home`, `offers`, `owner-listing`, `sold`).

---

## Feature Module Layout

Every feature follows this exact structure — do not deviate:

```
features/{feature}/
├── components/     ← Feature-scoped React components (named exports)
├── hooks/          ← Custom hooks for this feature
├── pages/          ← Route components (default export, lazy-loaded)
├── store/          ← Redux slice (only if feature needs UI state)
├── types.ts        ← Feature-scoped TypeScript interfaces
└── index.ts        ← Named re-exports (public API for the feature)
```

---

## State Architecture

| State Type | Tool | Lives In | Examples |
|---|---|---|---|
| Server state | TanStack Query v5 | `src/api/` hooks | properties, agents, collections, suburb stats |
| UI state | Redux Toolkit | `src/store/*Slice.ts` | filters, map viewport, open modals, auth session |

**Non-negotiable rules:**
- Never put server response data in Redux
- Never put UI flags (isModalOpen, activeTab) in TanStack Query cache
- All API calls go through `src/api/` — never call `fetch`, `axios`, or Supabase directly from a component

---

## API Hook Pattern

```typescript
// src/api/properties.ts
export function usePropertySearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['properties', 'search', filters],
    queryFn: () => apiClient.get<PropertySummary[]>('/properties', { params: filters }),
    staleTime: 30_000,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => apiClient.get<PropertyDetail>(`/properties/${id}`),
    enabled: Boolean(id),
  });
}
```

---

## Component Pattern

```tsx
// Named export, props interface above component, no default export
interface PropertyCardProps {
  property: PropertySummary;
  compact?: boolean;
  onSave?: (id: string) => void;
}

export function PropertyCard({ property, compact = false, onSave }: PropertyCardProps) {
  const dispatch = useAppDispatch();

  function handleSaveClick(e: React.MouseEvent) {
    e.preventDefault();
    onSave?.(property.id);
  }

  return (
    <div className="rounded-card shadow-card bg-white p-4">
      {/* Tailwind only — no inline styles */}
    </div>
  );
}
```

---

## Hard Rules (Frontend)

- Zero `any` types
- No Supabase calls inside React — always use `src/api/` hooks
- Tailwind classes only — no inline styles, no CSS Modules
- Named exports on all files except page components and `main.tsx`
- No prop drilling beyond 2 levels — use context or Redux
- `key` prop uses stable IDs, never array index (unless list is static)
- Event handlers: `handleX`; prop names: `onX`
- No nested ternaries
- File max ~300 lines — extract logic to custom hook if mixing complex state + heavy JSX

---

## Design Tokens (Quick Reference)

| Token | Value | Tailwind Class |
|---|---|---|
| Primary (buy) | `#1A56DB` | `text-brand-primary`, `bg-brand-primary` |
| Secondary (rent) | `#0E9F6E` | `text-brand-secondary` |
| Accent (auction) | `#FF6B35` | `text-brand-accent` |
| Card radius | 12px | `rounded-card` |
| Button radius | 8px | `rounded-btn` |
| Card shadow | — | `shadow-card` / `shadow-card-hover` |

Full design system: `docs/figma-prompt.md`

---

## Relevant Docs

| Doc | Read When |
|---|---|
| `docs/figma-prompt.md` | Building any UI component |
| `docs/frontend-prompt.md` | Architecture patterns and code examples |
| `docs/coding-standards.md` | TypeScript and React code rules |
| `docs/naming-conventions.md` | File, variable, and hook naming |
| `docs/folder-structure.md` | Where to place new files |
