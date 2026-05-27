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

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase.client
      .from('properties')
      .select(
        'id, owner_id, status, headline, description, unit_number, street_number, street_name, suburb, state, postcode, lat, lng, bedrooms, bathrooms, car_spaces, land_size_sqm, build_size_sqm, price, price_min, price_max, price_display, is_price_hidden, listing_type, property_type, sale_method, features, auction_at, published_at, created_at',
      )
      .eq('id', id)
      .eq('listing_source', 'owner')
      .single();

    if (error || !data) throw new NotFoundException('Listing not found');
    if ((data as { owner_id: string }).owner_id !== userId) {
      throw new ForbiddenException('Not your listing');
    }

    return data;
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

  async getAnalytics(userId: string) {
    const { data: listings, error } = await this.supabase.client
      .from('properties')
      .select('id, headline, suburb, status, published_at, view_count, enquiry_count')
      .eq('owner_id', userId)
      .eq('listing_source', 'owner');

    if (error) throw new BadRequestException(error.message);

    const rows = (listings ?? []) as {
      id: string;
      headline: string | null;
      suburb: string;
      status: string;
      published_at: string | null;
      view_count: number | null;
      enquiry_count: number | null;
    }[];

    const totalViews = rows.reduce((s, l) => s + (l.view_count ?? 0), 0);
    const totalEnquiries = rows.reduce((s, l) => s + (l.enquiry_count ?? 0), 0);

    let totalOffers = 0;
    if (rows.length > 0) {
      const { count } = await this.supabase.client
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .in('property_id', rows.map((r) => r.id));
      totalOffers = count ?? 0;
    }

    const analyticsListings = rows.map((l) => {
      const views = l.view_count ?? 0;
      const enquiries = l.enquiry_count ?? 0;
      const daysLive = l.published_at
        ? Math.max(1, Math.ceil((Date.now() - new Date(l.published_at).getTime()) / 86_400_000))
        : 0;
      const enquiryRate = views > 0 ? Math.round((enquiries / views) * 1000) / 10 : 0;
      return {
        id: l.id,
        headline: l.headline,
        suburb: l.suburb,
        status: l.status,
        published_at: l.published_at,
        view_count: views,
        enquiry_count: enquiries,
        enquiryRate,
        daysLive,
      };
    });

    const avgEnquiryRate =
      analyticsListings.length > 0
        ? Math.round(
            (analyticsListings.reduce((s, l) => s + l.enquiryRate, 0) / analyticsListings.length) * 10,
          ) / 10
        : 0;

    return { totalViews, totalEnquiries, totalOffers, avgEnquiryRate, listings: analyticsListings };
  }

  async getAllEnquiries(userId: string, page: number) {
    const PAGE_SIZE = 20;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await this.supabase.client
      .from('enquiries')
      .select('id, sender_name, sender_email, message, status, created_at, property_id', {
        count: 'exact',
      })
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new BadRequestException(error.message);

    const propertyIds = [
      ...new Set(
        (data ?? [])
          .map((e: { property_id: string | null }) => e.property_id)
          .filter((id): id is string => !!id),
      ),
    ];

    let propertiesMap: Record<string, { headline: string | null; suburb: string; state: string }> =
      {};

    if (propertyIds.length > 0) {
      const { data: props } = await this.supabase.client
        .from('properties')
        .select('id, headline, suburb, state')
        .in('id', propertyIds);

      for (const prop of (props ?? []) as {
        id: string;
        headline: string | null;
        suburb: string;
        state: string;
      }[]) {
        propertiesMap[prop.id] = { headline: prop.headline, suburb: prop.suburb, state: prop.state };
      }
    }

    const total = count ?? 0;
    const items = (
      data as {
        id: string;
        sender_name: string;
        sender_email: string;
        message: string;
        status: string;
        created_at: string;
        property_id: string | null;
      }[]
    ).map((e) => ({
      id: e.id,
      sender_name: e.sender_name,
      sender_email: e.sender_email,
      message: e.message,
      status: e.status,
      created_at: e.created_at,
      property:
        e.property_id && propertiesMap[e.property_id]
          ? { id: e.property_id, ...propertiesMap[e.property_id] }
          : null,
    }));

    return { items, total, totalPages: Math.ceil(total / PAGE_SIZE) };
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
