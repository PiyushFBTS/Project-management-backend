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
import { CreateCommentDto } from './dto/create-comment.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { AuthorType } from '../database/entities/project-task-comment.entity';

@ApiTags('Employee — My Tasks')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/my-tasks')
export class ProjectPlanningEmployeeController {
  constructor(private readonly service: ProjectPlanningService) {}

  @Get()
  @ApiOperation({ summary: 'List all tasks assigned to me' })
  getMyTasks(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Query() filter: FilterTasksDto,
  ) {
    return this.service.getMyTasks(employeeId, companyId, filter);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete tickets by partial ticket number or title' })
  autocomplete(
    @Query('q') query: string,
    @TenantId() companyId: number,
  ) {
    return this.service.autocompleteTickets(query?.trim() ?? '', companyId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search any company task by ticket number' })
  searchByTicket(
    @Query('ticket') ticket: string,
    @TenantId() companyId: number,
  ) {
    return this.service.searchByTicket(ticket.toUpperCase(), companyId);
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
  @ApiOperation({ summary: 'Update my task status' })
  updateStatus(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.service.updateMyTaskStatus(taskId, employeeId, companyId, dto);
  }

  @Post(':taskId/comments')
  @ApiOperation({ summary: 'Add comment to a task (assigned or searched)' })
  addComment(
    @Param('taskId', ParseIntPipe) taskId: number,
    @TenantId() companyId: number,
    @CurrentUser('id') employeeId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.addComment(taskId, companyId, employeeId, AuthorType.EMPLOYEE, dto);
  }
}
