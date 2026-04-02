import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicHoliday } from '../database/entities/public-holiday.entity';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

// ── Admin endpoints ──────────────────────────────────────────────────────────

@ApiTags('Admin — Holidays')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('admin/holidays')
export class HolidaysAdminController {
  constructor(
    @InjectRepository(PublicHoliday)
    private readonly repo: Repository<PublicHoliday>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all public holidays' })
  async getAll(@TenantId() companyId: number) {
    return this.repo.find({
      where: { companyId },
      order: { holidayDate: 'ASC' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a public holiday' })
  async create(
    @TenantId() companyId: number,
    @Body() body: { name: string; holidayDate: string; description?: string },
  ) {
    const holiday = this.repo.create({
      name: body.name,
      holidayDate: body.holidayDate,
      description: body.description ?? null,
      companyId,
    });
    return this.repo.save(holiday);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a public holiday' })
  async update(
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; holidayDate?: string; description?: string; isActive?: boolean },
  ) {
    const holiday = await this.repo.findOne({ where: { id, companyId } });
    if (!holiday) throw new Error('Holiday not found');
    if (body.name !== undefined) holiday.name = body.name;
    if (body.holidayDate !== undefined) holiday.holidayDate = body.holidayDate;
    if (body.description !== undefined) holiday.description = body.description;
    if (body.isActive !== undefined) holiday.isActive = body.isActive;
    return this.repo.save(holiday);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a public holiday' })
  async remove(
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const holiday = await this.repo.findOne({ where: { id, companyId } });
    if (!holiday) throw new Error('Holiday not found');
    await this.repo.remove(holiday);
    return { message: 'Holiday deleted' };
  }
}

// ── Employee endpoints (read-only) ───────────────────────────────────────────

@ApiTags('Employee — Holidays')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/holidays')
export class HolidaysEmployeeController {
  constructor(
    @InjectRepository(PublicHoliday)
    private readonly repo: Repository<PublicHoliday>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List public holidays (active only)' })
  async getAll(@TenantId() companyId: number) {
    return this.repo.find({
      where: { companyId, isActive: true },
      order: { holidayDate: 'ASC' },
    });
  }
}
