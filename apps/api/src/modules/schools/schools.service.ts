import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

interface NearbySchoolsParams {
  lat: number;
  lng: number;
  radius: number;
}

@Injectable()
export class SchoolsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findNearby({ lat, lng, radius }: NearbySchoolsParams) {
    const { data, error } = await this.supabase.client.rpc('search_schools_radius', {
      lat,
      lng,
      radius_km: radius,
    });

    if (error) throw error;
    return data ?? [];
  }
}
