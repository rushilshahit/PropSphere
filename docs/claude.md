# PropSphere — Project Context

## Project Identity
- **Name:** PropSphere
- **Type:** Full-stack real estate marketplace (realestate.com.au clone)
- **Stage:** Greenfield build
- **Seed market:** Ahmedabad / India (dev seed data)

## Tech Stack

| Layer | Technology | Decision |
|---|---|---|
| Frontend | React 18 + TypeScript strict + Vite | Confirmed |
| State — server | TanStack Query v5 | Server state, caching, mutations |
| State — UI | Redux Toolkit | Filters, map viewport, modals |
| Styling | Tailwind CSS v3 | Utility-first only |
| Maps | Mapbox GL JS + react-map-gl | Confirmed |
| Search | Postgres Full-Text Search (tsvector + GIN) | Replaces Typesense |
| Backend | NestJS (Node.js) | Structured, DI, decorator-based |
| Database | PostgreSQL via Supabase | Managed Postgres, Auth, Storage, RLS |
| Auth | Supabase Auth (email + Google OAuth) | Confirmed |
| File Storage | Supabase Storage + image transforms | Built-in WebP/resize |
| Email | Resend | Transactional notifications |
| Push | Firebase FCM | Alert notifications |
| Queue | BullMQ + Redis | Alert dispatch, cron jobs |
| Analytics | PostHog | Self-hosted or cloud free tier |
| Monorepo | Turborepo + pnpm | Confirmed |
| Deploy | Vercel (web) + Railway (api) | |

## Architecture Decisions (Locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Frontend framework | Vite SPA (no SSR) |
| 2 | Search engine | Postgres FTS |
| 3 | Monorepo | Turborepo |
| 4 | UI state | Redux RTK |
| 5 | Property valuation | Sold history only |
| 6 | Rental application | Enquiry form only |
| 7 | Maps | Mapbox |
| 8 | Auth | Supabase Auth |
| 9 | Image optimisation | Supabase Storage transforms |
| 10 | Analytics | PostHog |

## Skipped (Not in Scope)
- Off-the-plan / project listings
- Agent subscription / boost / billing
- Agent reviews and ratings
- NABERS / sustainability ratings
- Inspection RSVP (calendar export only)
- Commercial listings (deferred)

## Monorepo Structure
```
propsphere/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utilities
│   └── config/       # Zod schemas, constants
├── .claude/
├── docs/
└── scripts/          # Migrations, seed scripts
```

## Reference Files
- `docs/PRD.md` — product requirements
- `docs/database-schema.md` — PostgreSQL schema (3NF, no FK constraints)
- `docs/folder-structure.md` — full directory tree
- `docs/DISCUSSION.md` — decisions log
- `.claude/skills.md` — Claude capabilities
- `.claude/design.md` — design system
- `.claude/task.md` — task queue
- `.claude/coding-standards.md` — code rules
- `.claude/naming-conventions.md` — naming rules
- `.claude/git-standards.md` — branch and commit rules

## Token Usage Rule

**If context window usage exceeds 85%, stop the current task immediately.**

At that point:
1. Write a `## Session Summary` block listing every file created/edited
2. Write a `## Resume From` block with the exact next task to pick up
3. End the response — do not continue into new code
4. The next session starts fresh using the phase prompt + resume note

This prevents truncated files, half-written components, and silent failures from context overflow.
