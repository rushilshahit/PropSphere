import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { EnquiriesController } from './enquiries.controller';
import { EnquiriesService } from './enquiries.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EnquiriesController],
  providers: [EnquiriesService, SupabaseService],
})
export class EnquiriesModule {}
