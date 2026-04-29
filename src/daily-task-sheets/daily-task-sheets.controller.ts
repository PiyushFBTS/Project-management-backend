import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailyTaskSheetsService } from './daily-task-sheets.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { UpdateSheetDto } from './dto/update-sheet.dto';
import { FilterSheetDto } from './dto/filter-sheet.dto';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

// ── Employee endpoints: /api/task-sheets/* ──────────────────────────────────

@ApiTags('Task Sheets — Employee')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('task-sheets')
export class DailyTaskSheetsController {
  constructor(private readonly service: DailyTaskSheetsService) {}

  @Get('today')
  @ApiOperation({ summary: "Get or auto-create today's task sheet" })
  getToday(@CurrentUser('id') employeeId: number, @TenantId() companyId: number) {
    return this.service.getTodaySheet(employeeId, companyId);
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Get or auto-create a task sheet for a specific date' })
  getByDate(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Query('date') date: string,
  ) {
    return this.service.getSheetByDate(employeeId, companyId, date);
  }

  @Get('history')
  @ApiOperation({ summary: 'List past task sheet submissions (paginated)' })
  getHistory(@CurrentUser('id') employeeId: number, @Query() filter: FilterSheetDto) {
    return this.service.getHistory(employeeId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task sheet with all entries' })
  getById(@Param('id', ParseIntPipe) id: number, @CurrentUser('id') employeeId: number) {
    return this.service.getById(id, employeeId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sheet remarks' })
  updateRemarks(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') employeeId: number,
    @Body() dto: UpdateSheetDto,
  ) {
    return this.service.updateRemarks(id, employeeId, dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize and lock the task sheet' })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.submit(id, employeeId, companyId);
  }

  @Post(':id/entries')
  @ApiOperation({ summary: 'Add a new task entry to the sheet' })
  addEntry(
    @Param('id', ParseIntPipe) sheetId: number,
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Body() dto: CreateEntryDto,
  ) {
    return this.service.addEntry(sheetId, employeeId, companyId, dto);
  }

  @Patch(':id/entries/:entryId')
  @ApiOperation({ summary: 'Update a task entry' })
  updateEntry(
    @Param('id', ParseIntPipe) sheetId: number,
    @Param('entryId', ParseIntPipe) entryId: number,
    @CurrentUser('id') employeeId: number,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.service.updateEntry(sheetId, entryId, employeeId, dto);
  }

  @Delete(':id/entries/:entryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a task entry (only if sheet not yet submitted)' })
  deleteEntry(
    @Param('id', ParseIntPipe) sheetId: number,
    @Param('entryId', ParseIntPipe) entryId: number,
    @CurrentUser('id') employeeId: number,
  ) {
    return this.service.deleteEntry(sheetId, entryId, employeeId);
  }
}

// ── Admin endpoints: /api/admin/task-sheets/* ───────────────────────────────

@ApiTags('Admin — Task Sheets')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('admin/task-sheets')
export class AdminTaskSheetsController {
  constructor(private readonly service: DailyTaskSheetsService) {}

  @Get()
  @ApiOperation({ summary: 'Browse all task sheets (filter by employee, project, date)' })
  findAll(@TenantId() companyId: number, @Query() filter: FilterSheetDto) {
    return this.service.adminFindAll(companyId, filter);
  }

  // ── Admin's personal sheet endpoints (bridged via matching employee record) ──
  @Get('my/today')
  @ApiOperation({ summary: "Get or create admin's today sheet (by email match)" })
  myToday(@CurrentUser() admin: any, @TenantId() companyId: number) {
    return this.service.adminMyToday(admin.email, companyId);
  }

  @Get('my/by-date')
  @ApiOperation({ summary: "Get or create admin's sheet for specific date" })
  myByDate(
    @CurrentUser() admin: any,
    @TenantId() companyId: number,
    @Query('date') date: string,
  ) {
    return this.service.adminMyByDate(admin.email, companyId, date);
  }

  @Get('my/history')
  @ApiOperation({ summary: "List admin's own past task sheets" })
  myHistory(@CurrentUser() admin: any, @TenantId() companyId: number, @Query() filter: FilterSheetDto) {
    return this.service.adminMyHistory(admin.email, companyId, filter);
  }

  @Patch('my/:id')
  @ApiOperation({ summary: 'Update remarks on admin sheet' })
  myUpdateRemarks(
    @CurrentUser() admin: any,
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSheetDto,
  ) {
    return this.service.adminMyUpdateRemarks(admin.email, companyId, id, dto);
  }

  @Post('my/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit admin sheet' })
  mySubmit(
    @CurrentUser() admin: any,
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.adminMySubmit(admin.email, companyId, id, admin.id);
  }

  @Post('my/:id/entries')
  @ApiOperation({ summary: 'Add entry to admin sheet' })
  myAddEntry(
    @CurrentUser() admin: any,
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEntryDto,
  ) {
    return this.service.adminMyAddEntry(admin.email, companyId, id, dto);
  }

  @Patch('my/:id/entries/:entryId')
  @ApiOperation({ summary: 'Update entry in admin sheet' })
  myUpdateEntry(
    @CurrentUser() admin: any,
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('entryId', ParseIntPipe) entryId: number,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.service.adminMyUpdateEntry(admin.email, companyId, id, entryId, dto);
  }

  @Delete('my/:id/entries/:entryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete entry from admin sheet' })
  myDeleteEntry(
    @CurrentUser() admin: any,
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('entryId', ParseIntPipe) entryId: number,
  ) {
    return this.service.adminMyDeleteEntry(admin.email, companyId, id, entryId);
  }

  @Get(':id')
  @ApiOperation({ summary: "View any employee's task sheet with entries" })
  findOne(@TenantId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.service.adminGetById(id, companyId);
  }
}
