import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateCollectionDto, AddPropertyDto } from './dto/collections.dto';

export interface DbCollection {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  share_token: string | null;
  created_at: string;
}

export interface DbCollectionProperty {
  id: string;
  collection_id: string;
  property_id: string;
  notes: string | null;
  added_at: string;
}

@Injectable()
export class CollectionsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getUserCollections(userId: string): Promise<DbCollection[]> {
    const { data, error } = await this.supabase.client
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as DbCollection[];
  }

  async getSavedPropertyIds(userId: string): Promise<string[]> {
    const collections = await this.getUserCollections(userId);
    if (!collections.length) return [];

    const collectionIds = collections.map((c) => c.id);
    const { data, error } = await this.supabase.client
      .from('collection_properties')
      .select('property_id')
      .in('collection_id', collectionIds);

    if (error) throw error;
    const rows = (data ?? []) as { property_id: string }[];
    return [...new Set(rows.map((r) => r.property_id))];
  }

  async createCollection(userId: string, dto: CreateCollectionDto): Promise<DbCollection> {
    const existingCount = await this.supabase.client
      .from('collections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const isDefault = (existingCount.count ?? 0) === 0;

    const { data, error } = await this.supabase.client
      .from('collections')
      .insert({ user_id: userId, name: dto.name, is_default: isDefault })
      .select()
      .single();

    if (error) throw error;
    return data as DbCollection;
  }

  async deleteCollection(userId: string, collectionId: string): Promise<void> {
    const collection = await this.getCollectionOrThrow(userId, collectionId);
    if (collection.is_default) {
      throw new ForbiddenException('Cannot delete default collection');
    }

    const { error } = await this.supabase.client
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getCollectionWithProperties(userId: string, collectionId: string) {
    const collection = await this.getCollectionOrThrow(userId, collectionId);

    const { data: cpRows, error: cpErr } = await this.supabase.client
      .from('collection_properties')
      .select('property_id')
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });

    if (cpErr) throw cpErr;
    const propertyIds = ((cpRows ?? []) as { property_id: string }[]).map((r) => r.property_id);

    if (!propertyIds.length) {
      return { ...collection, properties: [] };
    }

    const { data: properties, error: propErr } = await this.supabase.client
      .from('properties')
      .select(
        'id, listing_type, property_type, status, unit_number, street_number, street_name, suburb, state, postcode, lat, lng, bedrooms, bathrooms, car_spaces, land_size_sqm, price, price_display, is_price_hidden, sale_method, headline, agent_id, agency_id, published_at, created_at',
      )
      .in('id', propertyIds);

    if (propErr) throw propErr;

    // Fetch images for each property
    const { data: images, error: imgErr } = await this.supabase.client
      .from('property_images')
      .select('*')
      .in('property_id', propertyIds)
      .order('sort_order', { ascending: true });

    if (imgErr) throw imgErr;

    const imagesByProperty = ((images ?? []) as Array<{ property_id: string } & Record<string, unknown>>).reduce(
      (acc, img) => {
        const key = img['property_id'] as string;
        if (!acc[key]) acc[key] = [];
        acc[key].push(img);
        return acc;
      },
      {} as Record<string, unknown[]>,
    );

    const enrichedProperties = ((properties ?? []) as Array<{ id: string } & Record<string, unknown>>).map((p) => ({
      ...p,
      images: imagesByProperty[p.id] ?? [],
    }));

    return { ...collection, properties: enrichedProperties };
  }

  async addPropertyToCollection(
    userId: string,
    collectionId: string,
    dto: AddPropertyDto,
  ): Promise<DbCollectionProperty> {
    await this.getCollectionOrThrow(userId, collectionId);

    const { data, error } = await this.supabase.client
      .from('collection_properties')
      .upsert(
        { collection_id: collectionId, property_id: dto.propertyId, notes: dto.notes ?? null },
        { onConflict: 'collection_id,property_id' },
      )
      .select()
      .single();

    if (error) throw error;
    return data as DbCollectionProperty;
  }

  async removePropertyFromCollection(
    userId: string,
    collectionId: string,
    propertyId: string,
  ): Promise<void> {
    await this.getCollectionOrThrow(userId, collectionId);

    const { error } = await this.supabase.client
      .from('collection_properties')
      .delete()
      .eq('collection_id', collectionId)
      .eq('property_id', propertyId);

    if (error) throw error;
  }

  async removePropertyFromAllCollections(userId: string, propertyId: string): Promise<void> {
    const collections = await this.getUserCollections(userId);
    if (!collections.length) return;

    const collectionIds = collections.map((c) => c.id);
    const { error } = await this.supabase.client
      .from('collection_properties')
      .delete()
      .in('collection_id', collectionIds)
      .eq('property_id', propertyId);

    if (error) throw error;
  }

  async getSharedCollection(shareToken: string) {
    const { data: collection, error } = await this.supabase.client
      .from('collections')
      .select('*')
      .eq('share_token', shareToken)
      .single();

    if (error || !collection) throw new NotFoundException('Collection not found');

    return this.getCollectionWithProperties(
      (collection as DbCollection).user_id,
      (collection as DbCollection).id,
    );
  }

  private async getCollectionOrThrow(userId: string, collectionId: string): Promise<DbCollection> {
    const { data, error } = await this.supabase.client
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (error || !data) throw new NotFoundException('Collection not found');
    const collection = data as DbCollection;
    if (collection.user_id !== userId) throw new ForbiddenException();
    return collection;
  }
}
