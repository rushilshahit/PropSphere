import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { trackRecentlyViewedSchema, type TrackRecentlyViewedDto } from './dto/users.dto';
import { UsersService } from './users.service';

interface AuthRequest {
  user: { id: string };
}

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Get('me/enquiries')
  getMyEnquiries(@Req() req: AuthRequest) {
    return this.usersService.getMyEnquiries(req.user.id);
  }
}
