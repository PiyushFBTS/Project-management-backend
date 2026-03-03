import {
  Controller, Get, Patch, Delete, Param, ParseIntPipe, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Employee — Notifications')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/notifications')
export class NotificationsEmployeeController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/employee/notifications?limit=30 */
  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  async findAll(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findForEmployee(
      employeeId, companyId, limit ? parseInt(limit, 10) : 30,
    );
  }

  /** PATCH /api/employee/notifications/read-all */
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllRead(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
  ) {
    return this.notificationsService.markAllReadForEmployee(employeeId, companyId);
  }

  /** DELETE /api/employee/notifications/clear-all */
  @Delete('clear-all')
  @ApiOperation({ summary: 'Clear all my notifications' })
  clearAll(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
  ) {
    return this.notificationsService.clearAllForEmployee(employeeId, companyId);
  }

  /** PATCH /api/employee/notifications/:id/read */
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markReadForEmployee(id, employeeId, companyId);
  }

  /** DELETE /api/employee/notifications/:id */
  @Delete(':id')
  @ApiOperation({ summary: 'Dismiss a notification' })
  remove(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.removeForEmployee(id, employeeId, companyId);
  }
}
