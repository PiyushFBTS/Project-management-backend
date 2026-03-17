import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { EmailLogsService } from './email-logs.service';
import { FilterEmailLogsDto } from './dto/filter-email-logs.dto';

@ApiTags('Admin — Email Logs')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('admin/email-logs')
export class EmailLogsAdminController {
  constructor(private readonly emailLogsService: EmailLogsService) {}

  @Get()
  @ApiOperation({ summary: "List company's sent email logs (paginated)" })
  findAll(
    @TenantId() companyId: number,
    @Query() filter: FilterEmailLogsDto,
  ) {
    return this.emailLogsService.findAll(companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single email log with full body' })
  findOne(
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.emailLogsService.findOne(id, companyId);
  }
}
