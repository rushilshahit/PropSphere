import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EnquiriesService } from './enquiries.service';
import { SupabaseService } from '../../database/supabase.service';

const PROPERTY_ID = 'prop-uuid-001';
const AGENT_ID = 'agent-uuid-001';
const OWNER_ID = 'owner-uuid-002';

const baseDto = {
  sender_name: 'Test Buyer',
  sender_email: 'buyer@test.com',
  message: 'I am interested in this property.',
};

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'email-id' }) },
  })),
}));

const makeSupabase = () => ({
  client: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn(),
    rpc: jest.fn().mockResolvedValue({ error: null }),
  },
});

const makeConfig = (overrides: Record<string, string> = {}) => ({
  get: jest.fn((key: string) => overrides[key] ?? null),
});

describe('EnquiriesService', () => {
  let service: EnquiriesService;
  let supabase: ReturnType<typeof makeSupabase>;

  const setupModule = async (supabaseMock = makeSupabase(), configMock = makeConfig()) => {
    const module = await Test.createTestingModule({
      providers: [
        EnquiriesService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();
    service = module.get(EnquiriesService);
    supabase = supabaseMock;
  };

  describe('create — owner listing routing', () => {
    it('routes enquiry to owner when listing_source is owner', async () => {
      await setupModule();

      let insertRow: Record<string, unknown> = {};

      supabase.client.from.mockImplementation((table: string) => {
        if (table === 'properties') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      unit_number: null,
                      street_number: '10',
                      street_name: 'Ring Road',
                      suburb: 'Bodakdev',
                      state: 'GJ',
                      listing_source: 'owner',
                      owner_id: OWNER_ID,
                    },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { email: 'owner@test.com', full_name: 'Property Owner' },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'enquiries') {
          return {
            insert: (row: Record<string, unknown>) => {
              insertRow = row;
              return {
                select: () => ({
                  single: () => Promise.resolve({ data: { id: 'enq-id' }, error: null }),
                }),
              };
            },
          };
        }
        return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
      });

      await service.create({ ...baseDto, property_id: PROPERTY_ID }, undefined);

      expect(insertRow['owner_id']).toBe(OWNER_ID);
      expect(insertRow['agent_id']).toBeNull();
    });

    it('routes enquiry to agent when listing_source is agent', async () => {
      await setupModule();

      let insertRow: Record<string, unknown> = {};

      supabase.client.from.mockImplementation((table: string) => {
        if (table === 'properties') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      unit_number: null,
                      street_number: '5',
                      street_name: 'SG Highway',
                      suburb: 'Thaltej',
                      state: 'GJ',
                      listing_source: 'agent',
                      owner_id: null,
                    },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'agents') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { profile_id: 'profile-uuid' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { email: 'agent@test.com', full_name: 'Agent Name' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'enquiries') {
          return {
            insert: (row: Record<string, unknown>) => {
              insertRow = row;
              return {
                select: () => ({
                  single: () => Promise.resolve({ data: { id: 'enq-id' }, error: null }),
                }),
              };
            },
          };
        }
        return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
      });

      await service.create({ ...baseDto, property_id: PROPERTY_ID, agent_id: AGENT_ID }, undefined);

      expect(insertRow['agent_id']).toBe(AGENT_ID);
      expect(insertRow['owner_id']).toBeNull();
    });

    it('throws NotFoundException when property does not exist', async () => {
      await setupModule();

      supabase.client.from.mockImplementation((table: string) => {
        if (table === 'properties') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(
        service.create({ ...baseDto, property_id: PROPERTY_ID }, undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets status=new on all enquiry inserts', async () => {
      await setupModule();

      let insertRow: Record<string, unknown> = {};

      supabase.client.from.mockImplementation((table: string) => {
        if (table === 'properties') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      unit_number: null, street_number: '1', street_name: 'A St',
                      suburb: 'X', state: 'GJ', listing_source: 'owner', owner_id: OWNER_ID,
                    },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { email: 'o@t.com', full_name: 'Owner' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'enquiries') {
          return {
            insert: (row: Record<string, unknown>) => {
              insertRow = row;
              return { select: () => ({ single: () => Promise.resolve({ data: { id: 'eid' }, error: null }) }) };
            },
          };
        }
        return {};
      });

      await service.create({ ...baseDto, property_id: PROPERTY_ID }, undefined);
      expect(insertRow['status']).toBe('new');
    });
  });
});
