import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService, SupabaseService, AuthGuard, RolesGuard],
})
export class AgentsModule {}
