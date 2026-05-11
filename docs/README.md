# Prompts — How to Use

## Files in this directory

```
_shared-context.md           ← paste at top of EVERY session
phase-0-setup.md             ← monorepo, DB, seed (4 sessions)
phase-home.md                ← homepage (5 sessions) — run after Phase 0
phase-1-search.md            ← search page (5 sessions)
phase-2-listing.md           ← listing detail (5 sessions)
phase-3-map.md               ← map view (4 sessions)
phase-4-auth-collections.md  ← auth + save/collections (4 sessions)
phase-5-to-10.md             ← alerts, suburb, finance, dashboard, polish, deploy
```

---

## How to Start a Session

**Every session = two pastes:**

```
1. Open _shared-context.md → copy all
2. Open the phase file for your current phase → copy only the session you're on
3. Paste both into a new Claude chat (shared context FIRST, then phase section)
4. Add one line at the bottom: "Start with [specific task name]"
```

**Example:**
```
[contents of _shared-context.md]

---

[contents of Phase 1, Session 1-B only]

---

Start with: Build the Button component first, then Input, then Badge.
```

---

## One Session Per Session Block

Each `## Session X-Y` block is one Claude session.
Do NOT paste multiple session blocks at once.

If a session block has 5 tasks, Claude does all 5 in one session.
If context hits 85%, Claude stops, summarises, and you start a new session
pasting only what's left.

---

## Tracking Progress

Update `../.claude/task.md` after each session. Mark completed tasks `[x]`.

When resuming after a 85% cutoff, add this at the bottom of your paste:
```
## Resume From
Last completed: [task name]
Next task: [task name]
```

---

## Session Length Guide

| Phase | Sessions | Approx tasks each |
|---|---|---|
| 0-A Monorepo | 1 | Types + packages |
| 0-B Frontend scaffold | 1 | Vite + shell |
| 0-C Backend + DB | 1 | NestJS + migrations + seed |
| 0-D CI | 1 | Lint + CI |
| HOME-A Hero | 1 | SearchWidget + chips |
| HOME-B Market + Recent | 1 | Stats + carousel + backend |
| HOME-C Suburb Explorer | 1 | Suburb cards + backend |
| HOME-D Featured + How | 1 | Featured carousel + 3-step |
| HOME-E Finance + Footer | 1 | CTA + news + footer |
| 1-A Types + Redux | 1 | Slice + URL sync |
| 1-B UI Primitives | 1 | 8 components |
| 1-C PropertyCard + FilterPanel | 1 | 2 complex components |
| 1-D SearchBar | 1 | Autocomplete + backend |
| 1-E Search Page + API | 1 | Full page + endpoint |
| 2-A through 2-E | 5 | Listing page |
| 3-A through 3-D | 4 | Map view |
| 4-A through 4-D | 4 | Auth + collections |
| 5 | 2 | Alerts |
| 6 | 1 | Suburb profiles |
| 7 | 1 | Finance tools |
| 8-A through 8-C | 3 | Dashboard |
| 9 | 1 | Polish |
| 10 | 1 | Deploy |

**Total: ~36 focused sessions**
