# Skills
## What Claude Can Do in This Codebase

This file tells Claude what it is capable of doing in the PropSphere repo. Read this before starting any task.

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
6. Note if Typesense schema needs updating

**Example trigger:** "Add a `virtual_tour_url` column to properties"

---

## Skill: Add Typesense Field

When search needs a new filterable field:

1. Update the Typesense collection schema in `apps/api/src/modules/properties/properties.search.service.ts`
2. Update the filter-building logic (`buildFilters`)
3. Update the sync mapper (`mapPropertyToTypesenseDoc`)
4. Update the frontend DTO type in `packages/types`
5. Update the Redux `SearchFilters` interface
6. Note: existing documents need a re-index script

---

## Skill: Create Shared Type

When a type is needed in both frontend and backend:

1. Add it to the correct file in `packages/types/src/`
2. Export from `packages/types/src/index.ts`
3. Both `apps/web` and `apps/api` import from `@propsphere/types`
4. Never duplicate type definitions across apps

---

## Skill: Add Finance Calculator

When adding a new calculator (client-side only):

1. Implement the pure calculation function in `packages/utils/src/`
2. Write a unit test for the function
3. Build the React component in `features/finance/components/`
4. No API call — all client-side

---

## Skill: Add BullMQ Job

When adding a background job:

1. Define the job type in `common/types/`
2. Add the producer call in the relevant service
3. Create the processor in `jobs/` or within the module's `*.processor.ts`
4. Register in the module with `BullModule.registerQueue`
5. Handle failure gracefully — log, don't throw to the queue without retry config

---

## Skill: Write Email Template

When a new transactional email is needed:

1. Add the send method to `ResendService`
2. Use React Email template components or plain HTML
3. Test with Resend's preview endpoint
4. Keep email templates in `apps/api/src/modules/notifications/templates/`

---

## Skill: Add Map Layer

When adding a new Mapbox map layer:

1. Read Mapbox GL JS layer docs for the correct layer type
2. Add the layer toggle to the Redux `mapSlice`
3. Add the `LayerToggles` component option
4. Source data: use GeoJSON endpoint from backend or public API
5. Style with Mapbox expressions — not hardcoded colours

---

## What Claude Should NOT Do

- Do not install new npm packages without noting it explicitly in the response
- Do not change the Supabase schema without creating a migration file
- Do not add `any` types
- Do not add error handling beyond what the existing pattern uses
- Do not refactor code outside the scope of the current task
- Do not create new abstraction layers unless the task explicitly requires it
- Do not use CSS Modules or styled-components — Tailwind only
- Do not call Supabase directly from React components — use the `api/` layer
