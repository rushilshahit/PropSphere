import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AgentsService } from './agents.service';
import { agentApplicationSchema, type AgentApplicationDto } from './dto/agent-application.dto';

interface AuthUser {
  id: string;
}

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  // Protected "me" routes must come before any dynamic :id segments
  @Get('me/stats')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('agent')
  async getMyStats(@CurrentUser() user: AuthUser) {
    const agent = await this.agentsService.findByProfileId(user.id);
    return this.agentsService.getMyStats(agent.id);
  }

  @Get('me/listings')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('agent')
  async getMyListings(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ) {
    const agent = await this.agentsService.findByProfileId(user.id);
    return this.agentsService.getMyListings(agent.id, status);
  }

  @Get('me/enquiries')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('agent')
  async getMyEnquiries(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
  ) {
    const agent = await this.agentsService.findByProfileId(user.id);
    return this.agentsService.getMyEnquiries(agent.id, page ? parseInt(page, 10) : 1);
  }

  @Get('me/offers')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('agent')
  async getMyOffers(@CurrentUser() user: AuthUser) {
    const agent = await this.agentsService.findByProfileId(user.id);
    return this.agentsService.getMyOffers(agent.id);
  }

  @Post('apply')
  @UseGuards(AuthGuard)
  applyAsAgent(
    @Body(new ZodValidationPipe(agentApplicationSchema)) dto: AgentApplicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.agentsService.apply(dto, user.id);
  }

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
