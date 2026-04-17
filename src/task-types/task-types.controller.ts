import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaskTypesService } from './task-types.service';
import { CreateTaskTypeDto } from './dto/create-task-type.dto';
import { UpdateTaskTypeDto } from './dto/update-task-type.dto';
import { FilterTaskTypeDto } from './dto/filter-task-type.dto';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Task Types')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('task-types')
export class TaskTypesController {
  constructor(private readonly taskTypesService: TaskTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all task types' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterTaskTypeDto) {
    return this.taskTypesService.findAll(companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task type by ID' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.taskTypesService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task type' })
  create(@TenantId() companyId: number, @Body() dto: CreateTaskTypeDto) {
    return this.taskTypesService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task type' })
  update(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskTypeDto) {
    return this.taskTypesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete (deactivate) a task type' })
  remove(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.taskTypesService.remove(id, companyId);
  }
}

// ── Employee endpoints: /api/employee/task-types ──────────────────────────
// Read: any employee. Create/Update/Delete: HR employees only.

@ApiTags('Employee — Task Types')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/task-types')
export class EmployeeTaskTypesController {
  constructor(private readonly taskTypesService: TaskTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List task types (visible to all employees)' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterTaskTypeDto) {
    return this.taskTypesService.findAll(companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task type by ID' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.taskTypesService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task type (HR only)' })
  create(
    @TenantId() companyId: number,
    @CurrentUser('isHr') isHr: boolean,
    @Body() dto: CreateTaskTypeDto,
  ) {
    if (!isHr) throw new ForbiddenException('Only HR can create task types');
    return this.taskTypesService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task type (HR only)' })
  update(
    @TenantId() companyId: number,
    @CurrentUser('isHr') isHr: boolean,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskTypeDto,
  ) {
    if (!isHr) throw new ForbiddenException('Only HR can update task types');
    return this.taskTypesService.update(id, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a task type (HR only)' })
  remove(
    @TenantId() companyId: number,
    @CurrentUser('isHr') isHr: boolean,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!isHr) throw new ForbiddenException('Only HR can remove task types');
    return this.taskTypesService.remove(id, companyId);
  }
}
