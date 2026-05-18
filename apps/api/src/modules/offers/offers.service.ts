import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class OffersService {
  constructor(private readonly supabase: SupabaseService) {}

  async updateStatus(
    id: string,
    status: string,
    userId: string,
  ): Promise<{ id: string; status: string }> {
    const { data: offer, error: findError } = await this.supabase.client
      .from('offers')
      .select('id, agent_id')
      .eq('id', id)
      .single();

    if (findError || !offer) throw new NotFoundException(`Offer ${id} not found`);

    const { data: agentRow } = await this.supabase.client
      .from('agents')
      .select('id')
      .eq('profile_id', userId)
      .single();

    const offerRow = offer as { id: string; agent_id: string };
    const agent = agentRow as { id: string } | null;

    if (!agent || offerRow.agent_id !== agent.id) {
      throw new UnauthorizedException();
    }

    const { data, error } = await this.supabase.client
      .from('offers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) throw error;
    return data as { id: string; status: string };
  }
}
