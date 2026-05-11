# Backend Implementation Prompt
## PropSphere — NestJS + PostgreSQL (Supabase)

---

## Stack

- NestJS 10 (TypeScript strict)
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Postgres Full-Text Search** (`tsvector` + GIN — no external search engine)
- BullMQ + Redis (alerts, cron jobs)
- Resend (transactional email)
- Firebase Admin SDK (push notifications)
- Zod (DTO validation)
- PostHog Node SDK (server-side events)

---

## Module Architecture

```
AppModule
├── ConfigModule (global)
├── SupabaseModule (global) — admin client
├── AuthModule
├── PropertiesModule  — CRUD + Postgres FTS search
├── AgentsModule
├── SuburbsModule
├── EnquiriesModule
├── CollectionsModule
├── AlertsModule       — BullMQ producers/consumers
├── NotificationsModule
├── MediaModule        — Supabase Storage
└── SearchHistoryModule
```

---

## Supabase Service (Global)

```typescript
// database/supabase.service.ts
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient<Database>;

  constructor(private readonly config: ConfigService) {
    this.client = createClient<Database>(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_KEY'),
    );
  }
}
```

Always use the service key on the backend (bypasses RLS intentionally).

---

## Auth Guard

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const token = extractBearerToken(context.switchToHttp().getRequest());
    if (!token) throw new UnauthorizedException();

    const { data, error } = await this.supabase.client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException();

    context.switchToHttp().getRequest()['user'] = data.user;
    return true;
  }
}
```

---

## Properties Module

### Search with Postgres FTS

The `search_vector` column is a `TSVECTOR` kept in sync by a DB trigger. All search queries hit Postgres directly — no external service.

```typescript
// properties/properties.service.ts
async search(dto: SearchPropertiesDto): Promise<SearchResult<PropertySummary>> {
  const { data, error, count } = await this.supabase.client
    .from('properties')
    .select(PROPERTY_SUMMARY_COLUMNS, { count: 'exact' })
    .eq('status', 'active')
    .eq('listing_type', dto.listingType)
    .textSearch('search_vector', dto.query ?? '', {
      type: 'plain',
      config: 'english',
    })
    .gte('price', dto.priceMin ?? 0)
    .lte('price', dto.priceMax ?? 999_999_999)
    .gte('bedrooms', dto.bedrooms ?? 0)
    .gte('bathrooms', dto.bathrooms ?? 0)
    .in('property_type', dto.propertyTypes?.length ? dto.propertyTypes : ALL_PROPERTY_TYPES)
    .order('published_at', { ascending: false })
    .range(
      ((dto.page ?? 1) - 1) * PAGE_SIZE,
      ((dto.page ?? 1) - 1) * PAGE_SIZE + PAGE_SIZE - 1,
    );

  if (error) throw new InternalServerErrorException(error.message);

  return {
    items: data ?? [],
    total: count ?? 0,
    page: dto.page ?? 1,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}
```

For bounding-box map queries (no PostGIS required for simple lat/lng bbox):

```typescript
async findByBoundingBox(dto: BoundingBoxDto): Promise<PropertyMapPin[]> {
  const { data, error } = await this.supabase.client
    .from('properties')
    .select('id, lat, lng, price, price_display, property_type')
    .eq('status', 'active')
    .gte('lat', dto.swLat)
    .lte('lat', dto.neLat)
    .gte('lng', dto.swLng)
    .lte('lng', dto.neLng)
    .limit(200);

  if (error) throw new InternalServerErrorException(error.message);
  return data ?? [];
}
```

For radius search (PostGIS, map "search this area" with pin):

```typescript
async findByRadius(lat: number, lng: number, radiusKm: number) {
  const { data, error } = await this.supabase.client
    .rpc('search_properties_radius', { lat, lng, radius_km: radiusKm });
  if (error) throw new InternalServerErrorException(error.message);
  return data ?? [];
}
```

```sql
-- Supabase RPC function
CREATE OR REPLACE FUNCTION search_properties_radius(lat float, lng float, radius_km float)
RETURNS SETOF properties AS $$
  SELECT * FROM properties
  WHERE status = 'active'
    AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    );
$$ LANGUAGE SQL STABLE;
```

### Suburb Autocomplete (FTS)

```typescript
async autocomplete(query: string): Promise<SuburbSuggestion[]> {
  const { data } = await this.supabase.client
    .from('suburbs')
    .select('id, name, state, postcode, lat, lng')
    .textSearch('name', query, { type: 'plain' })
    .limit(8);
  return data ?? [];
}
```

### Controller

```typescript
@Controller('properties')
export class PropertiesController {
  @Get('search')
  search(@Query(new ZodValidationPipe(searchSchema)) dto: SearchPropertiesDto) {
    return this.propertiesService.search(dto);
  }

  @Get('map')
  map(@Query(new ZodValidationPipe(bboxSchema)) dto: BoundingBoxDto) {
    return this.propertiesService.findByBoundingBox(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('agent')
  create(@Body(new ZodValidationPipe(createPropertySchema)) dto: CreatePropertyDto,
         @CurrentUser() user: AuthUser) {
    return this.propertiesService.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('agent')
  update(@Param('id') id: string,
         @Body(new ZodValidationPipe(updatePropertySchema)) dto: UpdatePropertyDto,
         @CurrentUser() user: AuthUser) {
    return this.propertiesService.update(id, dto, user);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('agent')
  updateStatus(@Param('id') id: string,
               @Body('status') status: ListingStatus,
               @CurrentUser() user: AuthUser) {
    return this.propertiesService.updateStatus(id, status, user);
  }
}
```

---

## Enquiries Module

```typescript
async create(dto: CreateEnquiryDto, userId?: string): Promise<Enquiry> {
  // 1. Fetch property + agent email (no join — two queries)
  const { data: property } = await this.supabase.client
    .from('properties')
    .select('id, headline, suburb, state, agent_id')
    .eq('id', dto.propertyId)
    .single();

  if (!property) throw new NotFoundException('Property not found');

  const { data: agent } = await this.supabase.client
    .from('agents')
    .select('id, profile_id')
    .eq('id', property.agent_id)
    .single();

  const { data: profile } = await this.supabase.client
    .from('profiles')
    .select('email, full_name')
    .eq('id', agent.profile_id)
    .single();

  // 2. Insert enquiry
  const { data: enquiry, error } = await this.supabase.client
    .from('enquiries')
    .insert({
      property_id: dto.propertyId,
      agent_id: agent.id,
      sender_id: userId ?? null,
      sender_name: dto.name,
      sender_email: dto.email,
      sender_phone: dto.phone ?? null,
      message: dto.message,
    })
    .select()
    .single();

  if (error) throw new InternalServerErrorException(error.message);

  // 3. Increment enquiry count
  await this.supabase.client.rpc('increment_enquiry_count', {
    property_id: dto.propertyId,
  });

  // 4. Send email (non-blocking)
  this.resend.sendEnquiryNotification({
    agentEmail: profile.email,
    agentName: profile.full_name,
    propertyAddress: `${property.suburb}, ${property.state}`,
    senderName: dto.name,
    message: dto.message,
  }).catch(err => console.error('Email send failed:', err));

  return enquiry;
}
```

---

## Alerts Module (BullMQ)

```typescript
// alerts/alerts.processor.ts
@Processor('alerts')
export class AlertsProcessor {
  @Process('new-listing')
  async handleNewListing(job: Job<{ propertyId: string }>) {
    const { data: savedSearches } = await this.supabase.client
      .from('saved_searches')
      .select('id, user_id, filters')
      .eq('alert_enabled', true);

    const property = await this.fetchProperty(job.data.propertyId);
    const matching = (savedSearches ?? []).filter(s =>
      matchesFilters(property, s.filters as SearchFilters),
    );

    await Promise.all(
      matching.map(s =>
        this.notifications.dispatch(s.user_id, {
          type: 'new_listing',
          title: 'New listing matching your search',
          body: `${property.suburb}, ${property.state}`,
          data: { property_id: job.data.propertyId },
        }),
      ),
    );
  }

  @Process('price-drop')
  async handlePriceDrop(job: Job<{ propertyId: string; newPrice: number }>) {
    const { data: alerts } = await this.supabase.client
      .from('price_alerts')
      .select('id, user_id, price_at_save')
      .eq('property_id', job.data.propertyId)
      .eq('triggered', false);

    for (const alert of alerts ?? []) {
      if (job.data.newPrice < alert.price_at_save) {
        await this.notifications.dispatch(alert.user_id, {
          type: 'price_drop',
          title: 'Price drop on a saved property',
          data: { property_id: job.data.propertyId },
        });
        await this.supabase.client
          .from('price_alerts')
          .update({ triggered: true, triggered_at: new Date().toISOString() })
          .eq('id', alert.id);
      }
    }
  }
}
```

---

## Media Upload

```typescript
@Post('upload')
@UseGuards(AuthGuard)
@UseInterceptors(FilesInterceptor('files', 20))
async upload(
  @UploadedFiles() files: Express.Multer.File[],
  @CurrentUser() user: AuthUser,
) {
  return this.mediaService.uploadMany(files, user.id);
}
```

```typescript
async uploadOne(file: Express.Multer.File, userId: string): Promise<UploadResult> {
  const ext = file.originalname.split('.').pop() ?? 'jpg';
  const path = `properties/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await this.supabase.client.storage
    .from('property-media')
    .upload(path, file.buffer, { contentType: file.mimetype });

  if (error) throw new InternalServerErrorException('Upload failed');

  const { data } = this.supabase.client.storage
    .from('property-media')
    .getPublicUrl(path);

  return { storagePath: path, cdnUrl: data.publicUrl };
}
```

---

## Zod Validation Pipe

```typescript
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return result.data;
  }
}
```

---

## API Response Envelope

```typescript
// All responses wrapped via TransformInterceptor
interface ApiResponse<T> {
  data: T;
  meta?: { page?: number; totalPages?: number; total?: number };
}
```

---

## Suburb Stats Cron

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async refreshSuburbStats() {
  const { data: suburbs } = await this.supabase.client
    .from('suburbs')
    .select('id');

  for (const { id } of suburbs ?? []) {
    await this.alertsQueue.add('refresh-suburb', { suburbId: id });
  }
}
```

---

## Rate Limiting

```typescript
// main.ts
app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use('/auth', rateLimit({ windowMs: 15 * 60_000, max: 10 }));
```

---

## Error Shape

```typescript
// Global exception filter normalises all errors to:
{
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;  // Zod validation errors
  timestamp: string;
  path: string;
}
```

Never expose stack traces or raw Supabase messages to clients.

---

## Search DTO

```typescript
const searchSchema = z.object({
  listingType:   z.enum(['buy','rent','sold']).default('buy'),
  query:         z.string().optional(),
  priceMin:      z.coerce.number().optional(),
  priceMax:      z.coerce.number().optional(),
  bedrooms:      z.coerce.number().int().min(0).max(10).optional(),
  bathrooms:     z.coerce.number().int().min(0).max(10).optional(),
  propertyTypes: z.array(propertyTypeSchema).optional(),
  sortBy:        z.enum(['newest','price_asc','price_desc']).default('newest'),
  page:          z.coerce.number().int().min(1).default(1),
});

export type SearchPropertiesDto = z.infer<typeof searchSchema>;
```

---

## Testing

```bash
pnpm test        # unit tests (Jest)
pnpm test:cov    # coverage report
pnpm test:e2e    # e2e (Supabase local emulator)
```

- Unit: mock Supabase `.from().select()` chain
- Integration: Supabase local via `npx supabase start`
- E2E: test search, enquiry submit, property create
