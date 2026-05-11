import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

export interface SuburbSuggestion {
  id: string;
  name: string;
  state: string;
  postcode: string;
  lat: number | null;
  lng: number | null;
}

@Injectable()
export class SuburbsService {
  constructor(private readonly supabase: SupabaseService) {}

  async autocomplete(query: string): Promise<SuburbSuggestion[]> {
    const term = `%${query}%`;
    const { data, error } = await this.supabase.client
      .from('suburbs')
      .select('id, name, state, postcode, lat, lng')
      .or(`name.ilike.${term},postcode.ilike.${term}`)
      .order('name')
      .limit(8);

    if (error) throw error;
    return data ?? [];
  }
}
