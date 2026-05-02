import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseStatusDto, UpdateExpensePaidDto } from './dto/create-expense.dto';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Admin — Expenses')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('admin/expenses')
export class ExpensesAdminController {
  constructor(private readonly service: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Admin creates own expense' })
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
    @CurrentUser('id') adminId: number,
    @CurrentUser('name') adminName: string,
    @TenantId() companyId: number,
    @Body() dto: CreateExpenseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.createByAdmin(adminId, adminName, companyId, dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'List all expenses' })
  getAll(
    @TenantId() companyId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
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

  @Get(':id')
  @ApiOperation({ summary: 'Get expense detail' })
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
  ) {
    return this.service.getOne(id, companyId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve or reject expense' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @CurrentUser('name') adminName: string,
    @Body() dto: UpdateExpenseStatusDto,
  ) {
    return this.service.updateStatus(id, companyId, adminId, dto, adminName);
  }

  @Patch(':id/paid')
  @ApiOperation({ summary: 'Mark expense as paid / unpaid (admin)' })
  markPaid(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @CurrentUser('name') adminName: string,
    @Body() dto: UpdateExpensePaidDto,
  ) {
    return this.service.setPaid(id, companyId, { kind: 'admin', id: adminId, name: adminName }, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  delete(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() companyId: number,
  ) {
    return this.service.deleteByAdmin(id, companyId);
  }
}
