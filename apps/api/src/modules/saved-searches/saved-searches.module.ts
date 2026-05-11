import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesService } from './saved-searches.service';

@Module({
  controllers: [SavedSearchesController],
  providers: [SavedSearchesService, SupabaseService],
  exports: [SavedSearchesService],
})
export class SavedSearchesModule {}
