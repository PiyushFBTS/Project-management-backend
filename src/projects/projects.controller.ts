import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectDto } from './dto/filter-project.dto';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Projects')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects (paginated, filterable)' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterProjectDto) {
    return this.projectsService.findAll(companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(@TenantId() companyId: number, @Body() dto: CreateProjectDto, @CurrentUser('id') adminId: number) {
    return this.projectsService.create(companyId, dto, adminId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete (deactivate) a project' })
  remove(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id, companyId);
  }

  @Get(':id/employees')
  @ApiOperation({ summary: 'List employees assigned to a project' })
  getEmployees(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getEmployees(id, companyId);
  }
}

// ── Employee read-only endpoints: /api/employee/projects ──────────────────

@ApiTags('Employee — Projects')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/projects')
export class EmployeeProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects where employee has assigned tickets' })
  findAll(
    @TenantId() companyId: number,
    @CurrentUser('id') employeeId: number,
  ) {
    return this.projectsService.findByEmployeeTickets(companyId, employeeId);
  }

  @Get('all-active')
  @ApiOperation({ summary: 'List all active projects (for task sheet dropdowns)' })
  findAllActive(@TenantId() companyId: number) {
    return this.projectsService.findAll(companyId, { status: 'active', limit: 200 } as any);
  }
}
