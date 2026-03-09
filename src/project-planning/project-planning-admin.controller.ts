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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectPlanningService } from './project-planning.service';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { AuthorType } from '../database/entities/project-task-comment.entity';

@ApiTags('Admin — Project Planning')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('projects/:projectId/planning')
export class ProjectPlanningAdminController {
  constructor(private readonly service: ProjectPlanningService) {}

  // ── Summary ──────────────────────────────────────────────────────────────────

  @Get('summary')
  @ApiOperation({ summary: 'Task counts by status and priority' })
  getSummary(
    @Param('projectId', ParseIntPipe) projectId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getSummary(projectId, companyId);
  }

  // ── Phases ───────────────────────────────────────────────────────────────────

  @Get('phases')
  @ApiOperation({ summary: 'List all phases for a project' })
  listPhases(
    @Param('projectId', ParseIntPipe) projectId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.listPhases(projectId, companyId);
  }

  @Post('phases')
  @ApiOperation({ summary: 'Create a new phase' })
  createPhase(
    @Param('projectId', ParseIntPipe) projectId: number,
    @TenantId() companyId: number,
    @Body() dto: CreatePhaseDto,
  ) {
    return this.service.createPhase(projectId, companyId, dto);
  }

  @Patch('phases/:phaseId')
  @ApiOperation({ summary: 'Update a phase' })
  updatePhase(
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @TenantId() companyId: number,
    @Body() dto: UpdatePhaseDto,
  ) {
    return this.service.updatePhase(phaseId, companyId, dto);
  }

  @Delete('phases/:phaseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a phase' })
  deletePhase(
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.deletePhase(phaseId, companyId);
  }

  @Put('phases/reorder')
  @ApiOperation({ summary: 'Reorder phases' })
  reorderPhases(
    @Param('projectId', ParseIntPipe) projectId: number,
    @TenantId() companyId: number,
    @Body() body: { phaseIds: number[] },
  ) {
    return this.service.reorderPhases(projectId, companyId, body.phaseIds);
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────

  @Get('tasks')
  @ApiOperation({ summary: 'List tasks (filterable, paginated)' })
  listTasks(
    @Param('projectId', ParseIntPipe) projectId: number,
    @TenantId() companyId: number,
    @Query() filter: FilterTasksDto,
  ) {
    return this.service.listTasks(projectId, companyId, filter);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create a task' })
  createTask(
    @Param('projectId', ParseIntPipe) projectId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: CreateTaskDto,
  ) {
    return this.service.createTask(projectId, companyId, dto, adminId);
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Task detail with comments' })
  getTaskDetail(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getTaskDetail(taskId, companyId);
  }

  @Patch('tasks/:taskId')
  @ApiOperation({ summary: 'Update a task' })
  updateTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.service.updateTask(taskId, companyId, dto, adminId);
  }

  @Delete('tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task' })
  deleteTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.deleteTask(taskId, companyId);
  }

  // ── History ──────────────────────────────────────────────────────────────────

  @Get('tasks/:taskId/history')
  @ApiOperation({ summary: 'Get task history / audit log' })
  getTaskHistory(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getTaskHistory(taskId, companyId);
  }

  // ── Comments ─────────────────────────────────────────────────────────────────

  @Post('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Add comment to a task' })
  addComment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.addComment(taskId, companyId, adminId, AuthorType.ADMIN, dto);
  }
}
