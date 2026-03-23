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

  @Patch(':taskId/reassign-any')
  @ApiOperation({ summary: 'Reassign task to employee or client' })
  reassignToAny(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Body() body: { employeeId?: number; clientId?: number; adminId?: number },
  ) {
    return this.service.reassignToAny(taskId, companyId, body, employeeId, 'employee');
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

  // ── Attachments ──

  @Get(':taskId/attachments')
  @ApiOperation({ summary: 'List task attachments' })
  getAttachments(@Param('taskId', ParseIntPipe) taskId: number, @TenantId() companyId: number) {
    return this.service.getAttachments(taskId, companyId);
  }

  @Post(':taskId/attachments')
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
    @CurrentUser('empName') empName: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadAttachment(taskId, companyId, file, empName ?? 'Employee');
  }

  @Delete(':taskId/attachments/:attId')
  @ApiOperation({ summary: 'Delete task attachment' })
  deleteAttachment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('attId', ParseIntPipe) attId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.deleteAttachment(taskId, attId, companyId);
  }
}
