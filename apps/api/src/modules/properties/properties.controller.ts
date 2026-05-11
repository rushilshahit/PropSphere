import { Controller, Get, Param, Patch, Query, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { searchPropertiesSchema, type SearchPropertiesDto } from './dto/search-properties.dto';
import { boundingBoxSchema, type BoundingBoxDto } from './dto/bounding-box.dto';
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

  @Get('similar/:id')
  getSimilar(@Param('id') id: string) {
    return this.propertiesService.getSimilar(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id/view-count')
  incrementViewCount(@Param('id') id: string) {
    return this.propertiesService.incrementViewCount(id);
  }
}
