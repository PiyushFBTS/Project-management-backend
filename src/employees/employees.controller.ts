import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { FilterEmployeeDto } from './dto/filter-employee.dto';
import { AssignProjectDto } from './dto/assign-project.dto';
import { UpdateEmployeeSelfDto } from './dto/update-employee-self.dto';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { ConsultantType } from '../database/entities/employee.entity';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/** Read-only endpoints for employees to view colleagues in their company */
@ApiTags('Employee — Colleagues')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/employees')
export class EmployeeColleaguesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List colleagues in the same company (read-only)' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterEmployeeDto) {
    return this.employeesService.findAll(companyId, filter);
  }

  @Get('upcoming-events')
  @ApiOperation({ summary: 'Upcoming birthdays and work anniversaries' })
  getUpcomingEvents(@TenantId() companyId: number, @Query('days') days?: string) {
    return this.employeesService.getUpcomingEvents(companyId, days ? Number(days) : 30);
  }

  @Get('today-events')
  @ApiOperation({ summary: "Today's birthdays and work anniversaries" })
  getTodayEvents(@TenantId() companyId: number) {
    return this.employeesService.getTodayEvents(companyId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile (name, phone, date of birth)' })
  updateSelf(
    @TenantId() companyId: number,
    @CurrentUser('id') employeeId: number,
    @Body() dto: UpdateEmployeeSelfDto,
  ) {
    return this.employeesService.updateSelf(employeeId, companyId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a colleague by ID (read-only)' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id, companyId);
  }
}

@ApiTags('Employees')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List all employees (paginated, filterable)' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterEmployeeDto) {
    return this.employeesService.findAll(companyId, filter);
  }

  @Get('upcoming-events')
  @ApiOperation({ summary: 'Upcoming birthdays and work anniversaries' })
  getUpcomingEvents(@TenantId() companyId: number, @Query('days') days?: string) {
    return this.employeesService.getUpcomingEvents(companyId, days ? Number(days) : 30);
  }

  @Get('today-events')
  @ApiOperation({ summary: "Today's birthdays and work anniversaries" })
  getTodayEvents(@TenantId() companyId: number) {
    return this.employeesService.getTodayEvents(companyId);
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: 'Filter employees by consultant type' })
  findByType(@TenantId() companyId: number, @Param('type') type: ConsultantType) {
    return this.employeesService.findByConsultantType(companyId, type);
  }

  @Get('admin/:id')
  @ApiOperation({ summary: 'Get admin user by ID (employee-like shape)' })
  findAdmin(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findAdmin(id, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create employee (generates login credentials)' })
  create(@TenantId() companyId: number, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee details' })
  update(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete (deactivate) an employee' })
  remove(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.employeesService.remove(id, companyId);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign employee to a project (or unassign with null)' })
  assignProject(
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignProjectDto,
  ) {
    return this.employeesService.assignProject(id, companyId, dto);
  }
}
