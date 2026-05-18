import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';

@Module({
  controllers: [OffersController],
  providers: [OffersService, SupabaseService, AuthGuard],
})
export class OffersModule {}
