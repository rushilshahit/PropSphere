import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CollectionsController, SharedCollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  controllers: [CollectionsController, SharedCollectionsController],
  providers: [CollectionsService, SupabaseService, AuthGuard],
})
export class CollectionsModule {}
