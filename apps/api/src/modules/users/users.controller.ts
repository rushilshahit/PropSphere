import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  trackRecentlyViewedSchema,
  updateProfileSchema,
  type TrackRecentlyViewedDto,
  type UpdateProfileDto,
} from './dto/users.dto';
import { UsersService } from './users.service';

interface AuthRequest {
  user: { id: string; email: string };
}

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMyProfile(@Req() req: AuthRequest) {
    return this.usersService.getMyProfile(req.user.id);
  }

  @Patch('me')
  updateProfile(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, req.user.email, dto);
  }

  @Post('recently-viewed')
  trackRecentlyViewed(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(trackRecentlyViewedSchema)) dto: TrackRecentlyViewedDto,
  ) {
    return this.usersService.trackRecentlyViewed(req.user.id, dto);
  }

  @Get('recently-viewed')
  getRecentlyViewed(@Req() req: AuthRequest) {
    return this.usersService.getRecentlyViewed(req.user.id);
  }

  @Delete('recently-viewed')
  clearRecentlyViewed(@Req() req: AuthRequest) {
    return this.usersService.clearRecentlyViewed(req.user.id);
  }

  @Get('me/enquiries')
  getMyEnquiries(@Req() req: AuthRequest) {
    return this.usersService.getMyEnquiries(req.user.id);
  }

  @Get('me/offers')
  getMyOffers(@Req() req: AuthRequest) {
    return this.usersService.getMyOffers(req.user.id);
  }
}
