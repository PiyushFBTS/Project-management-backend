import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectPlanningService } from './project-planning.service';
import { JwtClientGuard } from '../auth/guards/jwt-client.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { AuthorType } from '../database/entities/project-task-comment.entity';

@ApiTags('Client — Project Planning')
@ApiBearerAuth('client-jwt')
@UseGuards(JwtClientGuard)
@Controller('client')
export class ProjectPlanningClientController {
  constructor(private readonly service: ProjectPlanningService) {}

  // ── Project info (their project only) ──
  @Get('project')
  @ApiOperation({ summary: 'Get client project details' })
  getProject(@CurrentUser('projectId') projectId: number, @TenantId() companyId: number) {
    return this.service.getClientProject(projectId, companyId);
  }

  // ── Documents (read-only for client) ──
  @Get('documents')
  @ApiOperation({ summary: 'List project documents (client read-only)' })
  getDocuments(@CurrentUser('projectId') projectId: number, @TenantId() companyId: number) {
    return this.service.getProjectDocuments(projectId, companyId);
  }

  // ── Planning: Phases + Tasks (read & create) ──
  @Get('planning/phases')
  @ApiOperation({ summary: 'List phases for client project' })
  listPhases(@CurrentUser('projectId') projectId: number, @TenantId() companyId: number) {
    return this.service.listPhases(projectId, companyId);
  }

  @Get('planning/tasks')
  @ApiOperation({ summary: 'List tasks for client project' })
  listTasks(
    @CurrentUser('projectId') projectId: number,
    @TenantId() companyId: number,
    @Query() filter: FilterTasksDto,
  ) {
    return this.service.listTasks(projectId, companyId, filter);
  }

  @Post('planning/tasks')
  @ApiOperation({ summary: 'Create a new ticket in client project' })
  createTask(
    @CurrentUser('projectId') projectId: number,
    @CurrentUser('id') clientId: number,
    @TenantId() companyId: number,
    @Body() dto: CreateTaskDto,
  ) {
    return this.service.createTask(projectId, companyId, dto);
  }

  @Get('planning/tasks/:taskId')
  @ApiOperation({ summary: 'Task detail' })
  getTaskDetail(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getTaskDetail(taskId, companyId);
  }

  @Get('planning/tasks/:taskId/history')
  @ApiOperation({ summary: 'Task history' })
  getTaskHistory(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getTaskHistory(taskId, companyId);
  }

  // ── All tickets view ──
  @Get('all-tickets')
  @ApiOperation({ summary: 'All tickets in client project' })
  getAllTickets(
    @CurrentUser('projectId') projectId: number,
    @TenantId() companyId: number,
    @Query() filter: FilterTasksDto,
  ) {
    return this.service.listTasks(projectId, companyId, filter);
  }

  // ── My tasks (assigned to this client) ──
  @Get('my-tasks')
  @ApiOperation({ summary: 'Tickets assigned to this client' })
  getMyTasks(
    @CurrentUser('id') clientId: number,
    @TenantId() companyId: number,
    @Query() filter: FilterTasksDto,
  ) {
    return this.service.getClientMyTasks(clientId, companyId, filter);
  }

  // ── Employees for reassign ──
  @Get('employees')
  @ApiOperation({ summary: 'List company employees, admins & project clients for reassign' })
  getEmployees(
    @TenantId() companyId: number,
    @CurrentUser('projectId') projectId: number,
  ) {
    return this.service.getCompanyEmployeesForClient(companyId, projectId);
  }

  // ── Summary ──
  @Get('summary')
  @ApiOperation({ summary: 'Task stats for client project' })
  getSummary(@CurrentUser('projectId') projectId: number, @TenantId() companyId: number) {
    return this.service.getSummary(projectId, companyId);
  }

  // ── Reassign ──
  @Patch('tasks/:taskId/reassign')
  @ApiOperation({ summary: 'Reassign task to employee/admin/client' })
  reassignTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') clientId: number,
    @Body() body: { employeeId?: number; clientId?: number; adminId?: number },
  ) {
    return this.service.reassignToAny(taskId, companyId, body, clientId, 'employee');
  }

  // ── Status update ──
  @Patch('tasks/:taskId/status')
  @ApiOperation({ summary: 'Update ticket status' })
  updateStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.service.updateTask(taskId, companyId, { status: dto.status } as any);
  }

  // ── Comments ──
  @Post('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Add comment to a task' })
  addComment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') clientId: number,
    @Body() dto: CreateCommentDto,
  ) {
    // Use EMPLOYEE type for now (comments from clients appear as employee-authored)
    return this.service.addComment(taskId, companyId, clientId, AuthorType.EMPLOYEE, dto);
  }

  // ── Attachments ──

  @Get('tasks/:taskId/attachments')
  @ApiOperation({ summary: 'List task attachments' })
  getAttachments(@Param('taskId', ParseIntPipe) taskId: number, @TenantId() companyId: number) {
    return this.service.getAttachments(taskId, companyId);
  }

  @Post('tasks/:taskId/attachments')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload task attachment' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/task-attachments',
        filename: (_req, file, cb) => cb(null, `att-${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|webp|txt|csv)$/i.test(file.originalname)) cb(null, true);
        else cb(new Error('File type not allowed'), false);
      },
    }),
  )
  uploadAttachment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('fullName') clientName: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadAttachment(taskId, companyId, file, clientName ?? 'Client');
  }

  @Delete('tasks/:taskId/attachments/:attId')
  @ApiOperation({ summary: 'Delete task attachment' })
  deleteAttachment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('attId', ParseIntPipe) attId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.deleteAttachment(taskId, attId, companyId);
  }
}
