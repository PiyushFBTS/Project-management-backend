import {
  Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Admin — Reports')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ── Employee-wise ──────────────────────────────────────────────────────────

  @Get('employee-wise')
  @ApiOperation({ summary: 'Employee-wise time sheet report' })
  @ApiQuery({ name: 'from_date', example: '2026-02-01' })
  @ApiQuery({ name: 'to_date',   example: '2026-02-28' })
  @ApiQuery({ name: 'consultant_type', required: false })
  getEmployeeWise(
    @TenantId() companyId: number,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
    @Query('consultant_type') consultantType?: string,
  ) {
    return this.reportsService.getEmployeeWiseReport(companyId, fromDate, toDate, consultantType);
  }

  @Get('employee/:id/detail')
  @ApiOperation({ summary: 'Detailed report for a single employee' })
  @ApiQuery({ name: 'from_date', example: '2026-02-01' })
  @ApiQuery({ name: 'to_date',   example: '2026-02-28' })
  getEmployeeDetail(
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
  ) {
    return this.reportsService.getEmployeeDetail(companyId, id, fromDate, toDate);
  }

  // ── Project-wise ───────────────────────────────────────────────────────────

  @Get('project-wise')
  @ApiOperation({ summary: 'Project-wise man-day breakdown report' })
  @ApiQuery({ name: 'month', example: '2026-02' })
  getProjectWise(@TenantId() companyId: number, @Query('month') month: string) {
    return this.reportsService.getProjectWiseReport(companyId, month);
  }

  @Get('project/:id/detail')
  @ApiOperation({ summary: 'Man-days for a single project by consultant type' })
  @ApiQuery({ name: 'month', example: '2026-02' })
  getProjectDetail(
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('month') month: string,
  ) {
    return this.reportsService.getProjectDetail(companyId, id, month);
  }

  // ── Daily fill compliance ──────────────────────────────────────────────────

  @Get('daily-fill')
  @ApiOperation({ summary: 'Fill compliance: who filled / did not fill on a date' })
  @ApiQuery({ name: 'date', example: '2026-02-24' })
  getDailyFill(@TenantId() companyId: number, @Query('date') date: string) {
    return this.reportsService.getDailyFillReport(companyId, date);
  }

  // ── Last filled report ────────────────────────────────────────────────────

  @Get('last-filled')
  @ApiOperation({ summary: 'Last submitted task sheet date per employee' })
  getLastFilled(@TenantId() companyId: number) {
    return this.reportsService.getLastFilledReport(companyId);
  }

  // ── Exports ────────────────────────────────────────────────────────────────

  @Get('export/employee-wise')
  @ApiOperation({ summary: 'Export employee-wise report to Excel' })
  @ApiQuery({ name: 'from_date', example: '2026-02-01' })
  @ApiQuery({ name: 'to_date',   example: '2026-02-28' })
  async exportEmployeeWise(
    @TenantId() companyId: number,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportEmployeeWise(companyId, fromDate, toDate);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="employee-report-${fromDate}-${toDate}.xlsx"`);
    res.send(buffer);
  }

  @Get('export/project-wise')
  @ApiOperation({ summary: 'Export project-wise report to Excel' })
  @ApiQuery({ name: 'month', example: '2026-02' })
  async exportProjectWise(@TenantId() companyId: number, @Query('month') month: string, @Res() res: Response) {
    const buffer = await this.reportsService.exportProjectWise(companyId, month);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="project-report-${month}.xlsx"`);
    res.send(buffer);
  }
}
