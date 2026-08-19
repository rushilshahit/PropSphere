# Token Saving
## Efficient Prompting for PropSphere

Prompting costs tokens. Wasted context = slower responses and higher cost.

---

## Rules

### 1. Reference by path, don't paste

```
// Bad — wastes tokens
Here's my file:
[pastes 200 lines of PropertyCard.tsx]
Add a notes field to this...

// Good
Edit `apps/web/src/features/listing/components/PropertyCard.tsx`.
Add a `notes?: string` prop. Display it below the address in a `<p className="text-sm text-neutral-500 italic mt-1">` if non-null.
```

### 2. One task per message

Don't bundle 5 tasks into one prompt. Claude will conflate them or miss one. Use `task.md` to queue work, then pick tasks one at a time.

### 3. Use the context files, don't repeat them

Instead of explaining the design system in every prompt, say:
> "Follow the patterns in `.claude/design.md`"

Instead of re-explaining the folder structure:
> "Place this in `features/` following the pattern in `docs/folder-structure.md`"

### 4. Specify the output format

```
// Vague — Claude might give you a long explanation + code + more explanation
"Add pagination to the search results"

// Focused — just the code delta
"In `usePropertySearch.ts`, replace the `useQuery` call with `useInfiniteQuery`.
Return only the updated hook function, nothing else."
```

### 5. Short codebase summary instead of full files

For a new session where Claude needs context:

```
PropSphere is a real estate marketplace.
Stack: React 18 + TS strict + Tailwind + Redux Toolkit + TanStack Query / NestJS + Supabase.
Key files:
- CLAUDE.md (project overview, repo root)
- docs/folder-structure.md
- .claude/coding-standards.md
- .claude/design.md
I'm working on: [specific task]
```

Don't paste the files themselves unless Claude asks.

### 6. Incremental changes > full rewrites

```
// Bad
"Rewrite the PropertyCard component to also support compact mode"

// Good
"In PropertyCard.tsx, add a `compact?: boolean` prop.
When compact=true: hide the feature stats row, reduce price text to text-lg.
Minimal change only — don't touch anything else."
```

### 7. Avoid asking Claude to explain things it's already told you

If Claude wrote some code and you understand it, don't ask "can you explain this?" — just run it. Save that token budget for the next task.

---

## Context Window Management for Long Sessions

If you're in a long session and the context is getting large:

1. Ask Claude: "Summarise what we've built so far in 5 bullet points"
2. Start a new session with that summary + the next task
3. Don't try to keep one mega-session going for a full feature — split at logical boundaries

---

## When to Let Claude Read a File

Only have Claude read full files when:
- It needs to understand an existing pattern before writing new code
- There's a bug and the full context matters
- It's a short file (<50 lines) and pasting is fine

For longer files: paste only the relevant function or section, not the entire file.

---

## Prompt Templates

### New component
```
File: [path]
Component: [name]
Props: [list the interface fields]
Behaviour: [what it does]
Design: follow .claude/design.md patterns
Reference: similar to [existing component path]
```

### Bug fix
```
File: [path]
Bug: [exact symptom]
Relevant code: [paste only the broken function]
Expected: [what should happen]
```

### New API endpoint
```
Module: [module name]
Endpoint: [METHOD /path]
Auth: [required role or public]
Input: [DTO fields]
Logic: [what it does in Supabase]
Response: [what it returns]
```

### Database migration
```
Change: [what needs to change in the schema]
Affected table: [table name]
Migration file: scripts/migrations/[timestamp]_[description].sql
Note any RLS changes needed.
```
