import {
  Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaveRequestsService } from './leave-requests.service';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { Employee } from '../database/entities/employee.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ActionLeaveRequestDto } from './dto/action-leave-request.dto';
import { FilterLeaveRequestDto } from './dto/filter-leave-request.dto';

@ApiTags('Employee — Leave Requests')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/leave-requests')
export class LeaveRequestsEmployeeController {
  constructor(private readonly service: LeaveRequestsService) {}

  @Get('leave-types')
  @ApiOperation({ summary: 'Active leave types for dropdown' })
  getLeaveTypes(@TenantId() companyId: number) {
    return this.service.getActiveLeaveTypes(companyId);
  }

  @Get('colleagues')
  @ApiOperation({ summary: 'Colleagues list for watcher selection' })
  getColleagues(@CurrentUser('id') id: number, @TenantId() companyId: number) {
    return this.service.getColleagues(id, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a leave request' })
  submit(@CurrentUser() employee: Employee, @Body() dto: CreateLeaveRequestDto) {
    return this.service.submit(employee, dto);
  }

  @Get()
  @ApiOperation({ summary: 'My leave request history' })
  myLeaves(
    @CurrentUser('id') id: number,
    @TenantId() companyId: number,
    @Query() filter: FilterLeaveRequestDto,
  ) {
    return this.service.findMyLeaves(id, companyId, filter);
  }

  @Get('pending-approvals')
  @ApiOperation({ summary: 'Requests pending my action (as manager or HR)' })
  pendingApprovals(@CurrentUser() employee: Employee, @Query() filter: FilterLeaveRequestDto) {
    return this.service.findPendingApprovals(employee, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Single leave request detail' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() employee: Employee) {
    return this.service.findOneForEmployee(id, employee);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel own pending leave request' })
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() employee: Employee) {
    return this.service.cancel(id, employee);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve leave request (manager or HR)' })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() employee: Employee,
    @Body() dto: ActionLeaveRequestDto,
  ) {
    return this.service.approve(id, employee, dto);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject leave request (manager or HR)' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() employee: Employee,
    @Body() dto: ActionLeaveRequestDto,
  ) {
    return this.service.reject(id, employee, dto);
  }
}
