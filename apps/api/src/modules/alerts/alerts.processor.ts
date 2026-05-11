import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SavedSearchesService } from '../saved-searches/saved-searches.service';
import type { NewListingJobData, PriceDropJobData } from './alerts.service';

interface DbProperty {
  id: string;
  listing_type: string;
  property_type: string;
  suburb: string;
  state: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  car_spaces: number | null;
  headline: string;
  street_number: string;
  street_name: string;
}

interface DbPriceAlert {
  user_id: string;
  price_at_save: number;
}

@Processor('alerts')
export class AlertsProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertsProcessor.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly savedSearchesService: SavedSearchesService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'new-listing') {
      await this.handleNewListing(job.data as NewListingJobData);
    } else if (job.name === 'price-drop') {
      await this.handlePriceDrop(job.data as PriceDropJobData);
    }
  }

  private async handleNewListing({ propertyId }: NewListingJobData): Promise<void> {
    const { data: property } = await this.supabase.client
      .from('properties')
      .select('id, listing_type, property_type, suburb, state, price, bedrooms, bathrooms, car_spaces, headline, street_number, street_name')
      .eq('id', propertyId)
      .single();

    if (!property) return;

    const prop = property as DbProperty;
    const savedSearches = await this.savedSearchesService.findAllEnabled();

    const matching = savedSearches.filter((ss) => {
      const f = ss.filters as Record<string, unknown>;
      if (f['listingType'] && f['listingType'] !== prop.listing_type) return false;
      if (f['query']) {
        const q = String(f['query']).toLowerCase();
        if (
          !prop.suburb.toLowerCase().includes(q) &&
          !prop.state.toLowerCase().includes(q)
        ) return false;
      }
      if (f['priceMin'] !== undefined && prop.price !== null && prop.price < Number(f['priceMin'])) return false;
      if (f['priceMax'] !== undefined && prop.price !== null && prop.price > Number(f['priceMax'])) return false;
      if (f['bedrooms'] !== undefined && prop.bedrooms !== null && prop.bedrooms < Number(f['bedrooms'])) return false;
      if (Array.isArray(f['propertyTypes']) && (f['propertyTypes'] as string[]).length > 0) {
        if (!(f['propertyTypes'] as string[]).includes(prop.property_type)) return false;
      }
      return true;
    });

    await Promise.all(
      matching.map((ss) =>
        this.notificationsService.dispatch(ss.user_id, {
          type: 'new_listing',
          title: 'New listing matches your search',
          body: `${prop.headline} in ${prop.suburb}`,
          data: { url: `/${prop.listing_type}/${propertyId}` },
        }),
      ),
    );

    this.logger.log(`new-listing job: matched ${matching.length} saved searches for property ${propertyId}`);
  }

  private async handlePriceDrop({ propertyId, newPrice }: PriceDropJobData): Promise<void> {
    const { data: alerts } = await this.supabase.client
      .from('price_alerts')
      .select('user_id, price_at_save')
      .eq('property_id', propertyId);

    if (!alerts?.length) return;

    const { data: property } = await this.supabase.client
      .from('properties')
      .select('headline, suburb, listing_type')
      .eq('id', propertyId)
      .single();

    const prop = property as { headline: string; suburb: string; listing_type: string } | null;
    if (!prop) return;

    const eligible = (alerts as DbPriceAlert[]).filter((a) => a.price_at_save > newPrice);

    await Promise.all(
      eligible.map((a) =>
        this.notificationsService.dispatch(a.user_id, {
          type: 'price_drop',
          title: 'Price drop on a saved property',
          body: `${prop.headline} in ${prop.suburb} has dropped in price`,
          data: { url: `/${prop.listing_type}/${propertyId}` },
        }),
      ),
    );

    this.logger.log(`price-drop job: notified ${eligible.length} users for property ${propertyId}`);
  }
}
