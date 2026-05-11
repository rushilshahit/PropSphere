import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { SuburbsController } from './suburbs.controller';
import { SuburbsService } from './suburbs.service';

@Module({
  controllers: [SuburbsController],
  providers: [SuburbsService, SupabaseService],
})
export class SuburbsModule {}
