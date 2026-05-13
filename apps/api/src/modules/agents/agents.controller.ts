import { Controller, Get, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  listAgents(
    @Query('page') page?: string,
    @Query('suburb') suburb?: string,
  ) {
    return this.agentsService.listAgents({
      page: page ? parseInt(page, 10) : undefined,
      suburb: suburb || undefined,
    });
  }
}
