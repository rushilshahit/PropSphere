import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  controllers: [HomeController],
  providers: [HomeService, SupabaseService],
})
export class HomeModule {}
