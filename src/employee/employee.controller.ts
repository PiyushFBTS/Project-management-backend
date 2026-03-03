import { Controller, ForbiddenException, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { ConsultantTypeGuard } from '../auth/guards/consultant-type.guard';
import { ConsultantTypes } from '../auth/decorators/consultant-type.decorator';
import { ConsultantType, Employee } from '../database/entities/employee.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Employee — Self-Service')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile and assigned project' })
  getProfile(@CurrentUser('id') id: number) {
    return this.employeeService.getProfile(id);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List active projects (for dropdown)' })
  getProjects(@TenantId() companyId: number) {
    return this.employeeService.getActiveProjects(companyId);
  }

  @Get('task-types')
  @ApiOperation({ summary: 'List active task types (for dropdown)' })
  getTaskTypes(@TenantId() companyId: number) {
    return this.employeeService.getActiveTaskTypes(companyId);
  }

  @Get('dashboard/personal')
  @ApiOperation({ summary: 'Personal summary: my hours, man-days, fill rate' })
  getPersonalDashboard(@CurrentUser('id') id: number) {
    return this.employeeService.getPersonalDashboard(id);
  }

  // ── PM & Management only ────────────────────────────────────────────────────

  @Get('dashboard/team')
  @UseGuards(ConsultantTypeGuard)
  @ConsultantTypes(ConsultantType.PROJECT_MANAGER, ConsultantType.MANAGEMENT)
  @ApiOperation({ summary: 'Team summary (Project Manager & Management only)' })
  getTeamDashboard(@CurrentUser() employee: Employee) {
    return this.employeeService.getTeamDashboard(employee);
  }

  @Get('reports/team/employee-wise')
  @UseGuards(ConsultantTypeGuard)
  @ConsultantTypes(ConsultantType.PROJECT_MANAGER, ConsultantType.MANAGEMENT)
  @ApiOperation({ summary: 'Employee-wise report for the team (PM & Management only)' })
  @ApiQuery({ name: 'from_date', example: '2026-02-01' })
  @ApiQuery({ name: 'to_date',   example: '2026-02-28' })
  getTeamEmployeeWise(
    @CurrentUser() employee: Employee,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
  ) {
    return this.employeeService.getTeamEmployeeWiseReport(employee, fromDate, toDate);
  }

  @Get('reports/team/project-wise')
  @UseGuards(ConsultantTypeGuard)
  @ConsultantTypes(ConsultantType.PROJECT_MANAGER, ConsultantType.MANAGEMENT)
  @ApiOperation({ summary: 'Project-wise man-days for the team (PM & Management only)' })
  @ApiQuery({ name: 'month', example: '2026-02' })
  getTeamProjectWise(
    @CurrentUser() employee: Employee,
    @Query('month') month: string,
  ) {
    return this.employeeService.getTeamProjectWiseReport(employee, month);
  }

  // ── Self / HR Reports ──────────────────────────────────────────────────────

  @Get('reports/employee-wise')
  @ApiOperation({ summary: 'Employee-wise report: self only, or all if HR' })
  @ApiQuery({ name: 'from_date', example: '2026-02-01' })
  @ApiQuery({ name: 'to_date',   example: '2026-02-28' })
  @ApiQuery({ name: 'consultant_type', required: false })
  getEmployeeWiseReport(
    @CurrentUser() employee: Employee,
    @TenantId() companyId: number,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
    @Query('consultant_type') consultantType?: string,
  ) {
    if (employee.isHr) {
      return this.employeeService.getAllEmployeeWiseReport(companyId, fromDate, toDate, consultantType);
    }
    return this.employeeService.getSelfEmployeeWiseReport(employee.id, companyId, fromDate, toDate);
  }

  @Get('reports/project-wise')
  @ApiOperation({ summary: 'Project-wise report (HR only)' })
  @ApiQuery({ name: 'month', example: '2026-02' })
  getProjectWiseReport(
    @CurrentUser() employee: Employee,
    @TenantId() companyId: number,
    @Query('month') month: string,
  ) {
    if (!employee.isHr) throw new ForbiddenException('Only HR employees can access this report');
    return this.employeeService.getAllProjectWiseReport(companyId, month);
  }

  @Get('reports/daily-fill')
  @ApiOperation({ summary: 'Daily fill compliance report (HR only)' })
  @ApiQuery({ name: 'date', example: '2026-02-27' })
  getDailyFillReport(
    @CurrentUser() employee: Employee,
    @TenantId() companyId: number,
    @Query('date') date: string,
  ) {
    if (!employee.isHr) throw new ForbiddenException('Only HR employees can access this report');
    return this.employeeService.getAllDailyFillReport(companyId, date);
  }
}
