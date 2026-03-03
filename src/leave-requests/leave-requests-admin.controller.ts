import {
  Controller, Get, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LeaveRequestsService } from './leave-requests.service';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { FilterLeaveRequestDto } from './dto/filter-leave-request.dto';

@ApiTags('Admin — Leave Requests')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('leave-requests')
export class LeaveRequestsAdminController {
  constructor(private readonly service: LeaveRequestsService) {}

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

  @Get(':id')
  @ApiOperation({ summary: 'Single leave request detail' })
  findOne(@Param('id', ParseIntPipe) id: number, @TenantId() companyId: number) {
    return this.service.findOneAdmin(id, companyId);
  }
}
