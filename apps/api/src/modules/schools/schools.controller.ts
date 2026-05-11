import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SchoolsService } from './schools.service';

const nearbySchoolsSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius: z.coerce.number().min(0.1).max(50).default(5),
});

type NearbySchoolsQuery = z.infer<typeof nearbySchoolsSchema>;

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('nearby')
  @UsePipes(new ZodValidationPipe(nearbySchoolsSchema))
  findNearby(@Query() query: NearbySchoolsQuery) {
    return this.schoolsService.findNearby(query);
  }
}
