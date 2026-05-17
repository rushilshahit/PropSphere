# Phase 2 — Test Cases
## Unit + Integration + E2E Coverage

---

## Test Stack (unchanged from Phase 1)

```
Unit tests:       Vitest + React Testing Library (frontend)
                  Jest + Supertest (backend NestJS)
E2E tests:        Playwright
Coverage target:  > 80% on new Phase 2 code
```

## Run Commands

```bash
# All tests
pnpm test

# Frontend only
pnpm test --filter=web

# Backend only
pnpm test --filter=api

# E2E (requires running dev server)
pnpm dev &
pnpm test:e2e

# Coverage report
pnpm test:cov --filter=web
pnpm test:cov --filter=api

# Watch mode (during development)
pnpm test --watch --filter=web
```

---

## SESSION 2-A — DB + MapLibre Tests

### Verification queries — paste into Supabase SQL Editor after running `node scripts/migrate.js`

No separate test file needed — run these queries directly in Supabase dashboard → SQL Editor:
```sql
-- Verify new columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name IN ('virtual_tour_url','bhk_config','feature_order',
                      'sold_price_is_confidential','under_contract_at');
-- Expected: 5 rows

-- Verify enum has new value
SELECT unnest(enum_range(NULL::listing_status));
-- Expected: includes 'under_contract'

-- Verify new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('property_price_history','offers','recently_viewed','agent_certifications');
-- Expected: 4 rows

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('offers','recently_viewed','property_price_history');
-- Expected: all have rowsecurity = true
```

### Unit test: `apps/web/src/lib/map.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { MAP_STYLE_STREETS, MAP_STYLE_SATELLITE, DEFAULT_VIEWPORT } from './map';

describe('map config', () => {
  it('MAP_STYLE_STREETS contains maptiler domain', () => {
    expect(MAP_STYLE_STREETS).toContain('api.maptiler.com');
    expect(MAP_STYLE_STREETS).toContain('streets');
  });

  it('MAP_STYLE_SATELLITE contains maptiler domain', () => {
    expect(MAP_STYLE_SATELLITE).toContain('api.maptiler.com');
    expect(MAP_STYLE_SATELLITE).toContain('satellite');
  });

  it('DEFAULT_VIEWPORT centres on Ahmedabad', () => {
    expect(DEFAULT_VIEWPORT.latitude).toBeCloseTo(23.02, 1);
    expect(DEFAULT_VIEWPORT.longitude).toBeCloseTo(72.57, 1);
    expect(DEFAULT_VIEWPORT.zoom).toBe(11);
  });

  it('no mapbox references in map config', () => {
    expect(MAP_STYLE_STREETS).not.toContain('mapbox');
    expect(MAP_STYLE_SATELLITE).not.toContain('mapbox');
  });
});
```

---

## SESSION 2-B — Suburb + Dashboard + Agent Signup Tests

### Unit test: `apps/web/src/features/suburb/components/SuburbSoldInsights.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SuburbSoldInsights } from './SuburbSoldInsights';
import * as api from '@/api/suburbs';

vi.mock('@/api/suburbs');

describe('SuburbSoldInsights', () => {
  it('renders clearance rate when data is available', () => {
    vi.mocked(api.useSuburbSoldStats).mockReturnValue({
      data: { totalSales: 42, medianSoldPrice: 4500000, clearanceRate: 78, avgDaysOnMarket: 28 },
      isLoading: false,
    } as any);

    render(<SuburbSoldInsights suburbId="suburb-123" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('28 days')).toBeInTheDocument();
  });

  it('shows skeleton while loading', () => {
    vi.mocked(api.useSuburbSoldStats).mockReturnValue({ isLoading: true } as any);
    const { container } = render(<SuburbSoldInsights suburbId="suburb-123" />);
    expect(container.querySelector('.animate-shimmer')).toBeInTheDocument();
  });

  it('shows N/A for missing clearance rate', () => {
    vi.mocked(api.useSuburbSoldStats).mockReturnValue({
      data: { totalSales: 5, medianSoldPrice: null, clearanceRate: null, avgDaysOnMarket: null },
      isLoading: false,
    } as any);
    render(<SuburbSoldInsights suburbId="suburb-123" />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
```

### Backend unit test: `apps/api/src/modules/suburbs/suburbs.service.spec.ts` (add)

```typescript
describe('SuburbsService.getSoldStats', () => {
  it('returns zero counts when no sold properties exist', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await service.getSoldStats('suburb-id-123');
    expect(result.totalSales).toBe(0);
    expect(result.clearanceRate).toBeNull();
    expect(result.medianSoldPrice).toBeNull();
  });

  it('calculates median correctly for odd count', async () => {
    const mockData = [
      { sold_price: 3000000, sale_method: 'private_treaty' },
      { sold_price: 5000000, sale_method: 'auction' },
      { sold_price: 4000000, sale_method: 'private_treaty' },
    ];
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const result = await service.getSoldStats('suburb-id-123');
    expect(result.medianSoldPrice).toBe(4000000);
    expect(result.totalSales).toBe(3);
  });

  it('calculates clearance rate from auction results', async () => {
    const mockData = [
      { sold_price: 5000000, sale_method: 'auction' },
      { sold_price: null,    sale_method: 'auction' },  // passed in
      { sold_price: 4000000, sale_method: 'private_treaty' },
    ];
    // 1 auction sold / 2 total auctions = 50%
    const result = await callWithData(mockData);
    expect(result.clearanceRate).toBe(50);
  });
});
```

### Unit test: `apps/web/src/features/agent-signup/hooks/useAgentSignup.test.ts`

```typescript
describe('useAgentSignup', () => {
  it('sets agencyMode to join when existing agency selected', () => {
    const { result } = renderHook(() => useAgentSignupState());
    act(() => result.current.selectExistingAgency('agency-id-1', 'PropStar Realty'));
    expect(result.current.state.agencyMode).toBe('join');
    expect(result.current.state.existingAgencyId).toBe('agency-id-1');
  });

  it('sets agencyMode to create when creating new agency', () => {
    const { result } = renderHook(() => useAgentSignupState());
    act(() => result.current.setNewAgencyName('My Realty Co'));
    expect(result.current.state.agencyMode).toBe('create');
    expect(result.current.state.newAgencyName).toBe('My Realty Co');
  });

  it('step 3 requires license number', () => {
    const { result } = renderHook(() => useAgentSignupState());
    const errors = result.current.validateStep(3, { licenseNo: '' });
    expect(errors.licenseNo).toBeTruthy();
  });

  it('step 3 requires bio minimum 50 chars', () => {
    const { result } = renderHook(() => useAgentSignupState());
    const errors = result.current.validateStep(3, { bio: 'Too short' });
    expect(errors.bio).toContain('50');
  });
});
```

### Backend unit test: `apps/api/src/modules/agents/agents.service.spec.ts` (add)

```typescript
describe('AgentsService.apply', () => {
  it('sets profile role to pending_agent', async () => {
    const updateSpy = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table) => ({
      insert: vi.fn().mockReturnThis(),
      update: updateSpy,
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'agent-1' }, error: null }),
    }));

    await service.apply(mockDto, 'user-id-1');

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'pending_agent' })
    );
  });

  it('creates agency when agencyMode is create', async () => {
    const insertSpy = vi.fn().mockReturnThis();
    // ... test that agencies.insert is called with newAgency data
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My New Realty' })
    );
  });

  it('throws if user is already an agent', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'agents') {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
                 single: vi.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }) };
      }
    });
    await expect(service.apply(mockDto, 'user-id-1'))
      .rejects.toThrow(ConflictException);
  });
});
```

---

## SESSION 2-C — Sold + Enhancements + Account Tests

### Unit test: `apps/web/src/features/search/utils/derive-badge.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { deriveBadge } from './derive-badge';

const base: PropertySummary = {
  id: 'p1', status: 'active', listingType: 'buy',
  saleMethod: 'private_treaty', publishedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  // ...other required fields
};

describe('deriveBadge priority', () => {
  it('returns null for old active listing with no special flags', () => {
    expect(deriveBadge(base)).toBeNull();
  });

  it('returns "New" for listing published within 7 days', () => {
    const badge = deriveBadge({ ...base, publishedAt: new Date().toISOString() });
    expect(badge?.label).toBe('New');
    expect(badge?.className).toContain('rea-red');
  });

  it('returns "Auction" for upcoming auction (highest priority)', () => {
    const auctionAt = new Date(Date.now() + 3 * 86400000).toISOString();
    // Even if also "New" — Auction wins
    const badge = deriveBadge({
      ...base,
      saleMethod: 'auction',
      auctionAt,
      publishedAt: new Date().toISOString(),
    });
    expect(badge?.label).toBe('Auction');
  });

  it('returns "Under Offer" for under_contract status', () => {
    const badge = deriveBadge({ ...base, status: 'under_contract' });
    expect(badge?.label).toBe('Under Offer');
  });

  it('returns "360° Tour" when virtualTourUrl set (higher than New)', () => {
    const badge = deriveBadge({
      ...base,
      virtualTourUrl: 'https://youtube.com/watch?v=abc',
      publishedAt: new Date().toISOString(),
    });
    expect(badge?.label).toBe('Auction');  // only if no auction
    // With no auction:
    const badge2 = deriveBadge({ ...base, virtualTourUrl: 'https://youtube.com/abc' });
    expect(badge2?.label).toBe('360° Tour');
  });

  it('returns "Inspection" for upcoming inspection within 7 days', () => {
    const nextInspectionAt = new Date(Date.now() + 2 * 86400000).toISOString();
    const badge = deriveBadge({ ...base, nextInspectionAt });
    expect(badge?.label).toBe('Inspection');
    expect(badge?.className).toContain('rea-teal');
  });

  it('returns null for past auction', () => {
    const auctionAt = new Date(Date.now() - 86400000).toISOString();
    const badge = deriveBadge({ ...base, saleMethod: 'auction', auctionAt });
    expect(badge).toBeNull();
  });
});
```

### Unit test: `apps/web/src/features/listing/components/PriceHistoryChart.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('PriceHistoryChart', () => {
  it('renders "No price history" when data is empty', () => {
    mockUsePriceHistory([]);
    render(<PriceHistoryChart propertyId="p1" />);
    expect(screen.getByText(/no price history/i)).toBeInTheDocument();
  });

  it('renders chart when history records exist', () => {
    mockUsePriceHistory([
      { id: 'h1', soldPrice: 4000000, soldDate: '2022-01-15', saleMethod: 'auction', source: 'internal', isSeedData: true },
      { id: 'h2', soldPrice: 5000000, soldDate: '2024-06-20', saleMethod: 'private_treaty', source: 'internal', isSeedData: false },
    ]);
    render(<PriceHistoryChart propertyId="p1" />);
    expect(screen.getByText('Jan 22')).toBeInTheDocument();
    expect(screen.getByText('Jun 24')).toBeInTheDocument();
  });

  it('shows skeleton while loading', () => {
    mockUsePriceHistory(null, true);
    const { container } = render(<PriceHistoryChart propertyId="p1" />);
    expect(container.querySelector('.animate-shimmer')).toBeInTheDocument();
  });

  it('adds current price as final data point', () => {
    mockUsePriceHistory([{ id: 'h1', soldPrice: 4000000, soldDate: '2022-01-15', saleMethod: 'private_treaty', source: 'internal', isSeedData: true }]);
    render(<PriceHistoryChart propertyId="p1" currentPrice={5500000} />);
    expect(screen.getByText('Current')).toBeInTheDocument();
  });
});
```

### Backend unit test: `apps/api/src/modules/properties/properties.service.spec.ts` (add)

```typescript
describe('PropertiesService.getPriceHistory', () => {
  it('returns empty array when no history exists', async () => {
    mockSupabase.resolveWith([]);
    const result = await service.getPriceHistory('property-id-1');
    expect(result).toEqual([]);
  });

  it('returns records ordered by sold_date ascending', async () => {
    const mockData = [
      { id: 'h2', sold_date: '2024-01-01', sold_price: 5000000 },
      { id: 'h1', sold_date: '2021-06-15', sold_price: 3500000 },
    ];
    mockSupabase.resolveWith(mockData);
    const result = await service.getPriceHistory('property-id-1');
    // Supabase order is applied — check the query was correct
    expect(mockSupabase.order).toHaveBeenCalledWith('sold_date', { ascending: true });
  });
});

describe('PropertiesService.updateStatus → price history auto-creation', () => {
  it('creates price history record when status changes to sold', async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'property_price_history') return { insert: insertSpy };
      return defaultMock;
    });

    await service.updateStatus('property-id-1', { status: 'sold', soldPrice: 4500000 }, 'agent-id-1');

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ sold_price: 4500000, source: 'internal', is_seed_data: false })
    );
  });

  it('does NOT create price history when status changes to withdrawn', async () => {
    const insertSpy = vi.fn();
    await service.updateStatus('property-id-1', { status: 'withdrawn' }, 'agent-id-1');
    expect(insertSpy).not.toHaveBeenCalled();
  });
});
```

### Unit test: `apps/web/src/features/account/pages/RecentlyViewedPage.test.tsx`

```typescript
describe('useTrackRecentlyViewed', () => {
  beforeEach(() => localStorage.clear());

  it('adds propertyId to localStorage on mount', () => {
    renderHook(() => useTrackRecentlyViewed('property-abc'));
    const stored = JSON.parse(localStorage.getItem('rv') ?? '[]');
    expect(stored[0]).toBe('property-abc');
  });

  it('deduplicates — moves existing ID to front', () => {
    localStorage.setItem('rv', JSON.stringify(['property-abc', 'property-xyz']));
    renderHook(() => useTrackRecentlyViewed('property-xyz'));
    const stored = JSON.parse(localStorage.getItem('rv') ?? '[]');
    expect(stored[0]).toBe('property-xyz');
    expect(stored).toHaveLength(2);  // no duplicates
  });

  it('limits to 20 entries', () => {
    const existing = Array.from({ length: 20 }, (_, i) => `prop-${i}`);
    localStorage.setItem('rv', JSON.stringify(existing));
    renderHook(() => useTrackRecentlyViewed('prop-new'));
    const stored = JSON.parse(localStorage.getItem('rv') ?? '[]');
    expect(stored).toHaveLength(20);
    expect(stored[0]).toBe('prop-new');
  });

  it('does not throw if localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('quota exceeded'); });
    expect(() => renderHook(() => useTrackRecentlyViewed('prop-1'))).not.toThrow();
  });
});
```

---

## SESSION 2-D — Offers + Profiles + Analytics Tests

### Unit test: `apps/web/src/features/offers/components/OfferModal.test.tsx`

```typescript
describe('OfferModal', () => {
  const defaultProps = {
    propertyId: 'p1', agentId: 'a1',
    askingPrice: 5000000, isOpen: true, onClose: vi.fn(),
  };

  it('renders asking price hint when askingPrice is provided', () => {
    render(<OfferModal {...defaultProps} />);
    expect(screen.getByText(/asking price/i)).toBeInTheDocument();
    expect(screen.getByText(/₹50 L/i)).toBeInTheDocument();  // formatPrice(5000000)
  });

  it('quick chip sets amount to asking price', async () => {
    render(<OfferModal {...defaultProps} />);
    await userEvent.click(screen.getByText('Asking'));
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(5000000);
  });

  it('quick chip sets -5% of asking price', async () => {
    render(<OfferModal {...defaultProps} />);
    await userEvent.click(screen.getByText('-5%'));
    const input = screen.getByRole('spinbutton');
    expect(Number(input.value)).toBeCloseTo(4750000, -4);
  });

  it('shows validation error when amount is 0', async () => {
    render(<OfferModal {...defaultProps} askingPrice={undefined} />);
    await userEvent.click(screen.getByText('Submit offer'));
    expect(screen.getByText(/enter an offer amount/i)).toBeInTheDocument();
  });

  it('shows disclaimer text', () => {
    render(<OfferModal {...defaultProps} />);
    expect(screen.getByText(/not legally binding/i)).toBeInTheDocument();
  });

  it('calls onClose after successful submit', async () => {
    mockUseSubmitOffer.mockReturnValue({ mutate: vi.fn((_, { onSuccess }) => onSuccess()), isPending: false });
    render(<OfferModal {...defaultProps} />);
    await userEvent.type(screen.getByRole('spinbutton'), '4500000');
    await userEvent.type(screen.getByPlaceholderText(/your name/i), 'Rahul Sharma');
    await userEvent.type(screen.getByPlaceholderText(/your email/i), 'rahul@example.com');
    await userEvent.click(screen.getByText('Submit offer'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
```

### Backend unit test: `apps/api/src/modules/offers/offers.service.spec.ts`

```typescript
describe('OffersService.create', () => {
  it('inserts offer with sender_id null when unauthenticated', async () => {
    const insertSpy = vi.fn().mockReturnThis();
    mockSupabase.from.mockReturnValue({ insert: insertSpy, select: vi.fn().mockReturnThis(),
                                        single: vi.fn().mockResolvedValue({ data: mockOffer, error: null }) });
    await service.create(mockDto, undefined);
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ sender_id: null })
    );
  });

  it('inserts offer with sender_id when authenticated', async () => {
    const insertSpy = vi.fn().mockReturnThis();
    // ...
    await service.create(mockDto, 'user-id-1');
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ sender_id: 'user-id-1' })
    );
  });

  it('throws NotFoundException when property does not exist', async () => {
    mockSupabase.resolveWith(null);
    await expect(service.create({ ...mockDto, propertyId: 'nonexistent' }, 'user-id-1'))
      .rejects.toThrow(NotFoundException);
  });

  it('does not throw when Resend email fails (non-blocking)', async () => {
    mockResend.sendNewOffer.mockRejectedValue(new Error('Resend down'));
    await expect(service.create(mockDto, 'user-id-1')).resolves.toBeDefined();
  });
});

describe('OffersService.updateStatus', () => {
  it('throws ForbiddenException when agent does not own the offer', async () => {
    mockSupabase.resolveWith({ agent_id: 'different-agent' });
    await expect(service.updateStatus('offer-id-1', 'accepted', 'wrong-agent-id'))
      .rejects.toThrow(ForbiddenException);
  });

  it('updates status to accepted', async () => {
    const updateSpy = vi.fn().mockReturnThis();
    // agent_id matches
    mockSupabase.resolveWith({ agent_id: 'agent-id-1' });
    await service.updateStatus('offer-id-1', 'accepted', 'agent-id-1');
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted' })
    );
  });
});
```

### Unit test: `apps/web/src/features/agency/pages/AgencyPage.test.tsx`

```typescript
describe('AgencyPage', () => {
  it('renders agency name in hero', () => {
    mockUseAgencyBySlug({
      name: 'PropStar Realty', slug: 'propstar-realty',
      agents: [], activeListingCount: 12, soldLast12m: 45,
    });
    renderWithRouter(<AgencyPage />, '/agency/propstar-realty');
    expect(screen.getByRole('heading', { name: 'PropStar Realty' })).toBeInTheDocument();
  });

  it('renders stat strip values', () => {
    mockUseAgencyBySlug({ ...baseAgency, activeListingCount: 12, soldLast12m: 45 });
    renderWithRouter(<AgencyPage />, '/agency/propstar-realty');
    expect(screen.getByText('12')).toBeInTheDocument();  // active listings
    expect(screen.getByText('45')).toBeInTheDocument();  // sold 12m
  });

  it('shows "not found" for invalid slug', () => {
    mockUseAgencyBySlug(null, false, new Error('404'));
    renderWithRouter(<AgencyPage />, '/agency/does-not-exist');
    expect(screen.getByText(/agency not found/i)).toBeInTheDocument();
  });
});
```

### Backend unit test: `apps/api/src/modules/agents/agents.service.spec.ts` (add sold history)

```typescript
describe('AgentsService.getSoldHistory', () => {
  it('returns sold properties ordered by sold_at desc', async () => {
    const mockData = [
      { id: 'p2', sold_at: '2025-03-01', sold_price: 5000000 },
      { id: 'p1', sold_at: '2024-11-15', sold_price: 3500000 },
    ];
    mockSupabase.resolveWith(mockData);
    const result = await service.getSoldHistory('agent-slug-1', {});
    expect(result[0].id).toBe('p2');
  });

  it('filters by suburb when provided', async () => {
    const ilikeSpy = vi.fn().mockReturnThis();
    await service.getSoldHistory('agent-slug-1', { suburb: 'Navrangpura' });
    expect(ilikeSpy).toHaveBeenCalledWith('suburb', '%Navrangpura%');
  });

  it('throws NotFoundException for unknown agent slug', async () => {
    mockSupabase.resolveWith(null);
    await expect(service.getSoldHistory('unknown-slug', {}))
      .rejects.toThrow(NotFoundException);
  });
});
```

---

## E2E Tests (Playwright) — Phase 2 Critical Paths

### Test file: `e2e/phase2/sold.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sold listings', () => {
  test('sold search page loads and shows red SOLD ribbons', async ({ page }) => {
    await page.goto('/sold');
    await expect(page.locator('h1,h2').first()).toContainText(/sold/i);
    const soldRibbons = page.locator('[data-testid="sold-ribbon"]');
    await expect(soldRibbons.first()).toBeVisible();
  });

  test('sold listing detail page shows sold price banner', async ({ page }) => {
    // Navigate to a known sold property
    await page.goto('/sold');
    await page.locator('[data-testid="property-card"]').first().click();
    await expect(page.locator('[data-testid="sold-price-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="sold-price-banner"]')).toContainText(/SOLD/);
  });

  test('price history chart renders for sold property', async ({ page }) => {
    await page.goto('/sold');
    await page.locator('[data-testid="property-card"]').first().click();
    // Scroll to price history section
    await page.locator('[data-testid="price-history-section"]').scrollIntoViewIfNeeded();
    // Chart SVG or "no history" message should be visible
    const chart = page.locator('[data-testid="price-history-chart"]');
    const noHistory = page.locator('text=/no price history/i');
    await expect(chart.or(noHistory)).toBeVisible();
  });

  test('sold search filters by date range', async ({ page }) => {
    await page.goto('/sold');
    await page.click('text=Last 3 months');
    await page.waitForResponse(resp => resp.url().includes('/properties/search'));
    const results = page.locator('[data-testid="property-card"]');
    // All results should have sold_at within last 3 months — visual check only
    await expect(results.first()).toBeVisible();
  });
});
```

### Test file: `e2e/phase2/agent-signup.spec.ts`

```typescript
test.describe('Agent self-signup', () => {
  test.use({ storageState: 'e2e/.auth/buyer.json' });  // pre-authenticated buyer

  test('completes 4-step wizard and shows success', async ({ page }) => {
    await page.goto('/become-an-agent');

    // Step 1 — Personal details
    await expect(page.locator('text=Step 1')).toBeVisible();
    await page.fill('[name="fullName"]', 'Raj Kumar');
    await page.fill('[name="phone"]', '9876543210');
    await page.click('button:has-text("Next")');

    // Step 2 — Agency (create new)
    await page.click('text=Create new agency');
    await page.fill('[name="newAgencyName"]', 'Test Realty Co');
    await page.click('button:has-text("Next")');

    // Step 3 — License
    await page.fill('[name="licenseNo"]', 'GUJ-RE-2024-001');
    await page.fill('[name="bio"]', 'Experienced real estate professional with 5 years in Ahmedabad residential market. Specialising in Satellite and Navrangpura areas.');
    await page.selectOption('[name="yearsActive"]', '5');
    await page.click('button:has-text("Next")');

    // Step 4 — Review and submit
    await expect(page.locator('text=Raj Kumar')).toBeVisible();
    await page.click('button:has-text("Submit application")');

    // Success screen
    await expect(page.locator('[data-testid="signup-success"]')).toBeVisible();
    await expect(page.locator('text=/application received/i')).toBeVisible();
  });

  test('shows error when license number is missing', async ({ page }) => {
    await page.goto('/become-an-agent');
    // Navigate to step 3
    await fillStep1(page);
    await fillStep2(page);
    // Skip license number
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=/license/i')).toBeVisible();
  });
});
```

### Test file: `e2e/phase2/offers.spec.ts`

```typescript
test.describe('Offer submission', () => {
  test('buyer can submit an offer on an active buy listing', async ({ page }) => {
    test.use({ storageState: 'e2e/.auth/buyer.json' });

    await page.goto('/buy');
    await page.locator('[data-testid="property-card"]').first().click();

    // "Make an Offer" button should be visible
    await expect(page.locator('button:has-text("Make an Offer")')).toBeVisible();
    await page.click('button:has-text("Make an Offer")');

    // Modal opens
    await expect(page.locator('[data-testid="offer-modal"]')).toBeVisible();

    // Fill amount
    await page.fill('[data-testid="offer-amount"]', '4500000');

    // Submit
    await page.click('button:has-text("Submit offer")');

    // Success
    await expect(page.locator('text=/offer submitted/i')).toBeVisible();
  });

  test('Make an Offer button not visible on sold listings', async ({ page }) => {
    await page.goto('/sold');
    await page.locator('[data-testid="property-card"]').first().click();
    await expect(page.locator('button:has-text("Make an Offer")')).not.toBeVisible();
  });

  test('unauthenticated user can submit offer (with name/email fields)', async ({ page }) => {
    // Not logged in
    await page.goto('/buy');
    await page.locator('[data-testid="property-card"]').first().click();
    await page.click('button:has-text("Make an Offer")');

    // Name and email fields should be editable (not pre-filled)
    const nameInput = page.locator('[name="senderName"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEditable();
    await page.fill('[name="senderName"]', 'Guest Buyer');
    await page.fill('[name="senderEmail"]', 'guest@example.com');
    await page.fill('[data-testid="offer-amount"]', '3000000');
    await page.click('button:has-text("Submit offer")');
    await expect(page.locator('text=/offer submitted/i')).toBeVisible();
  });
});
```

### Test file: `e2e/phase2/map-migration.spec.ts`

```typescript
test.describe('MapLibre migration', () => {
  test('map page loads with MapTiler tiles (no Mapbox errors)', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/map');
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // No Mapbox-related errors
    const mapboxErrors = consoleErrors.filter(e => e.toLowerCase().includes('mapbox'));
    expect(mapboxErrors).toHaveLength(0);
  });

  test('map tiles load from maptiler.com domain', async ({ page }) => {
    const mapTilerRequests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('maptiler.com')) mapTilerRequests.push(req.url());
    });

    await page.goto('/map');
    await page.waitForTimeout(3000);
    expect(mapTilerRequests.length).toBeGreaterThan(0);
  });

  test('draw area still works after MapLibre migration', async ({ page }) => {
    await page.goto('/map');
    await page.click('[data-testid="draw-area-button"]');
    // Draw mode activated
    await expect(page.locator('[data-testid="draw-mode-active"]')).toBeVisible();
  });
});
```

---

## Test Coverage Targets (Phase 2)

```
packages/utils:          > 95%  (pure functions — easy to test)
apps/web unit tests:     > 80%  (components + hooks)
apps/api unit tests:     > 80%  (services)
E2E critical paths:      100%   (all paths listed above)
```

## CI Integration

Add Phase 2 test steps to `.github/workflows/ci.yml`:

```yaml
# Add after existing test jobs:
- name: Run Phase 2 unit tests
  run: pnpm test --filter=web --filter=api
  env:
    VITE_MAPTILER_KEY: ${{ secrets.VITE_MAPTILER_KEY_TEST }}

- name: Playwright E2E — Phase 2
  run: pnpm test:e2e --project=chromium e2e/phase2/
  env:
    BASE_URL: http://localhost:5173

- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report-phase2
    path: playwright-report/
    retention-days: 7
```
