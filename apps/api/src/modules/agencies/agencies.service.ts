import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

export interface AgencySummary {
  id: string;
  name: string;
  logo_url: string | null;
  suburb: string;
  state: string;
}

@Injectable()
export class AgenciesService {
  constructor(private readonly supabase: SupabaseService) {}

  async search(q: string): Promise<AgencySummary[]> {
    const { data, error } = await this.supabase.client
      .from('agencies')
      .select('id, name, logo_url, suburb, state')
      .ilike('name', `%${q}%`)
      .limit(8);

    if (error) throw error;
    return (data ?? []) as AgencySummary[];
  }
}
