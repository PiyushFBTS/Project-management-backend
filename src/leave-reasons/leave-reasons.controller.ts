import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaveReasonsService } from './leave-reasons.service';
import { CreateLeaveReasonDto } from './dto/create-leave-reason.dto';
import { UpdateLeaveReasonDto } from './dto/update-leave-reason.dto';
import { FilterLeaveReasonDto } from './dto/filter-leave-reason.dto';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Employee } from '../database/entities/employee.entity';

@ApiTags('Leave Reasons')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('leave-reasons')
export class LeaveReasonsController {
  constructor(private readonly leaveReasonsService: LeaveReasonsService) {}

  @Get()
  @ApiOperation({ summary: 'List all leave reasons' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterLeaveReasonDto) {
    return this.leaveReasonsService.findAll(companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get leave reason by ID' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.leaveReasonsService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new leave reason' })
  create(@TenantId() companyId: number, @Body() dto: CreateLeaveReasonDto) {
    return this.leaveReasonsService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a leave reason' })
  update(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeaveReasonDto) {
    return this.leaveReasonsService.update(id, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete (deactivate) a leave reason' })
  remove(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.leaveReasonsService.remove(id, companyId);
  }
}

// ── Employee-facing controller (read-only for all, CRUD for HR) ──

@ApiTags('Employee — Leave Reasons')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/leave-reasons')
export class EmployeeLeaveReasonsController {
  constructor(private readonly leaveReasonsService: LeaveReasonsService) {}

  private assertHr(employee: Employee) {
    if (!employee.isHr) {
      throw new ForbiddenException('Only HR employees can manage leave reasons');
    }
  }

  @Get()
  @ApiOperation({ summary: 'List leave reasons (all employees)' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterLeaveReasonDto) {
    return this.leaveReasonsService.findAll(companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get leave reason by ID (all employees)' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.leaveReasonsService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create leave reason (HR only)' })
  create(@CurrentUser() employee: Employee, @TenantId() companyId: number, @Body() dto: CreateLeaveReasonDto) {
    this.assertHr(employee);
    return this.leaveReasonsService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update leave reason (HR only)' })
  update(@CurrentUser() employee: Employee, @TenantId() companyId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeaveReasonDto) {
    this.assertHr(employee);
    return this.leaveReasonsService.update(id, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate leave reason (HR only)' })
  remove(@CurrentUser() employee: Employee, @TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    this.assertHr(employee);
    return this.leaveReasonsService.remove(id, companyId);
  }
}
