import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OwnerListingsService } from './owner-listings.service';
import { SupabaseService } from '../../database/supabase.service';

const SELLER_USER_ID = 'seller-uuid-001';
const BUYER_USER_ID = 'buyer-uuid-002';
const LISTING_ID = 'listing-uuid-abc';

const makeSupabaseMock = (overrides: Record<string, unknown> = {}) => ({
  client: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    ...overrides,
  },
});

describe('OwnerListingsService', () => {
  let service: OwnerListingsService;
  let supabaseMock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(async () => {
    supabaseMock = makeSupabaseMock();

    const module = await Test.createTestingModule({
      providers: [
        OwnerListingsService,
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    }).compile();

    service = module.get(OwnerListingsService);
  });

  describe('create', () => {
    const validDto = {
      property_type: 'house' as const,
      listing_type: 'buy' as const,
      street_number: '42',
      street_name: 'Oak Ave',
      suburb: 'Bodakdev',
      state: 'GJ',
      postcode: '380054',
      lat: 23.04,
      lng: 72.52,
      bedrooms: 3,
      bathrooms: 2,
      headline: 'Lovely 3BHK in Bodakdev',
      description: 'A beautiful house in the heart of Bodakdev with modern amenities.',
    };

    it('throws ForbiddenException when profile role is buyer', async () => {
      const chainMock = {
        data: { role: 'buyer' },
        error: null,
        count: null,
      };
      jest.spyOn(supabaseMock.client, 'from').mockReturnValue({
        select: () => ({ eq: () => ({ single: () => Promise.resolve(chainMock) }) }),
      } as unknown as ReturnType<typeof supabaseMock.client.from>);

      await expect(service.create(validDto, BUYER_USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when active listing count is at max', async () => {
      let callCount = 0;
      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // profiles query
          return {
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'seller' }, error: null }) }) }),
          } as unknown as ReturnType<typeof supabaseMock.client.from>;
        }
        // count query
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ count: 5, error: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabaseMock.client.from>;
      });

      await expect(service.create(validDto, SELLER_USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('inserts property with listing_source=owner and status=active', async () => {
      let callCount = 0;
      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'seller' }, error: null }) }) }),
          } as unknown as ReturnType<typeof supabaseMock.client.from>;
        }
        if (callCount === 2) {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => Promise.resolve({ count: 2, error: null }),
                }),
              }),
            }),
          } as unknown as ReturnType<typeof supabaseMock.client.from>;
        }
        // insert call
        return {
          insert: (row: Record<string, unknown>) => {
            expect(row['listing_source']).toBe('owner');
            expect(row['status']).toBe('active');
            expect(row['owner_id']).toBe(SELLER_USER_ID);
            expect(row['agent_id']).toBeNull();
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { id: LISTING_ID }, error: null }),
              }),
            };
          },
        } as unknown as ReturnType<typeof supabaseMock.client.from>;
      });

      const result = await service.create(validDto, SELLER_USER_ID);
      expect(result).toEqual({ id: LISTING_ID });
    });
  });

  describe('getActiveCount', () => {
    it('returns count and max', async () => {
      jest.spyOn(supabaseMock.client, 'from').mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ count: 3, error: null }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabaseMock.client.from>);

      const result = await service.getActiveCount(SELLER_USER_ID);
      expect(result).toEqual({ count: 3, max: 5 });
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException when listing does not exist', async () => {
      jest.spyOn(supabaseMock.client, 'from').mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabaseMock.client.from>);

      await expect(
        service.updateStatus(LISTING_ID, { status: 'withdrawn' }, SELLER_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when owner_id does not match', async () => {
      jest.spyOn(supabaseMock.client, 'from').mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { owner_id: 'someone-else' }, error: null }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabaseMock.client.from>);

      await expect(
        service.updateStatus(LISTING_ID, { status: 'withdrawn' }, SELLER_USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates status successfully', async () => {
      let callCount = 0;
      jest.spyOn(supabaseMock.client, 'from').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({ data: { owner_id: SELLER_USER_ID }, error: null }),
                }),
              }),
            }),
          } as unknown as ReturnType<typeof supabaseMock.client.from>;
        }
        return {
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({ data: { id: LISTING_ID, status: 'withdrawn' }, error: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabaseMock.client.from>;
      });

      const result = await service.updateStatus(LISTING_ID, { status: 'withdrawn' }, SELLER_USER_ID);
      expect(result).toEqual({ id: LISTING_ID, status: 'withdrawn' });
    });
  });
});
