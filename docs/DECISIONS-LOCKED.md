# Phase 2 — Decisions Locked
## All 9 questions answered. No further decisions needed.

| # | Question | Decision | Impact |
|---|---|---|---|
| 1 | MapLibre migration | **Option A — migrate all** | Remove VITE_MAPBOX_TOKEN, add VITE_MAPTILER_KEY. All map components migrated in one session. |
| 2 | Agent approval flow | **Option A — pending_agent → admin approves** | profile.role = 'pending_agent' on signup. Admin panel "Approve" button flips to 'agent'. |
| 3 | Virtual tour format | **Option A — URL embed (iframe)** | Add virtual_tour_url TEXT to properties. Agent pastes YouTube/Matterport URL. |
| 4 | Price history source | **Option A + C** | Internal accumulation (real) + seeded fake history (dev/demo). |
| 5 | Recently viewed storage | **LocalStorage guests + DB sync on login** | localStorage always, POST /users/recently-viewed on mount if authenticated. |
| 6 | Offer management | **Simple (Option A)** | { propertyId, amount, message, name, email }. No counter-offer flow. |
| 7 | Agent reviews | **Keep out of scope** | No reviews table, no review UI in Phase 2. |
| 8 | Map tile provider | **MapTiler** | VITE_MAPTILER_KEY. Streets + Satellite styles. 100k loads/month free. |
