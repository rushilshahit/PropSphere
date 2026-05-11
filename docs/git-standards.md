# Git Standards
## PropSphere

---

## Branch Model

```
main          — production-ready, always deployable
develop       — integration branch, staging deploys from here
feature/*     — new features
fix/*         — bug fixes
chore/*       — maintenance, deps, config
hotfix/*      — urgent production fixes (branch from main)
```

Never commit directly to `main` or `develop`.

---

## Branch Naming

```
feature/property-card-component
feature/map-cluster-markers
feature/agent-listing-wizard
fix/search-filter-url-sync
fix/enquiry-email-not-sending
chore/upgrade-tanstack-query-v5
chore/add-eslint-rules
hotfix/auth-token-expiry-crash
```

Rules:
- Lowercase, hyphen-separated
- Prefix with type (feature/fix/chore/hotfix)
- Short, descriptive — 3–6 words max
- No ticket numbers in branch names (use commit body for that)

---

## Commit Message Format

Conventional Commits format:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `chore` — maintenance, deps, config
- `refactor` — code change, no feature/fix
- `test` — add or update tests
- `docs` — documentation only
- `perf` — performance improvement
- `ci` — CI/CD changes

**Scopes** (match module names):
`search`, `listing`, `map`, `auth`, `collections`, `alerts`, `suburb`, `finance`, `agents`, `dashboard`, `api`, `types`, `config`

**Examples:**

```
feat(search): add radius filter to property search
fix(enquiry): resolve duplicate email send on retry
chore(deps): upgrade supabase-js to 2.39.0
feat(map): implement cluster marker expansion on click
test(auth): add unit tests for auth guard
docs(api): document properties search endpoint params
perf(search): virtualise results list with tanstack-virtual
```

**Rules:**
- Imperative mood: "add X", not "added X" or "adds X"
- No period at end of subject line
- Subject line max 72 characters
- Body explains *why*, not *what*

---

## Pull Request Process

1. Branch off `develop` (or `main` for hotfixes)
2. Keep PRs focused — one feature/fix per PR
3. PR title follows commit format: `feat(search): add suburb autocomplete`
4. PR description includes:
   - What changed and why
   - How to test
   - Screenshots for UI changes
5. Minimum 1 approval required to merge
6. Squash merge into `develop` (keeps history clean)
7. Delete branch after merge

---

## PR Description Template

```markdown
## What

Brief description of what this PR does.

## Why

Why this change is needed.

## How to Test

1. Step one
2. Step two
3. Expected result

## Screenshots (if UI change)

<!-- Paste before/after screenshots -->

## Checklist

- [ ] Tests added/updated
- [ ] Types updated in `packages/types` if needed
- [ ] No `any` types introduced
- [ ] Tailwind only (no inline styles)
- [ ] `task.md` updated
```

---

## What Not to Commit

Handled by `.gitignore` and `.claudeignore`:
- `.env`, `.env.*` (except `.env.example`)
- `node_modules/`
- `dist/`, `build/`, `.next/`
- Supabase local volume data
- IDE-specific files (`.vscode/`, `.idea/` — use workspace settings instead)
- Log files
- OS files (`.DS_Store`, `Thumbs.db`)

---

## Release Tags

When merging to `main`:
```
v1.0.0    — major release
v1.1.0    — minor (new features, backwards compatible)
v1.1.1    — patch (bug fixes)
```

Tag format: `git tag -a v1.0.0 -m "v1.0.0: Initial launch"`
