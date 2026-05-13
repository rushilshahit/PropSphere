import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, SupabaseService],
})
export class AgentsModule {}
