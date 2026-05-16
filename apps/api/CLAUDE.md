# apps/api — Backend Context

Read root `CLAUDE.md` first. This file extends it with backend-specific context auto-loaded when working inside `apps/api/`.

---

## What This App Is

NestJS 10 + TypeScript strict REST API. Entry: `src/main.ts`. Global route prefix: `/api/v1`. Deployed to Railway.

---

## Key Paths

```
src/
├── app.module.ts            ← Register ALL modules here
├── main.ts                  ← Bootstrap, global pipes, CORS
├── common/
│   ├── guards/
│   │   └── auth.guard.ts    ← Verify Supabase JWT on every protected route
│   ├── decorators/
│   │   └── current-user.ts  ← @CurrentUser() param decorator
│   └── pipes/
│       └── zod-validation.pipe.ts
├── database/
│   └── supabase.service.ts  ← ONLY place Supabase client is used
├── modules/
│   ├── auth/
│   ├── properties/          ← FTS search, CRUD, image upload
│   ├── agents/
│   ├── suburbs/
│   ├── enquiries/
│   ├── collections/
│   ├── alerts/              ← BullMQ producer
│   ├── notifications/       ← Resend email + Firebase FCM
│   ├── media/               ← Supabase Storage
│   └── search-history/
└── jobs/                    ← BullMQ processors
    ├── alert-matching.processor.ts
    ├── price-drop.processor.ts
    └── suburb-stats.processor.ts
```

---

## Module File Layout

Every module follows this exact structure — do not deviate:

```
modules/{module}/
├── {module}.module.ts
├── {module}.controller.ts   ← Route, validate, delegate — ZERO business logic
├── {module}.service.ts      ← ALL business logic here
└── dto/
    ├── create-{module}.dto.ts
    └── update-{module}.dto.ts
```

---

## Request Lifecycle

```
HTTP Request
  └─► NestJS Router
        └─► AuthGuard (verify Supabase JWT → attach user to request)
              └─► ZodValidationPipe (validate DTO against Zod schema)
                    └─► Controller method (route + delegate only)
                          └─► Service method (business logic)
                                └─► SupabaseService (execute DB query)
                                      └─► Map result to @propsphere/types
                                            └─► HTTP Response
```

---

## Controller Pattern

```typescript
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // Public route — no guard
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  // Protected route
  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body(new ZodValidationPipe(createPropertySchema)) dto: CreatePropertyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.propertiesService.create(dto, user.id);
  }
}
```

---

## Service Pattern

```typescript
@Injectable()
export class PropertiesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findOne(id: string): Promise<PropertyDetail> {
    const { data, error } = await this.supabase.client
      .from('properties')
      .select('*, property_images(*), agents(*)')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException(`Property ${id} not found`);

    return mapToPropertyDetail(data);  // never return raw Supabase shapes
  }
}
```

---

## Hard Rules (Backend)

- Controllers only route and validate — zero business logic
- All DB access via `SupabaseService` — never instantiate Supabase client elsewhere
- Validate all DTOs at controller boundary via `ZodValidationPipe`
- Throw NestJS HTTP exceptions from services, never return error objects:
  - `NotFoundException` — resource not found
  - `UnauthorizedException` — unauthenticated or insufficient role
  - `BadRequestException` — invalid input that passed DTO validation
  - `ConflictException` — duplicate resource
- Never return raw Supabase data shapes — always map to types from `@propsphere/types`
- Apply `@UseGuards(AuthGuard)` to all protected routes
- Register every new module in `app.module.ts`
- No FK constraints in any Postgres migrations

---

## Background Jobs (BullMQ)

| Queue | Trigger | Purpose |
|---|---|---|
| `alert-matching` | `PropertiesService.create()` | Match new property against saved searches |
| `price-drop` | `PropertiesService.updatePrice()` | Notify users who saved the property |
| `suburb-stats` | Nightly `@Cron` | Recalculate median price + days on market |

Job type definitions live in `common/types/`. Processors live in `jobs/`.

---

## Postgres FTS (Search)

Properties search uses `tsvector` + GIN index — no external search service.

```typescript
// Example FTS query in SupabaseService
const { data } = await this.supabase.client
  .from('properties')
  .select('*')
  .textSearch('search_vector', query, { type: 'websearch' })
  .limit(PAGE_SIZE);
```

See `docs/database-schema.md` for the full index definition and RLS policies.

---

## Module Dependency Map

```
AppModule
├── ConfigModule (global — validates env via Zod on startup)
├── SupabaseModule (global — admin client available everywhere)
├── AuthModule
├── PropertiesModule
├── AgentsModule
├── SuburbsModule
├── EnquiriesModule ──► NotificationsModule
├── CollectionsModule
├── AlertsModule ──► BullMQ, NotificationsModule
├── NotificationsModule ──► Resend, Firebase FCM
├── MediaModule ──► SupabaseModule (Storage)
└── SearchHistoryModule
```

---

## Relevant Docs

| Doc | Read When |
|---|---|
| `docs/database-schema.md` | Any DB query, migration, or RLS change |
| `docs/backend-prompt.md` | Architecture patterns and detailed examples |
| `docs/coding-standards.md` | NestJS-specific code rules |
| `docs/naming-conventions.md` | DTO, route, and file naming |
| `docs/folder-structure.md` | Where to place new files |
