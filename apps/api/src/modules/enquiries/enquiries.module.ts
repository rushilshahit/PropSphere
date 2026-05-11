import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { EnquiriesController } from './enquiries.controller';
import { EnquiriesService } from './enquiries.service';

@Module({
  controllers: [EnquiriesController],
  providers: [EnquiriesService, SupabaseService],
})
export class EnquiriesModule {}
