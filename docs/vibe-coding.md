# Vibe Coding Guidelines
## How to Work with Claude on PropSphere

---

## The Mental Model

Treat Claude as a senior dev who joined the project today. They're capable but need context. The more context you give, the less back-and-forth you need.

**Every prompt should answer:**
1. What are you building?
2. Where does it live in the codebase? (reference `docs/folder-structure.md`)
3. What should it do?
4. Are there existing patterns to match? (point to a similar file)

---

## Prompt Structure That Works

```
Context: [What feature/module this relates to]
File: [Exact file path to create or edit]
Task: [Specific thing to implement]
Reference: [Existing file or pattern to match]
Constraints: [Anything specific — types, APIs, no extra deps]
```

**Good example:**
> Context: Search feature  
> File: `apps/web/src/features/search/components/FilterPanel.tsx`  
> Task: Build the price range filter section — dual-handle slider + two manual input fields (min/max). Should dispatch to the `searchSlice` on change with 200ms debounce.  
> Reference: Match the pattern in `searchSlice.ts`. Use `useAppDispatch`.  
> Constraints: No new dependencies. Use the `RangeSlider` primitive from `components/ui/`.

**Bad example:**
> "Make a filter panel"

---

## Starting a Session

At the start of a new Claude session, paste this:

```
Read claude.md in the repo root. This is a real estate marketplace (PropSphere).
Stack: React 18 + TypeScript strict + TailwindCSS + Redux Toolkit + TanStack Query / NestJS + Supabase.
Read .claude/coding-standards.md and .claude/design.md before generating any code.
Current task: [paste from task.md]
```

---

## Context Files to Reference in Prompts

| When working on | Reference |
|---|---|
| Any UI component | `.claude/design.md` |
| New NestJS module | `docs/folder-structure.md`, `.claude/coding-standards.md` |
| Database changes | `docs/database-schema.md` |
| Search/filter logic | `docs/backend-prompt.md` (Typesense section) |
| New shared type | `packages/types/src/` (read first) |
| New feature | `docs/folder-structure.md` (verify placement) |

---

## What to Ask Claude to Do (High Signal)

- "Implement `usePropertySearch` hook following the pattern in `api/properties.ts`"
- "Add a `GET /suburbs/autocomplete` endpoint to `SuburbsController` — returns top 5 suburb matches from Typesense"
- "Build `AuctionCountdown.tsx` — displays countdown to `auction_at` timestamp, updates every second, hides when auction is past"
- "Write a Zod schema for `CreatePropertyDto` matching the `properties` table columns in `docs/database-schema.md`"

## What NOT to Ask Claude in One Prompt (Low Signal)

- "Build the entire search page"
- "Set up the backend"
- "Make the app look nice"

Break large work into tasks in `task.md`, then feed them one at a time.

---

## Iterating on Generated Code

When Claude generates something that's almost right:

1. **Don't re-explain everything** — quote the specific part that's wrong
2. **Be specific:** "The `buildFilters` function doesn't handle `propertyTypes` being an empty array — it should skip that filter if the array is empty"
3. **Ask for a diff, not a full rewrite:** "Only change the `buildFilters` function, leave the rest as-is"

---

## When Claude Gets It Wrong

If Claude introduces patterns that don't match the codebase:
1. Point to the `.claude/coding-standards.md` rule it violated
2. Show the correct existing pattern from the codebase
3. Ask it to redo just that part

---

## Token-Efficient Sessions

See `.claude/token-saving.md` for full guidance. Summary:
- Don't paste entire files when you only need to discuss a function
- Use file paths + line ranges instead of pasting content
- One task per session when possible — context switching wastes tokens

---

## After Claude Generates Code

Always:
1. Read the generated code before running it
2. Check types compile: `pnpm tsc --noEmit`
3. Check lint: `pnpm lint`
4. Run tests: `pnpm test`
5. Update `task.md` to mark the task done

---

## Red Flags in Generated Code

Stop and ask Claude to fix if you see:
- `any` type
- `as` type assertion without a comment explaining why
- Direct Supabase calls inside a React component
- Inline styles on a React component
- New npm package added without it being in `task.md` or explicitly requested
- Default export on a non-page component
- `console.log` left in
