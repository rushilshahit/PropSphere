import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { BadRequestException } from '@nestjs/common';
import type { TrackRecentlyViewedDto, UpdateProfileDto } from './dto/users.dto';

interface RecentlyViewedRow {
  user_id: string;
  property_id: string;
  viewed_at: string;
}

interface EnquiryRow {
  id: string;
  message: string;
  created_at: string;
  status: string;
  property_id: string | null;
}

interface OfferRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  property_id: string | null;
}

interface PropertyStub {
  id: string;
  headline: string | null;
  suburb: string;
  state: string;
}

interface ImageRow {
  property_id: string;
  cdn_url: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async getMyProfile(userId: string) {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return data ?? null;
  }

  async updateProfile(userId: string, email: string, dto: UpdateProfileDto): Promise<void> {
    const patch: Record<string, unknown> = { email };
    if (dto.full_name !== undefined) patch.full_name = dto.full_name;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.role !== undefined) patch.role = dto.role;

    const { error } = await this.supabase.client
      .from('profiles')
      .upsert({ id: userId, ...patch }, { onConflict: 'id' });

    if (error) throw new BadRequestException(error.message);
  }

  async trackRecentlyViewed(userId: string, dto: TrackRecentlyViewedDto): Promise<void> {
    await this.supabase.client
      .from('recently_viewed')
      .upsert(
        { user_id: userId, property_id: dto.propertyId, viewed_at: new Date().toISOString() },
        { onConflict: 'user_id,property_id' },
      );

    // Prune to keep only the latest 20 rows for this user
    const { data: rows } = await this.supabase.client
      .from('recently_viewed')
      .select('property_id, viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(21);

    const allRows = (rows ?? []) as Pick<RecentlyViewedRow, 'property_id' | 'viewed_at'>[];
    if (allRows.length > 20) {
      const toDelete = allRows.slice(20).map((r) => r.property_id);
      await this.supabase.client
        .from('recently_viewed')
        .delete()
        .eq('user_id', userId)
        .in('property_id', toDelete);
    }
  }

  async getRecentlyViewed(userId: string): Promise<{ propertyId: string; viewedAt: string }[]> {
    const { data, error } = await this.supabase.client
      .from('recently_viewed')
      .select('property_id, viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return ((data ?? []) as Pick<RecentlyViewedRow, 'property_id' | 'viewed_at'>[]).map((r) => ({
      propertyId: r.property_id,
      viewedAt: r.viewed_at,
    }));
  }

  async getMyEnquiries(userId: string) {
    const { data, error } = await this.supabase.client
      .from('enquiries')
      .select('id, message, created_at, status, property_id')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const rows = (data ?? []) as EnquiryRow[];
    const propertyIds = [...new Set(rows.map((r) => r.property_id).filter((id): id is string => Boolean(id)))];

    const propertyMap = new Map<string, PropertyStub>();
    const heroMap = new Map<string, string>();

    if (propertyIds.length) {
      const [propertiesResult, imagesResult] = await Promise.all([
        this.supabase.client
          .from('properties')
          .select('id, headline, suburb, state')
          .in('id', propertyIds),
        this.supabase.client
          .from('property_images')
          .select('property_id, cdn_url')
          .in('property_id', propertyIds)
          .eq('is_floor_plan', false)
          .order('sort_order'),
      ]);

      for (const p of (propertiesResult.data ?? []) as PropertyStub[]) {
        propertyMap.set(p.id, p);
      }
      for (const img of (imagesResult.data ?? []) as ImageRow[]) {
        if (!heroMap.has(img.property_id)) heroMap.set(img.property_id, img.cdn_url);
      }
    }

    return rows.map((e) => {
      const prop = e.property_id ? propertyMap.get(e.property_id) : undefined;
      return {
        id: e.id,
        message: e.message,
        createdAt: e.created_at,
        status: e.status,
        property: prop
          ? { id: prop.id, headline: prop.headline, suburb: prop.suburb, state: prop.state, heroImageUrl: heroMap.get(prop.id) ?? null }
          : null,
      };
    });
  }

  async getMyOffers(userId: string) {
    const { data, error } = await this.supabase.client
      .from('offers')
      .select('id, amount, status, created_at, property_id')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const rows = (data ?? []) as OfferRow[];
    const propertyIds = [...new Set(rows.map((r) => r.property_id).filter((id): id is string => Boolean(id)))];

    const propertyMap = new Map<string, PropertyStub>();
    const heroMap = new Map<string, string>();

    if (propertyIds.length) {
      const [propertiesResult, imagesResult] = await Promise.all([
        this.supabase.client
          .from('properties')
          .select('id, headline, suburb, state')
          .in('id', propertyIds),
        this.supabase.client
          .from('property_images')
          .select('property_id, cdn_url')
          .in('property_id', propertyIds)
          .eq('is_floor_plan', false)
          .order('sort_order'),
      ]);

      for (const p of (propertiesResult.data ?? []) as PropertyStub[]) {
        propertyMap.set(p.id, p);
      }
      for (const img of (imagesResult.data ?? []) as ImageRow[]) {
        if (!heroMap.has(img.property_id)) heroMap.set(img.property_id, img.cdn_url);
      }
    }

    return rows.map((o) => {
      const prop = o.property_id ? propertyMap.get(o.property_id) : undefined;
      return {
        id: o.id,
        amount: o.amount,
        status: o.status,
        createdAt: o.created_at,
        property: prop
          ? { id: prop.id, headline: prop.headline, suburb: prop.suburb, state: prop.state, heroImageUrl: heroMap.get(prop.id) ?? null }
          : null,
      };
    });
  }
}
