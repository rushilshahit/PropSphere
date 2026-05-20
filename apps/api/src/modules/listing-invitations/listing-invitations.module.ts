import { Module } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ListingInvitationsController } from './listing-invitations.controller';
import { ListingInvitationsService } from './listing-invitations.service';

@Module({
  controllers: [ListingInvitationsController],
  providers: [ListingInvitationsService, SupabaseService, AuthGuard],
})
export class ListingInvitationsModule {}
