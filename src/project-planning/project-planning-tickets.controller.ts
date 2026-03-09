import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectPlanningService } from './project-planning.service';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ReassignTaskDto } from './dto/reassign-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { AuthorType } from '../database/entities/project-task-comment.entity';

@ApiTags('Employee — All Project Tickets')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/project-tickets')
export class ProjectPlanningTicketsController {
  constructor(private readonly service: ProjectPlanningService) {}

  @Get()
  @ApiOperation({ summary: 'List all tickets from projects I belong to' })
  getProjectTickets(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Query() filter: FilterTasksDto,
  ) {
    return this.service.getProjectTickets(employeeId, companyId, filter);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List projects accessible to this employee' })
  getAccessibleProjects(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getAccessibleProjects(employeeId, companyId);
  }

  @Get('admins')
  @ApiOperation({ summary: 'List company admins for close assignment' })
  getAdmins(@TenantId() companyId: number) {
    return this.service.getCompanyAdmins(companyId);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Task detail with comments' })
  getTaskDetail(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getTaskDetail(taskId, companyId);
  }

  @Get(':taskId/history')
  @ApiOperation({ summary: 'Get task history / audit log' })
  getTaskHistory(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getTaskHistory(taskId, companyId);
  }

  @Patch(':taskId/status')
  @ApiOperation({ summary: 'Update any project task status' })
  updateStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.service.updateProjectTaskStatus(taskId, employeeId, companyId, dto);
  }

  @Patch(':taskId/reassign')
  @ApiOperation({ summary: 'Reassign any project task to another employee' })
  reassignTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Body() dto: ReassignTaskDto,
  ) {
    return this.service.reassignProjectTask(taskId, employeeId, companyId, dto.assigneeId);
  }

  @Post(':taskId/comments')
  @ApiOperation({ summary: 'Add comment to any project task' })
  addComment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') employeeId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.addComment(taskId, companyId, employeeId, AuthorType.EMPLOYEE, dto);
  }
}
