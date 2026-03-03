import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
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

// ── Employee read-only endpoints: /api/employee/task-types ────────────────

@ApiTags('Employee — Task Types')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/task-types')
export class EmployeeTaskTypesController {
  constructor(private readonly taskTypesService: TaskTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List active task types (for task sheet dropdowns)' })
  findAll(@TenantId() companyId: number) {
    return this.taskTypesService.findAll(companyId, { isActive: true, limit: 200 } as any);
  }
}
