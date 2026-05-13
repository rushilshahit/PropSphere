import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SupabaseService } from '../../database/supabase.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [MulterModule.register({ storage: undefined })],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, SupabaseService],
})
export class AdminModule {}
