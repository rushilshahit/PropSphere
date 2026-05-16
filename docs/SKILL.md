# Skills — v2
## What Claude Can Do in This Codebase

This file tells Claude what it is capable of doing in the PropSphere repo. Read this before starting any task.

> **v2 changes from v1:** Removed "Add Typesense Field" (project uses Postgres FTS, not Typesense).
> Replaced with "Add Postgres FTS Filter". Fixed migration skill to remove Typesense reference.

---

## Skill: Create NestJS Module

When asked to add a new backend feature/module:

1. Read `docs/folder-structure.md` for the correct file placement
2. Scaffold: `module.ts`, `controller.ts`, `service.ts`, `dto/`
3. Register the module in `app.module.ts`
4. Use `SupabaseService` from `database/` — never instantiate Supabase directly
5. Use `ZodValidationPipe` for all DTOs
6. Apply `@UseGuards(AuthGuard)` to protected routes
7. Return typed responses — never return raw Supabase data shapes unless they match shared types
8. Write a unit test for the service

**Example trigger:** "Add a reviews endpoint for agents"

---

## Skill: Create React Feature

When asked to add a new frontend feature:

1. Read `docs/folder-structure.md` — determine if it belongs in `features/` or `components/`
2. Create the feature folder: `components/`, `hooks/`, `pages/`, `types.ts`, `index.ts`
3. API calls go in `apps/web/src/api/` as TanStack Query hooks
4. Local UI state goes in a Redux slice in `store/`
5. All forms use `react-hook-form` + Zod
6. Tailwind only for styles — no inline styles, no CSS modules
7. Export from `index.ts`

**Example trigger:** "Build the agent review submission form"

---

## Skill: Write Database Migration

When schema changes are needed:

1. Read `docs/database-schema.md` for existing schema context
2. Write a SQL migration file in `scripts/migrations/`
3. Name it: `YYYYMMDD_HHMMSS_description.sql`
4. Include up migration and comment a down migration
5. Note any RLS policy updates needed
6. **Do not add FK constraints** — this project deliberately omits them

**Example trigger:** "Add a `virtual_tour_url` column to properties"

---

## Skill: Add Postgres FTS Filter

When search needs a new filterable field using Postgres Full-Text Search:

1. Check `docs/database-schema.md` — verify the column exists or add a migration for it
2. Update the `search_vector` tsvector trigger in the migration to include the new field (if it should be searchable)
3. Update the filter-building logic in `apps/api/src/modules/properties/properties.service.ts`
4. Update the `SearchFilters` interface in `packages/types/src/search.ts`
5. Update the Redux `searchSlice` if the filter needs UI state
6. Add the filter control to `features/search/components/FilterPanel.tsx`

**Note:** PropSphere uses Postgres FTS (`tsvector` + GIN index) — there is no Typesense client or schema in this project.

**Example trigger:** "Add a pool filter to property search"

---

## Skill: Create Shared Type

When a type is needed in both frontend and backend:

1. Add it to the correct file in `packages/types/src/`
2. Export from `packages/types/src/index.ts`
3. Both `apps/web` and `apps/api` import from `@propsphere/types`
4. Never duplicate type definitions across apps

**Example trigger:** "Add a `PropertyComparison` type"

---

## Skill: Add Finance Calculator

When adding a new calculator (client-side only):

1. Implement the pure calculation function in `packages/utils/src/`
2. Write a unit test for the function
3. Build the React component in `features/finance/components/`
4. No API call — all client-side math

**Example trigger:** "Add a rent-to-buy comparison calculator"

---

## Skill: Add BullMQ Job

When adding a background job:

1. Define the job type in `common/types/`
2. Add the producer call in the relevant service
3. Create the processor in `jobs/` or within the module's `*.processor.ts`
4. Register in the module with `BullModule.registerQueue`
5. Handle failure gracefully — log with context, configure retry, don't rethrow to the queue without retry config

**Example trigger:** "Send a weekly digest email to users with saved searches"

---

## Skill: Write Email Template

When a new transactional email is needed:

1. Add the send method to `ResendService`
2. Use React Email template components or plain HTML
3. Test with Resend's preview endpoint
4. Keep email templates in `apps/api/src/modules/notifications/templates/`

**Example trigger:** "Send a price-drop notification email"

---

## Skill: Add Map Layer

When adding a new Mapbox map layer:

1. Read Mapbox GL JS layer docs for the correct layer type
2. Add the layer toggle to the Redux `mapSlice`
3. Add the `LayerToggles` component option
4. Source data: use GeoJSON endpoint from backend or public API
5. Style with Mapbox expressions — not hardcoded colours

**Example trigger:** "Add a school locations overlay to the map"

---

## What Claude Should NOT Do

- Install new npm packages without noting it explicitly in the response
- Change the Supabase schema without creating a migration file
- Add `any` types
- Add error handling beyond what the existing pattern uses
- Refactor code outside the scope of the current task
- Create new abstraction layers unless the task explicitly requires it
- Use CSS Modules or styled-components — Tailwind only
- Call Supabase directly from React components — use the `api/` layer
- Add FK constraints to any Postgres migration
- Reference Typesense — the project uses Postgres FTS
