import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AlertsModule } from '../alerts/alerts.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [AlertsModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, SupabaseService],
})
export class PropertiesModule {}
