import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { AgenciesService } from './agencies.service';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get('search')
  search(@Query('q') q?: string) {
    if (!q || q.trim().length < 2) throw new BadRequestException('q must be at least 2 characters');
    return this.agenciesService.search(q.trim());
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.agenciesService.findBySlug(slug);
  }
}
