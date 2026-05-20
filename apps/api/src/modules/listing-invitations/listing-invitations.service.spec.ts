import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ListingInvitationsService } from './listing-invitations.service';
import { SupabaseService } from '../../database/supabase.service';

const mockProperty = {
  id: 'prop-1',
  headline: 'Modern 3BHK',
  unit_number: null,
  street_number: '12',
  street_name: 'Main St',
  suburb: 'Navrangpura',
  state: 'GJ',
  owner_id: 'owner-1',
  listing_type: 'buy',
};

const mockAgent = { id: 'agent-1', profile_id: 'profile-agent-1', agency_id: 'agency-1' };
const mockAgentProfile = { full_name: 'Ravi Patel', email: 'ravi@example.com', phone: '9999900000' };
const mockOwnerProfile = { full_name: 'Arjun Mehta', email: 'arjun@example.com' };
const mockInvitation = {
  id: 'inv-1',
  token: 'tok-abc123',
  status: 'pending',
  expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  property_id: 'prop-1',
  owner_id: 'owner-1',
  agent_id: 'agent-1',
  message: 'Please manage this.',
};

type ChainMock = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
};

function makeChain(): ChainMock {
  const chain: ChainMock = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  (chain.select as jest.Mock).mockReturnValue(chain);
  (chain.insert as jest.Mock).mockReturnValue(chain);
  (chain.update as jest.Mock).mockReturnValue(chain);
  (chain.eq as jest.Mock).mockReturnValue(chain);
  (chain.in as jest.Mock).mockReturnValue(chain);
  return chain;
}

describe('ListingInvitationsService', () => {
  let service: ListingInvitationsService;
  let chain: ChainMock;

  beforeEach(async () => {
    chain = makeChain();

    const supabaseMock: Partial<SupabaseService> = {
      client: { from: jest.fn().mockReturnValue(chain) } as unknown as SupabaseService['client'],
    };

    const module = await Test.createTestingModule({
      providers: [
        ListingInvitationsService,
        { provide: SupabaseService, useValue: supabaseMock },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'resend.apiKey') return 'test-key';
              if (key === 'app.url') return 'https://propsphere.app';
              return null;
            },
          },
        },
      ],
    }).compile();

    service = module.get(ListingInvitationsService);
    Object.assign(service, {
      sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
      sendAcceptanceEmail: jest.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('inserts invitation and sends email', async () => {
      chain.single
        .mockResolvedValueOnce({ data: mockProperty, error: null })   // property check
        .mockResolvedValueOnce({ data: mockAgent, error: null })       // agent lookup
        .mockResolvedValueOnce({ data: mockAgentProfile, error: null }) // agent profile
        .mockResolvedValueOnce({ data: mockOwnerProfile, error: null }) // owner profile
        .mockResolvedValueOnce({ data: { id: 'inv-1', token: 'tok-abc' }, error: null }); // insert
      chain.maybeSingle.mockResolvedValueOnce({ data: null }); // no existing invitation

      const result = await service.create(
        { propertyId: 'prop-1', agentId: 'agent-1', message: 'Hi' },
        'owner-1',
      );

      expect(result).toEqual({ id: 'inv-1' });
      expect((service as unknown as Record<string, jest.Mock>)['sendInvitationEmail']).toHaveBeenCalled();
    });

    it('throws ConflictException when pending invitation already exists', async () => {
      chain.single.mockResolvedValueOnce({ data: mockProperty, error: null });
      chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'existing' } });

      await expect(
        service.create({ propertyId: 'prop-1', agentId: 'agent-1' }, 'owner-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when property does not belong to owner', async () => {
      chain.single.mockResolvedValueOnce({ data: null, error: null });

      await expect(
        service.create({ propertyId: 'prop-1', agentId: 'agent-1' }, 'other-owner'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('accept', () => {
    it('sets agent_id, agency_id, and listing_source=transferred on the property', async () => {
      chain.single
        .mockResolvedValueOnce({ data: mockInvitation, error: null })    // find invitation
        .mockResolvedValueOnce({ data: mockAgent, error: null })          // agent lookup
        .mockResolvedValueOnce({ data: null, error: null })               // update property
        .mockResolvedValueOnce({ data: null, error: null })               // update invitation
        .mockResolvedValueOnce({ data: mockOwnerProfile, error: null })   // owner profile
        .mockResolvedValueOnce({ data: mockAgentProfile, error: null })   // agent profile
        .mockResolvedValueOnce({ data: mockProperty, error: null });       // property for email

      await service.accept('tok-abc123');

      const updateArgs = (chain.update as jest.Mock).mock.calls;
      const propertyUpdate = updateArgs.find(
        (call: [Record<string, unknown>]) => call[0]?.listing_source === 'transferred',
      );
      expect(propertyUpdate).toBeDefined();
      expect(propertyUpdate[0]).toMatchObject({
        agent_id: 'agent-1',
        agency_id: 'agency-1',
        listing_source: 'transferred',
      });
    });

    it('throws BadRequestException for an expired invitation', async () => {
      chain.single.mockResolvedValueOnce({
        data: { ...mockInvitation, expires_at: new Date(Date.now() - 1000).toISOString() },
        error: null,
      });
      chain.single.mockResolvedValueOnce({ data: mockAgent, error: null });

      await expect(service.accept('tok-abc123')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when invitation is not pending', async () => {
      chain.single.mockResolvedValueOnce({
        data: { ...mockInvitation, status: 'accepted' },
        error: null,
      });

      await expect(service.accept('tok-abc123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('throws ForbiddenException when owner_id does not match', async () => {
      chain.single.mockResolvedValueOnce({
        data: { id: 'inv-1', owner_id: 'other-owner', status: 'pending' },
        error: null,
      });

      await expect(service.cancel('inv-1', 'owner-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when invitation is not pending', async () => {
      chain.single.mockResolvedValueOnce({
        data: { id: 'inv-1', owner_id: 'owner-1', status: 'accepted' },
        error: null,
      });

      await expect(service.cancel('inv-1', 'owner-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when invitation does not exist', async () => {
      chain.single.mockResolvedValueOnce({ data: null, error: null });

      await expect(service.cancel('inv-1', 'owner-1')).rejects.toThrow(NotFoundException);
    });
  });
});
