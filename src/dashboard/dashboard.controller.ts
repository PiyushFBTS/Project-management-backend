import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Admin — Dashboard')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'KPI cards: fill rate, total man-days, employee counts' })
  @ApiQuery({ name: 'month', required: false, example: '2026-02' })
  getSummary(@TenantId() companyId: number, @Query('month') month?: string) {
    return this.dashboardService.getSummary(companyId, month);
  }

  @Get('man-days-by-type')
  @ApiOperation({ summary: 'Man-days grouped by consultant type (pie/bar chart)' })
  @ApiQuery({ name: 'month', required: false, example: '2026-02' })
  getManDaysByType(@TenantId() companyId: number, @Query('month') month?: string) {
    return this.dashboardService.getManDaysByType(companyId, month);
  }

  @Get('man-days-by-project')
  @ApiOperation({ summary: 'Man-days grouped by project (bar chart)' })
  @ApiQuery({ name: 'month', required: false, example: '2026-02' })
  getManDaysByProject(@TenantId() companyId: number, @Query('month') month?: string) {
    return this.dashboardService.getManDaysByProject(companyId, month);
  }

  @Get('fill-rate-trend')
  @ApiOperation({ summary: 'Daily fill rate over the last N days (line chart)' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getFillRateTrend(@TenantId() companyId: number, @Query('days') days?: number) {
    return this.dashboardService.getFillRateTrend(companyId, days ? Number(days) : 30);
  }

  @Get('top-employees')
  @ApiOperation({ summary: 'Top 10 employees by hours this month (bar chart)' })
  @ApiQuery({ name: 'month', required: false, example: '2026-02' })
  getTopEmployees(@TenantId() companyId: number, @Query('month') month?: string) {
    return this.dashboardService.getTopEmployeesByHours(companyId, month);
  }
}
