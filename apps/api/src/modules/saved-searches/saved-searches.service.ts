import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateSavedSearchDto, UpdateSavedSearchDto } from './dto/saved-searches.dto';

export interface DbSavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  alert_freq: string;
  alert_enabled: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class SavedSearchesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(userId: string): Promise<DbSavedSearch[]> {
    const { data, error } = await this.supabase.client
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as DbSavedSearch[];
  }

  async create(userId: string, dto: CreateSavedSearchDto): Promise<DbSavedSearch> {
    const { data, error } = await this.supabase.client
      .from('saved_searches')
      .insert({
        user_id: userId,
        name: dto.name,
        filters: dto.filters,
        alert_freq: dto.alertFreq,
        alert_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbSavedSearch;
  }

  async update(userId: string, id: string, dto: UpdateSavedSearchDto): Promise<DbSavedSearch> {
    await this.getOrThrow(userId, id);

    const patch: Record<string, unknown> = {};
    if (dto.alertEnabled !== undefined) patch['alert_enabled'] = dto.alertEnabled;
    if (dto.alertFreq !== undefined) patch['alert_freq'] = dto.alertFreq;

    const { data, error } = await this.supabase.client
      .from('saved_searches')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as DbSavedSearch;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOrThrow(userId, id);

    const { error } = await this.supabase.client
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async findAllEnabled(): Promise<DbSavedSearch[]> {
    const { data, error } = await this.supabase.client
      .from('saved_searches')
      .select('*')
      .eq('alert_enabled', true);

    if (error) throw error;
    return (data ?? []) as DbSavedSearch[];
  }

  private async getOrThrow(userId: string, id: string): Promise<DbSavedSearch> {
    const { data, error } = await this.supabase.client
      .from('saved_searches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('Saved search not found');
    const row = data as DbSavedSearch;
    if (row.user_id !== userId) throw new ForbiddenException();
    return row;
  }
}
