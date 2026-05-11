# Coding Standards
## PropSphere

---

## TypeScript

- Strict mode on everywhere — `"strict": true` in all `tsconfig.json`
- No `any`. Use `unknown` when type is truly unknown, then narrow.
- No `as` type assertions unless interfacing with an untyped third-party library, and add a comment explaining why
- Prefer `interface` for object shapes that might be extended; `type` for unions, primitives, and computed types
- Enums as `const` objects + union types (not TypeScript `enum` keyword — they have runtime cost and compile oddly)

```typescript
// Bad
const role: any = user.role;

// Good
const role: UserRole = user.role;

// Const object instead of enum
export const ListingType = {
  BUY: 'buy',
  RENT: 'rent',
  SOLD: 'sold',
} as const;
export type ListingType = typeof ListingType[keyof typeof ListingType];
```

---

## Functions

- Prefer named exports over default exports in all files except pages and the entry point
- Keep functions small and single-purpose
- If a function has more than 4 parameters, use a params object
- No nested ternaries

```typescript
// Bad
const label = a ? b ? 'x' : 'y' : 'z';

// Good
function getLabel(a: boolean, b: boolean): string {
  if (!a) return 'z';
  return b ? 'x' : 'y';
}
```

---

## React

- Functional components only
- Props interface defined directly above the component, not exported unless shared
- No prop drilling beyond 2 levels — use context or lift to Redux
- `key` prop always uses stable IDs, never array index (unless list is static and never reordered)
- Event handlers named `handleX`, not `onX` (reserve `onX` for prop names)

```tsx
// Bad
export default function card({ data }) { ... }

// Good
interface PropertyCardProps {
  property: PropertySummary;
  compact?: boolean;
}

export function PropertyCard({ property, compact = false }: PropertyCardProps) {
  function handleSaveClick(e: React.MouseEvent) {
    e.preventDefault();
    // ...
  }
  // ...
}
```

---

## NestJS

- One module per domain feature
- Service methods are the business logic layer — controllers only route and validate
- DTOs validated at the controller boundary via `ZodValidationPipe`
- Throw NestJS HTTP exceptions (`NotFoundException`, `UnauthorizedException`, etc.) from services — never return error objects
- Never call Supabase directly from a controller

```typescript
// Bad — controller doing business logic
@Get(':id')
async findOne(@Param('id') id: string) {
  const { data } = await this.supabase.client.from('properties').select().eq('id', id).single();
  if (!data) return null;
  return data;
}

// Good
@Get(':id')
findOne(@Param('id') id: string) {
  return this.propertiesService.findOne(id);
}
```

---

## Imports

- Path aliases always over relative paths beyond one level up
- Order: external packages → internal packages → internal modules → relative imports
- No barrel re-exports that create circular dependency risk

```typescript
// Good
import { PropertySummary } from '@propsphere/types';
import { usePropertySearch } from '@/features/search';
import { PropertyCard } from './PropertyCard';
```

---

## Comments

- No comments explaining *what* code does — the code should be self-explanatory
- Comments only for *why*: non-obvious business logic, workarounds, external API quirks
- JSDoc on exported functions in `packages/utils` only

```typescript
// Bad
// Fetch the property
const property = await this.propertiesService.findOne(id);

// Good
// Typesense returns string IDs but our DB uses UUIDs — coerce here
const id = String(typesenseDoc.id);
```

---

## Error Handling

- Don't add try/catch unless you're doing something specific with the error
- Let NestJS global exception filter handle unhandled errors
- TanStack Query's `onError` callback handles frontend fetch failures — no component-level try/catch
- Log unexpected errors with context, not just `console.error(e)`

---

## Testing

- Test file naming: `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e)
- Test the behaviour, not the implementation
- One `describe` block per function/method being tested
- Mock external dependencies (Supabase, Typesense, Resend) in unit tests
- Don't test trivial getters/setters

---

## File Length

- If a file exceeds ~300 lines, it's probably doing too much — consider splitting
- Components that manage complex state and render a lot of JSX should separate the logic into a custom hook

---

## No Magic Numbers

```typescript
// Bad
if (notes.length > 500) throw ...

// Good
const MAX_NOTES_LENGTH = 500;
if (notes.length > MAX_NOTES_LENGTH) throw ...
```

Put constants in `packages/config/src/constants.ts` if shared, or at the top of the module file if local.
