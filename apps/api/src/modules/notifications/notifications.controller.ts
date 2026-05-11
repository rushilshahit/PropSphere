import { Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { NotificationsService } from './notifications.service';

interface AuthRequest {
  user: { id: string };
}

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Req() req: AuthRequest) {
    const data = await this.notificationsService.findAll(req.user.id);
    return { data };
  }

  @Patch(':id/read')
  async markRead(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.notificationsService.markRead(req.user.id, id);
    return { success: true };
  }

  @Post('read-all')
  async markAllRead(@Req() req: AuthRequest) {
    await this.notificationsService.markAllRead(req.user.id);
    return { success: true };
  }
}
