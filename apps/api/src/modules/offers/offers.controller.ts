import { Body, Controller, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createOfferSchema, type CreateOfferDto } from './dto/create-offer.dto';
import { OffersService } from './offers.service';

interface AuthUser {
  id: string;
}

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createOfferSchema)) dto: CreateOfferDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.offersService.create(dto, auth);
  }

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
