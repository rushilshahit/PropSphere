import { Controller, Get, Param, Query } from '@nestjs/common';
import { SuburbsService } from './suburbs.service';

@Controller('suburbs')
export class SuburbsController {
  constructor(private readonly suburbsService: SuburbsService) {}

  @Get('autocomplete')
  autocomplete(@Query('q') q: string) {
    if (!q || q.length < 2) return [];
    return this.suburbsService.autocomplete(q);
  }

  // Specific two-segment routes must come before the generic :state/:slug catch-all
  @Get(':id/price-history')
  getPriceHistory(@Param('id') id: string) {
    return this.suburbsService.getPriceHistory(id);
  }

  @Get(':id/sold-stats')
  getSoldStats(@Param('id') id: string) {
    return this.suburbsService.getSoldStats(id);
  }

  @Get(':state/:slug')
  findByStateSlug(@Param('state') state: string, @Param('slug') slug: string) {
    return this.suburbsService.findByStateSlug(state, slug);
  }
}
