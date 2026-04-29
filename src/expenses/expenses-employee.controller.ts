import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseStatusDto } from './dto/create-expense.dto';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Employee — Expenses')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/expenses')
export class ExpensesEmployeeController {
  constructor(private readonly service: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create expense' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/expenses',
      filename: (_req, file, cb) => cb(null, `exp-${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`),
    }),
    fileFilter: (_req, file, cb) => {
      const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx)$/i;
      cb(null, allowed.test(extname(file.originalname)));
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  create(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Body() dto: CreateExpenseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.create(employeeId, companyId, dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'List my expenses' })
  getMyExpenses(
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMyExpenses(employeeId, companyId, parseInt(page || '1', 10), parseInt(limit || '50', 10));
  }

  // ── HR-only endpoints (HR is an Employee with isHr=true) ───────────────
  // These let HR see + action expenses across the whole company through
  // the employee JWT, without giving them an admin login. The same routes
  // accessed by a non-HR employee return 403.

  @Get('all')
  @ApiOperation({ summary: 'HR: list all company expenses' })
  getAllForHr(
    @CurrentUser() emp: any,
    @TenantId() companyId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('projectId') projectId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    if (!emp?.isHr) throw new ForbiddenException('HR access required');
    return this.service.getAll(
      companyId,
      parseInt(page || '1', 10),
      parseInt(limit || '50', 10),
      {
        employeeId: employeeId ? parseInt(employeeId, 10) : undefined,
        status: status || undefined,
        projectId: projectId ? parseInt(projectId, 10) : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      },
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'HR: approve or reject expense' })
  hrUpdateStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() emp: any,
    @TenantId() companyId: number,
    @Body() dto: UpdateExpenseStatusDto,
  ) {
    if (!emp?.isHr) throw new ForbiddenException('HR access required');
    return this.service.updateStatusByHr(id, companyId, emp.id, emp.empName, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense detail (own; HR can view any)' })
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() emp: any,
    @TenantId() companyId: number,
  ) {
    // HR can view any expense in the company; regular employees only see
    // their own (the 3rd arg scopes the lookup to employeeId).
    return this.service.getOne(id, companyId, emp?.isHr ? undefined : emp.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update my expense' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/expenses',
      filename: (_req, file, cb) => cb(null, `exp-${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
    @Body() dto: Partial<CreateExpenseDto>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.updateOwn(id, employeeId, companyId, dto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete my expense' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') employeeId: number,
    @TenantId() companyId: number,
  ) {
    return this.service.deleteOwn(id, employeeId, companyId);
  }
}
