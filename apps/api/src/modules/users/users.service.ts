import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import type { TrackRecentlyViewedDto } from './dto/users.dto';

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
  properties: {
    id: string;
    headline: string | null;
    suburb: string;
    state: string;
    hero_image_url: string | null;
  } | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

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
      .select(
        'id, message, created_at, status, properties:property_id(id, headline, suburb, state, hero_image_url)',
      )
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return ((data ?? []) as unknown as EnquiryRow[]).map((e) => ({
      id: e.id,
      message: e.message,
      createdAt: e.created_at,
      status: e.status,
      property: e.properties
        ? {
            id: e.properties.id,
            headline: e.properties.headline,
            suburb: e.properties.suburb,
            state: e.properties.state,
            heroImageUrl: e.properties.hero_image_url,
          }
        : null,
    }));
  }
}
