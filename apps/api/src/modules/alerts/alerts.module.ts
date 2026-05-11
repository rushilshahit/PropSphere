import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SupabaseService } from '../../database/supabase.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SavedSearchesModule } from '../saved-searches/saved-searches.module';
import { AlertsProcessor } from './alerts.processor';
import { AlertsService } from './alerts.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'alerts' }),
    NotificationsModule,
    SavedSearchesModule,
  ],
  providers: [AlertsService, AlertsProcessor, SupabaseService],
  exports: [AlertsService],
})
export class AlertsModule {}
