# Phase 4 Prompt — Auth + Collections
# Paste _shared-context.md above this, then use this section.
# Prerequisite: Phase 1–2 complete. PropertyCard and ListingPage exist.

---

## Phase Goal
Full auth flow (email + Google). Users can save properties to collections, view their collections, and compare up to 4 properties side-by-side.

---

## Session 4-A — Auth Provider + Redux

### Task
Supabase Auth integration and auth state in Redux.

**`apps/web/src/features/auth/store/authSlice.ts`**
```typescript
interface AuthState {
  user: Profile | null
  session: Session | null   // from @supabase/supabase-js
  loading: boolean
  initialized: boolean
}
```
- Actions: `setUser`, `setSession`, `setLoading`, `setInitialized`
- Selectors: `selectUser`, `selectIsAuthenticated`, `selectUserRole`, `selectIsAgent`

**`apps/web/src/features/auth/hooks/useAuth.ts`**
- Returns: `{ user, session, isAuthenticated, isAgent, loading, signOut }`
- `signOut`: calls `supabase.auth.signOut()`, dispatches `setUser(null)` + `setSession(null)`

**`apps/web/src/components/providers/AuthProvider.tsx`** (replace stub from Phase 0)
- On mount: `supabase.auth.getSession()` → dispatch to Redux
- `supabase.auth.onAuthStateChange` listener → dispatch on every change
- Syncs profile from `profiles` table on login (fetch by `user.id`)

**`apps/web/src/components/layout/Header.tsx`** — update:
- Not logged in: "Sign in" button → opens LoginModal
- Logged in: avatar + dropdown (My Saved, Alerts, Account, Sign out)
- Agent logged in: add "Dashboard" link

### End state check
Open app. Not authenticated → "Sign in" button. Sign in → header shows avatar.

---

## Session 4-B — Auth Forms + Modals

### Task
Login and register modals with Google OAuth.

**`apps/web/src/features/auth/components/AuthModal.tsx`**
- Props: `mode: 'login' | 'register'`, `isOpen: boolean`, `onClose: () => void`
- Toggle between login/register inline (no route change)
- Structure:
  1. "Continue with Google" button (Google icon + brand colours)
  2. Divider "or"
  3. Email input
  4. Password input
  5. (Register only) Full name input + role selector (Buyer / Renter / Seller / Agent — Dropdown)
  6. Submit button
  7. Toggle: "Already have an account? Sign in" / "Don't have an account? Sign up"

**Login logic:**
- `supabase.auth.signInWithPassword({ email, password })`
- On error: show message below form

**Register logic:**
- `supabase.auth.signUp({ email, password, options: { data: { full_name, role } } })`
- After signup: insert into `profiles` table (triggered via Supabase `on auth.users insert` trigger ideally, or manually)
- On success: close modal, toast "Welcome to PropSphere!"

**Google OAuth:**
- `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
- Redirect callback: already handled by `onAuthStateChange` in AuthProvider

**`apps/web/src/components/layout/ProtectedRoute.tsx`**
- Props: `children: ReactNode`, `roles?: UserRole[]`
- If not authenticated + `initialized`: redirect to `/` with modal trigger
- If wrong role: redirect to `/`
- While `!initialized`: show full-page spinner

### End state check
Register with email → redirected, profile row created. Google OAuth flow completes. Protected route blocks unauthenticated access.

---

## Session 4-C — Save Button + Collections State

### Task
Replace the stub `useSaveProperty` with the real implementation and build collection state.

**`packages/types/src/collection.ts`**
```typescript
interface Collection { id, userId, name, isDefault, shareToken, createdAt }
interface CollectionProperty { id, collectionId, propertyId, notes?, addedAt }
interface CollectionWithProperties extends Collection {
  properties: PropertySummary[]
}
```

**`apps/web/src/features/collections/store/collectionsSlice.ts`**
```typescript
interface CollectionsState {
  savedPropertyIds: Set<string>   // fast O(1) isSaved check
  comparePropertyIds: string[]    // max 4
  isCompareDrawerOpen: boolean
}
```
- Actions: `addSavedId`, `removeSavedId`, `setSavedIds`, `addToCompare`, `removeFromCompare`, `toggleCompareDrawer`
- Selectors: `selectIsSaved(id)`, `selectCompareIds`, `selectIsCompareDrawerOpen`
- On auth load: populate `savedPropertyIds` by fetching all saved collection property IDs

**`apps/web/src/api/collections.ts`**
- `useCollections()` — user's collections list
- `useCollectionProperties(collectionId)` — properties in a collection
- `useSaveProperty()` — mutation: `POST /collections/:id/properties`
- `useUnsaveProperty()` — mutation: `DELETE /collections/:id/properties/:propertyId`
- `useCreateCollection()` — mutation: `POST /collections`

**`apps/web/src/features/collections/hooks/useSaveProperty.ts`** (replace stub)
- Returns `{ isSaved: boolean, toggle: () => void }`
- Reads from `selectIsSaved(id)` (instant, no loading)
- `toggle`: if saved → unsave (dispatch + mutation), if not → open SaveModal

**`apps/web/src/features/collections/components/SaveModal.tsx`**
- Props: `propertyId: string`, `isOpen: boolean`, `onClose: () => void`
- Shows user's collections as radio buttons
- "+ Create new collection" inline input
- On confirm: call `useSaveProperty` mutation, dispatch `addSavedId`

### End state check
Heart icon on PropertyCard is functional. Click → SaveModal opens. Select collection → property saved. Heart fills.

---

## Session 4-D — Collections Page + Compare Drawer

### Task
Collections management page and the compare feature.

**`apps/web/src/features/collections/pages/CollectionsPage.tsx`**
- Route: `/account/saved`
- Left sidebar (w-56): list of collections with property count badge. "+ New collection" at bottom.
- Main area: grid of PropertyCards for selected collection
- Each card has a checkbox for compare mode + remove from collection button (X top-right)
- Share button on collection header: copies `${window.location.origin}/collections/shared/${shareToken}`
- Empty state: "No saved properties yet. Start browsing and save homes you love."

**`apps/web/src/features/collections/components/CompareDrawer.tsx`**
- Fixed bottom panel, slides up when `isCompareDrawerOpen = true`
- Trigger: floating "Compare (N)" button bottom-right, only visible when `comparePropertyIds.length >= 2`
- Panel height: 60vh, scrollable
- Content: table comparing up to 4 properties
  - Rows: Price · Bedrooms · Bathrooms · Car spaces · Land size · Suburb · Days on market
  - Column per property: image + address header, stat values below
- "Remove" X on each column header
- "Close" button

**Backend: `CollectionsModule`**
- `collections.module.ts`, `collections.controller.ts`, `collections.service.ts`
- All routes require `@UseGuards(AuthGuard)`:
  - `GET /collections` — user's collections
  - `POST /collections` — create, body: `{ name }`
  - `DELETE /collections/:id`
  - `GET /collections/:id/properties` — properties in collection
  - `POST /collections/:id/properties` — body: `{ propertyId, notes? }`
  - `DELETE /collections/:id/properties/:propertyId`
  - `GET /collections/shared/:token` — public endpoint (no auth)

### End state check
Collections page shows saved properties. Compare drawer slides up. 4-column compare table renders.

---

## Phase 4 Checklist
```
[x] authSlice (user, session, loading, initialized)
[x] useAuth hook
[x] AuthProvider (Supabase listener → Redux)
[x] AuthModal (login + register + Google OAuth)
[x] ProtectedRoute
[x] Header auth state (sign in / avatar dropdown)
[x] collectionsSlice (savedPropertyIds, compareIds, drawerOpen)
[x] useCollections API hook
[x] useSaveProperty hook (real implementation)
[x] SaveModal (pick collection, create new)
[x] CollectionsPage (sidebar + grid + share)
[x] CompareDrawer (slide-up, 4-column table)
[x] CollectionsModule: all CRUD endpoints
[x] GET /collections/shared/:token (public)
```
