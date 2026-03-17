import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { EmailLogsService } from './email-logs.service';
import { FilterEmailLogsPlatformDto } from './dto/filter-email-logs.dto';

@ApiTags('Platform — Email Logs')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard, SuperAdminGuard)
@Controller('platform/email-logs')
export class EmailLogsPlatformController {
  constructor(private readonly emailLogsService: EmailLogsService) {}

  @Get()
  @ApiOperation({ summary: 'List all sent email logs across all companies' })
  findAll(@Query() filter: FilterEmailLogsPlatformDto) {
    return this.emailLogsService.findAllPlatform(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single email log with full body' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.emailLogsService.findOnePlatform(id);
  }
}
