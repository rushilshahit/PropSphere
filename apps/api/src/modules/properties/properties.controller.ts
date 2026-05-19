import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { searchPropertiesSchema, type SearchPropertiesDto } from './dto/search-properties.dto';
import { boundingBoxSchema, type BoundingBoxDto } from './dto/bounding-box.dto';
import { batchPropertiesSchema, type BatchPropertiesDto } from './dto/batch-properties.dto';
import { updateStatusSchema, type UpdateStatusDto } from './dto/update-status.dto';
import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('search')
  @UsePipes(new ZodValidationPipe(searchPropertiesSchema))
  search(@Query() dto: SearchPropertiesDto) {
    return this.propertiesService.search(dto);
  }

  @Get('map')
  @UsePipes(new ZodValidationPipe(boundingBoxSchema))
  getMapPins(@Query() dto: BoundingBoxDto) {
    return this.propertiesService.getMapPins(dto);
  }

  // POST before :id to avoid route collision
  @Post('batch')
  batchByIds(@Body(new ZodValidationPipe(batchPropertiesSchema)) dto: BatchPropertiesDto) {
    return this.propertiesService.batchByIds(dto.ids);
  }

  @Get('similar/:id')
  getSimilar(@Param('id') id: string) {
    return this.propertiesService.getSimilar(id);
  }

  @Get(':id/price-history')
  getPriceHistory(@Param('id') id: string) {
    return this.propertiesService.getPriceHistory(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStatusSchema)) dto: UpdateStatusDto,
  ) {
    return this.propertiesService.updateStatus(id, dto);
  }

  @Patch(':id/view-count')
  incrementViewCount(@Param('id') id: string) {
    return this.propertiesService.incrementViewCount(id);
  }
}
