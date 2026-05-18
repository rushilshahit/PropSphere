import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, SupabaseService, AuthGuard],
})
export class UsersModule {}
