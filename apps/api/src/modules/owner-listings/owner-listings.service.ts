import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateOwnerListingDto } from './dto/create-owner-listing.dto';
import type { CreateInspectionsDto } from './dto/create-inspections.dto';
import type { UpdateOwnerListingStatusDto } from './dto/update-owner-listing-status.dto';
import type { UpdateOwnerListingDto } from './dto/update-owner-listing.dto';

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
        'id, status, headline, suburb, state, postcode, unit_number, street_number, street_name, price, price_display, price_min, price_max, listing_type, property_type, bedrooms, bathrooms, published_at, created_at, view_count, enquiry_count',
      )
      .eq('owner_id', userId)
      .eq('listing_source', 'owner')
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return data ?? [];
  }

  async getDashboardStats(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      { count: activeListings },
      { count: enquiriesToday },
      { data: viewData },
    ] = await Promise.all([
      this.supabase.client
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('listing_source', 'owner')
        .eq('status', 'active'),
      this.supabase.client
        .from('enquiries')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .gte('created_at', todayStart.toISOString()),
      this.supabase.client
        .from('properties')
        .select('view_count')
        .eq('owner_id', userId)
        .eq('listing_source', 'owner'),
    ]);

    const totalViews = (viewData ?? []).reduce(
      (sum, p: { view_count: number | null }) => sum + (p.view_count ?? 0),
      0,
    );

    return {
      activeListings: activeListings ?? 0,
      enquiriesToday: enquiriesToday ?? 0,
      totalViews,
    };
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

  async getStats(id: string, userId: string) {
    const { data: property, error } = await this.supabase.client
      .from('properties')
      .select('owner_id, view_count, enquiry_count, published_at')
      .eq('id', id)
      .eq('listing_source', 'owner')
      .single();

    if (error || !property) throw new NotFoundException('Listing not found');
    if ((property as { owner_id: string }).owner_id !== userId) {
      throw new ForbiddenException('Not your listing');
    }

    const p = property as {
      view_count: number;
      enquiry_count: number;
      published_at: string | null;
    };

    const daysListed = p.published_at
      ? Math.ceil(
          (Date.now() - new Date(p.published_at).getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      view_count: p.view_count ?? 0,
      enquiry_count: p.enquiry_count ?? 0,
      days_listed: daysListed,
    };
  }

  async getEnquiries(id: string, userId: string) {
    const { data: property } = await this.supabase.client
      .from('properties')
      .select('owner_id')
      .eq('id', id)
      .eq('listing_source', 'owner')
      .single();

    if (!property) throw new NotFoundException('Listing not found');
    if ((property as { owner_id: string }).owner_id !== userId) {
      throw new ForbiddenException('Not your listing');
    }

    const { data, error } = await this.supabase.client
      .from('enquiries')
      .select('id, sender_name, sender_email, sender_phone, message, status, created_at')
      .eq('property_id', id)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return data ?? [];
  }

  async update(id: string, dto: UpdateOwnerListingDto, userId: string) {
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

    const { data, error } = await this.supabase.client
      .from('properties')
      .update(dto)
      .eq('id', id)
      .select('id')
      .single();

    if (error) throw new BadRequestException(error.message);

    return data;
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

  async delete(id: string, userId: string) {
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

    const { error } = await this.supabase.client
      .from('properties')
      .update({ status: 'withdrawn' })
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { success: true };
  }

  async createInspections(id: string, dto: CreateInspectionsDto, userId: string) {
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

    const rows = dto.slots.map((slot) => ({
      property_id: id,
      type: slot.type,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
    }));

    const { error } = await this.supabase.client.from('inspections').insert(rows);
    if (error) throw new BadRequestException(error.message);

    return { count: rows.length };
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
