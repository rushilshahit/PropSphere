import { Controller, Get, Param } from '@nestjs/common';
import { AgenciesService } from './agencies.service';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.agenciesService.findBySlug(slug);
  }
}
