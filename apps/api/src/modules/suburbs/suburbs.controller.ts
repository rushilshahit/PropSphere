import { Controller, Get, Query } from '@nestjs/common';
import { SuburbsService } from './suburbs.service';

@Controller('suburbs')
export class SuburbsController {
  constructor(private readonly suburbsService: SuburbsService) {}

  @Get('autocomplete')
  autocomplete(@Query('q') q: string) {
    if (!q || q.length < 2) return [];
    return this.suburbsService.autocomplete(q);
  }
}
