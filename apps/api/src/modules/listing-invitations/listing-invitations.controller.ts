import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createInvitationSchema, type CreateInvitationDto } from './dto/create-invitation.dto';
import { ListingInvitationsService } from './listing-invitations.service';

interface AuthUser {
  id: string;
}

@Controller('listing-invitations')
export class ListingInvitationsController {
  constructor(private readonly service: ListingInvitationsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body(new ZodValidationPipe(createInvitationSchema)) dto: CreateInvitationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user.id);
  }

  // Must be declared before :token routes to avoid param capture
  @Get('property/:propertyId')
  @UseGuards(AuthGuard)
  findPending(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findPendingByProperty(propertyId, user.id);
  }

  @Get('preview/:token')
  getPreview(@Param('token') token: string) {
    return this.service.preview(token);
  }

  @Post(':token/accept')
  accept(@Param('token') token: string) {
    return this.service.accept(token);
  }

  @Post(':token/decline')
  decline(@Param('token') token: string) {
    return this.service.decline(token);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.cancel(id, user.id);
  }
}
