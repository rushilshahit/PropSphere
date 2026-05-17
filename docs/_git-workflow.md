# GIT WORKFLOW — Phase 2
# Paste this THIRD in every session (after shared context + phase block).
# Claude enforces this workflow automatically in every response.

---

## Branch Strategy

```
main        → production only. Never commit directly.
develop     → integration branch. PRs merge here. Staging deploys from here.
feature/*   → one branch per session or logical feature unit
fix/*       → bug fixes discovered during Phase 2
```

## Branch Naming by Session

| Session | Branch name |
|---|---|
| 2-A-1 DB migration | `feature/phase2-db-migration` |
| 2-A-2 MapLibre | `feature/maplibre-migration` |
| 2-A-3 Docs | `chore/phase2-docs-update` |
| 2-B-1 Suburb page | `feature/suburb-profile-wire` |
| 2-B-2 Dashboard | `feature/agent-dashboard-wire` |
| 2-B-3 Agent signup | `feature/agent-self-signup` |
| 2-C-1 Sold card+search | `feature/sold-search-page` |
| 2-C-2 Sold detail+price history | `feature/sold-detail-price-history` |
| 2-C-3 Property enhancements | `feature/property-floor-plan-tour-badges` |
| 2-C-4 User account | `feature/user-account-history-notes` |
| 2-D-1 Offers | `feature/offer-management` |
| 2-D-2 Agent+Agency profiles | `feature/agent-agency-profiles` |
| 2-D-3 Analytics+polish | `feature/agent-analytics-polish` |
| 2-D-4 Deploy | `chore/phase2-deploy-seed` |

---

## Commit Message Format (Conventional Commits)

```
<type>(<scope>): <description>

Types:  feat fix refactor test chore docs perf
Scopes: db map suburb dashboard agent-signup sold offers agent agency analytics
```

**Examples by session:**
```bash
# 2-A-1
git commit -m "chore(db): add phase2 migration 010 with price history and offers tables"
git commit -m "chore(db): add RLS policies for offers and recently_viewed tables"
git commit -m "chore(db): seed fake price history records for existing properties"

# 2-A-2
git commit -m "chore(map): swap mapbox-gl for maplibre-gl package"
git commit -m "feat(map): migrate all map components to MapLibre + MapTiler tiles"
git commit -m "chore(map): replace mapbox draw with maplibre-gl-draw"
git commit -m "chore(env): replace VITE_MAPBOX_TOKEN with VITE_MAPTILER_KEY"

# 2-B-1
git commit -m "feat(suburb): wire SuburbPage to real API data"
git commit -m "feat(suburb): add SuburbSoldInsights component"
git commit -m "feat(suburb): add GET /suburbs/:id/sold-stats endpoint"

# 2-B-3
git commit -m "feat(agent-signup): add /become-an-agent wizard (4 steps)"
git commit -m "feat(agent-signup): add POST /agents/apply backend endpoint"
git commit -m "feat(admin): add agent approval PATCH /admin/agents/:id/approve"

# 2-C-1
git commit -m "feat(sold): add sold variant to PropertyCard component"
git commit -m "feat(sold): build SoldSearchPage with date and method filters"
git commit -m "feat(sold): update GET /properties/search for sold-specific filters"

# 2-C-2
git commit -m "feat(sold): add SoldPricePanel to listing detail page"
git commit -m "feat(sold): add PriceHistoryChart component (Recharts)"
git commit -m "feat(sold): add GET /properties/:id/price-history endpoint"
git commit -m "feat(sold): auto-create price history record on status → sold"

# 2-D-1
git commit -m "feat(offers): add OfferModal component with quick amount chips"
git commit -m "feat(offers): add POST /offers backend endpoint"
git commit -m "feat(offers): add agent offer inbox at /dashboard/offers"
git commit -m "feat(offers): add buyer offer history at /account/offers"

# 2-D-2
git commit -m "feat(agent): wire full agent profile page at /agent/:slug"
git commit -m "feat(agency): build agency profile page at /agency/:slug"
git commit -m "feat(agency): add GET /agencies/:slug endpoint"
```

---

## Git Workflow Per Session

Claude follows this workflow for every session:

### 1. Start of session — branch creation

```bash
# Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/<branch-name>
```

### 2. During session — commit after each logical unit

Each commit = one file or one logical change.
Never bundle 5 files into one commit.
Never commit broken code (if file isn't finished, don't commit yet).

```bash
git add <specific-file>           # always stage specific files, not git add .
git commit -m "<type>(<scope>): <description>"
```

### 3. End of session — push + PR

```bash
git push origin feature/<branch-name>
# Then open PR: feature/<branch-name> → develop
```

---

## PR Description Template

Claude generates this at the end of every session:

```markdown
## What
[One sentence: what this PR does]

## Why
[Why this change is needed — links to PRD-phase2.md section]

## Changes
- `apps/web/src/...` — [what changed]
- `apps/api/src/...` — [what changed]
- `scripts/migrations/...` — [if applicable]

## Tests
- [x] Unit tests: `pnpm test --filter=<app>`
- [x] Type check: `pnpm typecheck`
- [x] Lint: `pnpm lint`
- [ ] E2E: `pnpm test:e2e` (Playwright)

## How to test manually
1. [Step one]
2. [Step two]
3. Expected: [what should happen]

## Checklist
- [ ] No `any` types introduced
- [ ] No FK constraints in migrations
- [ ] Tailwind only (no inline styles)
- [ ] task.md updated with [x] marks
- [ ] .env.example updated if new env vars added
```

---

## What Claude Outputs at Session End

At the end of every session, Claude prints:

```
## Git Summary

Branch: feature/<branch-name>

Commits made this session:
  feat(X): description  →  <file(s) changed>
  feat(X): description  →  <file(s) changed>
  ...

PR title: feat(scope): short description

Files changed:
  apps/web/src/...
  apps/api/src/...
  packages/types/src/...
  scripts/migrations/...   (if any)

Next: open PR from feature/<branch-name> → develop
```

---

## Merge Strategy

```
feature/* → develop   : squash merge (clean history)
develop   → main      : merge commit (preserves phase boundary)
```

Squash commit message format:
```
feat(phase2-X): <summary of all session work>

- list key changes
- from the PR description
```

---

## .gitignore additions for Phase 2

Add these if not already present:
```
# MapTiler (never commit real keys)
.env.local
*.local

# Playwright test artifacts
test-results/
playwright-report/
e2e/.auth/

# Coverage
coverage/

# MapLibre worker cache (generated at build)
apps/web/src/workers/
```
