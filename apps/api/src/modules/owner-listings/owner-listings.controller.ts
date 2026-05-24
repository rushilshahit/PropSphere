import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createOwnerListingSchema,
  type CreateOwnerListingDto,
} from './dto/create-owner-listing.dto';
import {
  createInspectionsSchema,
  type CreateInspectionsDto,
} from './dto/create-inspections.dto';
import {
  updateOwnerListingStatusSchema,
  type UpdateOwnerListingStatusDto,
} from './dto/update-owner-listing-status.dto';
import {
  updateOwnerListingSchema,
  type UpdateOwnerListingDto,
} from './dto/update-owner-listing.dto';
import { OwnerListingsService } from './owner-listings.service';

interface AuthUser {
  id: string;
}

@Controller('owner-listings')
@UseGuards(AuthGuard)
export class OwnerListingsController {
  constructor(private readonly ownerListingsService: OwnerListingsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createOwnerListingSchema)) dto: CreateOwnerListingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ownerListingsService.create(dto, user.id);
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.ownerListingsService.findMine(user.id);
  }

  @Get('me/stats')
  getDashboardStats(@CurrentUser() user: AuthUser) {
    return this.ownerListingsService.getDashboardStats(user.id);
  }

  @Get('active-count')
  getActiveCount(@CurrentUser() user: AuthUser) {
    return this.ownerListingsService.getActiveCount(user.id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ownerListingsService.getStats(id, user.id);
  }

  @Get(':id/enquiries')
  getEnquiries(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ownerListingsService.getEnquiries(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOwnerListingSchema)) dto: UpdateOwnerListingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ownerListingsService.update(id, dto, user.id);
  }

  @Post(':id/inspections')
  createInspections(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createInspectionsSchema)) dto: CreateInspectionsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ownerListingsService.createInspections(id, dto, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOwnerListingStatusSchema)) dto: UpdateOwnerListingStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ownerListingsService.updateStatus(id, dto, user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ownerListingsService.delete(id, user.id);
  }
}
