import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateOwnerListingDto } from './dto/create-owner-listing.dto';
import type { UpdateOwnerListingStatusDto } from './dto/update-owner-listing-status.dto';

const MAX_ACTIVE_LISTINGS = 5;

const SELLER_ROLES = new Set(['seller', 'agent']);

@Injectable()
export class OwnerListingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(dto: CreateOwnerListingDto, userId: string) {
    await this.assertSellerRole(userId);
    await this.assertUnderLimit(userId);

    const { data, error } = await this.supabase.client
      .from('properties')
      .insert({
        ...dto,
        owner_id: userId,
        listing_source: 'owner',
        status: 'active',
        published_at: new Date().toISOString(),
        agent_id: null,
        agency_id: null,
        features: dto.features ?? [],
      })
      .select('id')
      .single();

    if (error) throw new BadRequestException(error.message);

    return { id: (data as { id: string }).id };
  }

  async findMine(userId: string) {
    const { data, error } = await this.supabase.client
      .from('properties')
      .select(
        'id, status, headline, suburb, state, price, price_display, price_min, price_max, listing_type, property_type, bedrooms, bathrooms, published_at, created_at',
      )
      .eq('owner_id', userId)
      .eq('listing_source', 'owner')
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return data ?? [];
  }

  async getActiveCount(userId: string) {
    const { count, error } = await this.supabase.client
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('listing_source', 'owner')
      .eq('status', 'active');

    if (error) throw new BadRequestException(error.message);

    return { count: count ?? 0, max: MAX_ACTIVE_LISTINGS };
  }

  async updateStatus(id: string, dto: UpdateOwnerListingStatusDto, userId: string) {
    const { data: existing } = await this.supabase.client
      .from('properties')
      .select('owner_id')
      .eq('id', id)
      .eq('listing_source', 'owner')
      .single();

    if (!existing) throw new NotFoundException('Listing not found');
    if ((existing as { owner_id: string }).owner_id !== userId) {
      throw new ForbiddenException('Not your listing');
    }

    const patch: Record<string, unknown> = { status: dto.status };
    if (dto.status === 'active') patch['published_at'] = new Date().toISOString();

    const { data, error } = await this.supabase.client
      .from('properties')
      .update(patch)
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  private async assertSellerRole(userId: string) {
    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || !SELLER_ROLES.has((profile as { role: string }).role)) {
      throw new ForbiddenException('A seller account is required to post listings');
    }
  }

  private async assertUnderLimit(userId: string) {
    const { count } = await this.supabase.client
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('listing_source', 'owner')
      .eq('status', 'active');

    if ((count ?? 0) >= MAX_ACTIVE_LISTINGS) {
      throw new ForbiddenException(
        `You have reached the maximum of ${MAX_ACTIVE_LISTINGS} active listings`,
      );
    }
  }
}
