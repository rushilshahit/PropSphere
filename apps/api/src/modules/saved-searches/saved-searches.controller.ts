import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateSavedSearchSchema,
  UpdateSavedSearchSchema,
  type CreateSavedSearchDto,
  type UpdateSavedSearchDto,
} from './dto/saved-searches.dto';
import { SavedSearchesService } from './saved-searches.service';

interface AuthRequest {
  user: { id: string };
}

@Controller('saved-searches')
@UseGuards(AuthGuard)
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.savedSearchesService.findAll(req.user.id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateSavedSearchSchema))
  create(@Req() req: AuthRequest, @Body() dto: CreateSavedSearchDto) {
    return this.savedSearchesService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateSavedSearchSchema))
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
  ) {
    return this.savedSearchesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.savedSearchesService.remove(req.user.id, id);
    return { success: true };
  }
}
