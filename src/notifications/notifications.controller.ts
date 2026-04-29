import {
  Controller, Get, Patch, Delete, Param, ParseIntPipe, Query, UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAdminGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/notifications?limit=30 */
  @Get()
  async findAll(
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(
      companyId,
      limit ? parseInt(limit, 10) : 30,
      adminId,
    );
  }

  /** PATCH /api/notifications/read-all */
  @Patch('read-all')
  markAllRead(@TenantId() companyId: number) {
    return this.notificationsService.markAllRead(companyId);
  }

  /** DELETE /api/notifications/clear-all */
  @Delete('clear-all')
  clearAll(@TenantId() companyId: number) {
    return this.notificationsService.clearAll(companyId);
  }

  /** PATCH /api/notifications/:id/read */
  @Patch(':id/read')
  markRead(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markRead(id, companyId);
  }

  /** DELETE /api/notifications/:id */
  @Delete(':id')
  remove(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(id, companyId);
  }
}
