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
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ReassignTaskDto } from './dto/reassign-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { AuthorType } from '../database/entities/project-task-comment.entity';

@ApiTags('Admin — All Tickets')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('admin/all-tickets')
export class ProjectPlanningAdminTicketsController {
  constructor(private readonly service: ProjectPlanningService) {}

  @Get()
  @ApiOperation({ summary: 'List all tickets across all projects' })
  getAllTickets(
    @TenantId() companyId: number,
    @Query() filter: FilterTasksDto,
  ) {
    return this.service.getAllCompanyTickets(companyId, filter);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List all company projects for filter' })
  getAllProjects(@TenantId() companyId: number) {
    return this.service.getAllCompanyProjects(companyId);
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

  @Patch(':taskId/status')
  @ApiOperation({ summary: 'Update any task status' })
  updateStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.service.adminUpdateTaskStatus(taskId, companyId, dto, adminId);
  }

  @Patch(':taskId/reassign')
  @ApiOperation({ summary: 'Reassign any task to an employee or admin' })
  reassignTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: ReassignTaskDto,
  ) {
    return this.service.adminReassignTask(taskId, companyId, dto.assigneeId, adminId, dto.assigneeType);
  }

  @Get(':taskId/history')
  @ApiOperation({ summary: 'Get task history / audit log' })
  getTaskHistory(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getTaskHistory(taskId, companyId);
  }

  @Post(':taskId/comments')
  @ApiOperation({ summary: 'Add comment to any task' })
  addComment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.addComment(taskId, companyId, adminId, AuthorType.ADMIN, dto);
  }

  @Get(':taskId/contributors/suggested')
  @ApiOperation({ summary: 'Get suggested contributors from ticket history' })
  getSuggestedContributors(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getSuggestedContributors(taskId, companyId);
  }

  @Get(':taskId/contributors')
  @ApiOperation({ summary: 'Get ticket contributors' })
  getContributors(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getContributors(taskId, companyId);
  }

  @Post(':taskId/contributors')
  @ApiOperation({ summary: 'Set ticket contributors (replaces existing)' })
  setContributors(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @Body() body: { employeeIds: number[] },
  ) {
    return this.service.setContributors(taskId, companyId, body.employeeIds);
  }
}
