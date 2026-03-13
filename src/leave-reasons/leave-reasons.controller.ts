import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaveTypesService } from './leave-reasons.service';
import { CreateLeaveTypeDto } from './dto/create-leave-reason.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-reason.dto';
import { FilterLeaveTypeDto } from './dto/filter-leave-reason.dto';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Employee } from '../database/entities/employee.entity';

@ApiTags('Leave Types')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('leave-types')
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all leave types' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterLeaveTypeDto) {
    return this.leaveTypesService.findAll(companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get leave type by ID' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.leaveTypesService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new leave type' })
  create(@TenantId() companyId: number, @Body() dto: CreateLeaveTypeDto) {
    return this.leaveTypesService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a leave type' })
  update(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeaveTypeDto) {
    return this.leaveTypesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete (deactivate) a leave type' })
  remove(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.leaveTypesService.remove(id, companyId);
  }
}

// ── Employee-facing controller (read-only for all, CRUD for HR) ──

@ApiTags('Employee — Leave Types')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/leave-types')
export class EmployeeLeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  private assertHr(employee: Employee) {
    if (!employee.isHr) {
      throw new ForbiddenException('Only HR employees can manage leave types');
    }
  }

  @Get()
  @ApiOperation({ summary: 'List leave types (all employees)' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterLeaveTypeDto) {
    return this.leaveTypesService.findAll(companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get leave type by ID (all employees)' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.leaveTypesService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create leave type (HR only)' })
  create(@CurrentUser() employee: Employee, @TenantId() companyId: number, @Body() dto: CreateLeaveTypeDto) {
    this.assertHr(employee);
    return this.leaveTypesService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update leave type (HR only)' })
  update(@CurrentUser() employee: Employee, @TenantId() companyId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeaveTypeDto) {
    this.assertHr(employee);
    return this.leaveTypesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate leave type (HR only)' })
  remove(@CurrentUser() employee: Employee, @TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    this.assertHr(employee);
    return this.leaveTypesService.remove(id, companyId);
  }
}
