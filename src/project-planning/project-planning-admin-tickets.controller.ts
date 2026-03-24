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

  @Get('my-tasks')
  @ApiOperation({ summary: 'Tickets assigned to the current admin' })
  getMyTasks(
    @CurrentUser('id') adminId: number,
    @TenantId() companyId: number,
    @Query() filter: FilterTasksDto,
  ) {
    return this.service.getAdminMyTasks(adminId, companyId, filter);
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

  @Patch(':taskId/reassign-any')
  @ApiOperation({ summary: 'Reassign task to employee or client' })
  reassignToAny(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Body() body: { employeeId?: number; clientId?: number; adminId?: number },
  ) {
    return this.service.reassignToAny(taskId, companyId, body, adminId, 'admin');
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
    @CurrentUser('name') adminName: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadAttachment(taskId, companyId, file, adminName ?? 'Admin');
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
