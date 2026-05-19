import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AlertsService } from '../alerts/alerts.service';
import type { SearchPropertiesDto } from './dto/search-properties.dto';
import type { BoundingBoxDto } from './dto/bounding-box.dto';
import type { UpdateStatusDto } from './dto/update-status.dto';

const PAGE_SIZE = 24;

const PROPERTY_SUMMARY_COLS =
  'id, headline, suburb, state, postcode, unit_number, street_number, street_name, price, price_display, is_price_hidden, bedrooms, bathrooms, car_spaces, land_size_sqm, listing_type, property_type, status, sale_method, published_at, lat, lng, agent_id, agency_id, created_at, bhk_config, virtual_tour_url, auction_at';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly alertsService: AlertsService,
  ) {}

  async search(dto: SearchPropertiesDto) {
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? PAGE_SIZE;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = this.supabase.client
      .from('properties')
      .select(PROPERTY_SUMMARY_COLS, { count: 'exact' });

    if (dto.listingType === 'sold') {
      query = query.eq('status', 'sold');
    } else {
      query = query.eq('status', 'active').eq('listing_type', dto.listingType);
    }

    if (dto.query) {
      query = query.textSearch('search_vector', dto.query, { type: 'plain', config: 'english' });
    }
    if (dto.priceMin !== undefined) query = query.gte('price', dto.priceMin);
    if (dto.priceMax !== undefined) query = query.lte('price', dto.priceMax);
    if (dto.bedrooms !== undefined) query = query.eq('bedrooms', dto.bedrooms);
    if (dto.bathrooms !== undefined) query = query.eq('bathrooms', dto.bathrooms);
    if (dto.carSpaces !== undefined) query = query.eq('car_spaces', dto.carSpaces);
    if (dto.propertyTypes) {
      const types = dto.propertyTypes.split(',').filter(Boolean);
      if (types.length) query = query.in('property_type', types);
    }
    if (dto.publishedSince) query = query.gte('published_at', dto.publishedSince);

    if (dto.sortBy === 'price_asc') {
      query = query.order('price', { ascending: true, nullsFirst: false });
    } else if (dto.sortBy === 'price_desc') {
      query = query.order('price', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('published_at', { ascending: false, nullsFirst: false });
    }

    query = query.range(from, to);

    const { data: properties, count, error } = await query;
    if (error) throw error;

    const items = await this.attachImages(properties ?? []);
    const total = count ?? 0;
    return { items, total, page, totalPages: Math.ceil(total / perPage) };
  }

  async getMapPins(dto: BoundingBoxDto) {
    const { data, error } = await this.supabase.client
      .from('properties')
      .select('id, lat, lng, price, price_display, property_type, listing_type, bedrooms')
      .eq('status', 'active')
      .gte('lat', dto.swLat)
      .lte('lat', dto.neLat)
      .gte('lng', dto.swLng)
      .lte('lng', dto.neLng)
      .limit(50);

    if (error) throw error;
    return data ?? [];
  }

  async findOne(id: string) {
    const { data: property, error } = await this.supabase.client
      .from('properties')
      .select(
        `${PROPERTY_SUMMARY_COLS}, build_size_sqm, price_min, price_max, description, features, available_from, auction_at, sold_at, sold_price, is_featured, view_count, enquiry_count, updated_at`,
      )
      .eq('id', id)
      .single();

    if (error || !property) throw new NotFoundException('Property not found');
    const status = (property as { status: string }).status;
    if (status !== 'active' && status !== 'sold') throw new NotFoundException('Property not found');

    const [images, inspections, agent, agency] = await Promise.all([
      this.supabase.client
        .from('property_images')
        .select('id, property_id, storage_path, cdn_url, caption, sort_order, is_floor_plan, created_at')
        .eq('property_id', id)
        .order('sort_order'),
      this.supabase.client
        .from('inspections')
        .select('id, type, starts_at, ends_at, cancelled')
        .eq('property_id', id)
        .eq('cancelled', false)
        .gt('starts_at', new Date().toISOString()),
      this.fetchAgent((property as { agent_id: string }).agent_id),
      this.supabase.client
        .from('agencies')
        .select('id, name, slug, logo_url, website, phone, address, suburb, state, postcode, created_at')
        .eq('id', (property as { agency_id: string }).agency_id)
        .single(),
    ]);

    return {
      ...property,
      images: images.data ?? [],
      inspections: inspections.data ?? [],
      agent: agent ?? null,
      agency: agency.data ?? null,
    };
  }

  async getSimilar(id: string) {
    const { data: target } = await this.supabase.client
      .from('properties')
      .select('suburb, price, listing_type')
      .eq('id', id)
      .single();

    if (!target) return [];

    const typed = target as { suburb: string; price: number | null; listing_type: string };

    let query = this.supabase.client
      .from('properties')
      .select(PROPERTY_SUMMARY_COLS)
      .eq('suburb', typed.suburb)
      .eq('listing_type', typed.listing_type)
      .eq('status', 'active')
      .neq('id', id)
      .limit(6);

    if (typed.price) {
      query = query
        .gte('price', Math.floor(typed.price * 0.7))
        .lte('price', Math.ceil(typed.price * 1.3));
    }

    const { data: properties } = await query;
    return this.attachImages(properties ?? []);
  }

  async batchByIds(ids: string[]) {
    if (!ids.length) return [];
    const { data, error } = await this.supabase.client
      .from('properties')
      .select(PROPERTY_SUMMARY_COLS)
      .in('id', ids)
      .eq('status', 'active');

    if (error) throw error;

    const enriched = await this.attachImages((data ?? []) as { id: string }[]);

    const byId = new Map(enriched.map((p) => [(p as { id: string }).id, p]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }

  async getPriceHistory(propertyId: string) {
    const { data } = await this.supabase.client
      .from('property_price_history')
      .select('id, sold_price, sold_date, sale_method, source')
      .eq('property_id', propertyId)
      .order('sold_date', { ascending: true });
    return data ?? [];
  }

  async incrementViewCount(id: string) {
    await this.supabase.client.rpc('increment_view_count', { prop_id: id });
    return { success: true };
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const { status, soldPrice, soldAt } = dto;

    const { data: existing } = await this.supabase.client
      .from('properties')
      .select('status, suburb, state, street_number, street_name, sale_method')
      .eq('id', id)
      .single();

    const patch: Record<string, unknown> = {
      status,
      ...(status === 'active' ? { published_at: new Date().toISOString() } : {}),
      ...(status === 'sold' && soldPrice ? { sold_price: soldPrice } : {}),
      ...(status === 'sold' && soldAt ? { sold_at: soldAt } : {}),
    };

    const { error } = await this.supabase.client
      .from('properties')
      .update(patch)
      .eq('id', id);

    if (error) throw error;

    const typed = existing as {
      status: string;
      suburb: string;
      state: string;
      street_number: string;
      street_name: string;
      sale_method: string | null;
    } | null;

    const wasInactive = typed?.status !== 'active';
    if (status === 'active' && wasInactive) {
      await this.alertsService.addNewListingJob(id);
    }

    if (status === 'sold' && soldPrice && typed) {
      const addressKey = [typed.suburb, typed.state, typed.street_number, typed.street_name]
        .join('_')
        .toLowerCase()
        .replace(/\s+/g, '_');

      await this.supabase.client.from('property_price_history').insert({
        property_id: id,
        address_key: addressKey,
        sold_price: soldPrice,
        sold_date: soldAt ?? new Date().toISOString().split('T')[0],
        sale_method: typed.sale_method,
        source: 'internal',
        is_seed_data: false,
      });
    }

    return { success: true };
  }

  async update(id: string, patch: Record<string, unknown>) {
    const { data: existing } = await this.supabase.client
      .from('properties')
      .select('price')
      .eq('id', id)
      .single();

    const { error } = await this.supabase.client
      .from('properties')
      .update(patch)
      .eq('id', id);

    if (error) throw error;

    const oldPrice = (existing as { price: number | null } | null)?.price;
    const newPrice = patch['price'] as number | undefined;
    if (newPrice !== undefined && oldPrice !== null && oldPrice !== undefined && newPrice < oldPrice) {
      await this.alertsService.addPriceDropJob(id, newPrice);
    }

    return { success: true };
  }

  private async fetchAgent(agentId: string) {
    const { data: agent } = await this.supabase.client
      .from('agents')
      .select('id, profile_id, agency_id, license_no, bio, years_active, created_at')
      .eq('id', agentId)
      .single();

    if (!agent) return null;

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('full_name, avatar_url, phone, email')
      .eq('id', (agent as { profile_id: string }).profile_id)
      .single();

    return { ...agent, ...(profile ?? {}) };
  }

  private async attachImages(properties: { id: string }[]) {
    const ids = properties.map((p) => p.id);
    if (!ids.length) return properties.map((p) => ({ ...p, images: [], next_inspection_at: null }));

    const now = new Date().toISOString();

    const [imagesResult, inspectionsResult] = await Promise.all([
      this.supabase.client
        .from('property_images')
        .select('id, property_id, storage_path, cdn_url, caption, sort_order, is_floor_plan, created_at')
        .in('property_id', ids)
        .eq('is_floor_plan', false)
        .order('sort_order'),
      this.supabase.client
        .from('inspections')
        .select('property_id, starts_at')
        .in('property_id', ids)
        .eq('cancelled', false)
        .gte('starts_at', now)
        .order('starts_at', { ascending: true }),
    ]);

    const byProperty = new Map<string, unknown[]>();
    for (const img of imagesResult.data ?? []) {
      const typed = img as { property_id: string };
      const arr = byProperty.get(typed.property_id) ?? [];
      arr.push(img);
      byProperty.set(typed.property_id, arr);
    }

    const nextInspectionByProperty = new Map<string, string>();
    for (const insp of inspectionsResult.data ?? []) {
      const typed = insp as { property_id: string; starts_at: string };
      if (!nextInspectionByProperty.has(typed.property_id)) {
        nextInspectionByProperty.set(typed.property_id, typed.starts_at);
      }
    }

    return properties.map((p) => ({
      ...p,
      images: byProperty.get(p.id) ?? [],
      next_inspection_at: nextInspectionByProperty.get(p.id) ?? null,
    }));
  }
}
