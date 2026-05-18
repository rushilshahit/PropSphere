import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  addPropertySchema,
  createCollectionSchema,
  updateNoteSchema,
  type AddPropertyDto,
  type CreateCollectionDto,
  type UpdateNoteDto,
} from './dto/collections.dto';
import { CollectionsService } from './collections.service';

interface AuthRequest {
  user: { id: string };
}

@Controller('collections')
@UseGuards(AuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  getCollections(@Req() req: AuthRequest) {
    return this.collectionsService.getUserCollections(req.user.id);
  }

  // Literal-segment routes must precede dynamic :id routes to avoid mismatches
  @Get('saved-ids')
  async getSavedIds(@Req() req: AuthRequest) {
    return this.collectionsService.getSavedPropertyIds(req.user.id);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createCollectionSchema))
  createCollection(@Req() req: AuthRequest, @Body() dto: CreateCollectionDto) {
    return this.collectionsService.createCollection(req.user.id, dto);
  }

  // DELETE /collections/properties/:propertyId — must come before DELETE /collections/:id
  @Delete('properties/:propertyId')
  async removePropertyFromAll(
    @Req() req: AuthRequest,
    @Param('propertyId') propertyId: string,
  ) {
    await this.collectionsService.removePropertyFromAllCollections(req.user.id, propertyId);
    return { success: true };
  }

  @Delete(':id')
  async deleteCollection(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.collectionsService.deleteCollection(req.user.id, id);
    return { success: true };
  }

  @Get(':id/properties')
  getCollectionProperties(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.collectionsService.getCollectionWithProperties(req.user.id, id);
  }

  @Post(':id/properties')
  addProperty(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addPropertySchema)) dto: AddPropertyDto,
  ) {
    return this.collectionsService.addPropertyToCollection(req.user.id, id, dto);
  }

  @Patch(':id/properties/:propertyId/notes')
  async updateNote(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('propertyId') propertyId: string,
    @Body(new ZodValidationPipe(updateNoteSchema)) dto: UpdateNoteDto,
  ) {
    await this.collectionsService.updatePropertyNote(req.user.id, id, propertyId, dto);
    return { success: true };
  }

  @Delete(':id/properties/:propertyId')
  async removeProperty(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('propertyId') propertyId: string,
  ) {
    await this.collectionsService.removePropertyFromCollection(req.user.id, id, propertyId);
    return { success: true };
  }
}

@Controller('collections/shared')
export class SharedCollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get(':token')
  getShared(@Param('token') token: string) {
    return this.collectionsService.getSharedCollection(token);
  }
}
