import {
  Body, Controller, Get, Param, Patch, Post, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LeaveRequestsService } from './leave-requests.service';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FilterLeaveRequestDto } from './dto/filter-leave-request.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ActionLeaveRequestDto } from './dto/action-leave-request.dto';

@ApiTags('Admin — Leave Requests')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('leave-requests')
export class LeaveRequestsAdminController {
  constructor(private readonly service: LeaveRequestsService) {}

  @Get('leave-types')
  @ApiOperation({ summary: 'Active leave types for dropdown (admin)' })
  getLeaveTypes(@TenantId() companyId: number) {
    return this.service.getActiveLeaveTypes(companyId);
  }

  @Get('colleagues')
  @ApiOperation({ summary: 'Employees list for watcher selection (admin)' })
  getColleagues(@TenantId() companyId: number) {
    return this.service.getColleagues(0, companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a leave request (admin)' })
  submitLeave(
    @CurrentUser('id') adminId: number,
    @TenantId() companyId: number,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.service.submitAdminLeave(adminId, companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all company leave requests' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterLeaveRequestDto) {
    return this.service.findAll(companyId, filter);
  }

  @Get('report')
  @ApiOperation({ summary: 'Leave report: summary by employee, reason, status' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getReport(
    @TenantId() companyId: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getReport(companyId, dateFrom, dateTo);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a leave request (admin)' })
  cancelLeave(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
  ) {
    return this.service.adminCancel(id, companyId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a leave request (admin)' })
  approveLeave(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: ActionLeaveRequestDto,
  ) {
    return this.service.adminApprove(id, companyId, dto, adminId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a leave request (admin)' })
  rejectLeave(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: ActionLeaveRequestDto,
  ) {
    return this.service.adminReject(id, companyId, dto, adminId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Single leave request detail' })
  findOne(@Param('id', ParseIntPipe) id: number, @TenantId() companyId: number) {
    return this.service.findOneAdmin(id, companyId);
  }
}
