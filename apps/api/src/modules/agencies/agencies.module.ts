import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';

@Module({
  controllers: [AgenciesController],
  providers: [AgenciesService, SupabaseService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
