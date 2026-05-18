import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OffersService } from './offers.service';

interface AuthUser {
  id: string;
}

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offersService.updateStatus(id, status, user.id);
  }
}
