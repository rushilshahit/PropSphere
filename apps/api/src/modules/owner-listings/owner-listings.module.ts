import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { OwnerListingsController } from './owner-listings.controller';
import { OwnerListingsService } from './owner-listings.service';

@Module({
  controllers: [OwnerListingsController],
  providers: [OwnerListingsService, SupabaseService],
})
export class OwnerListingsModule {}
