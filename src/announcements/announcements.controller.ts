import {
  Body, Controller, Delete, ForbiddenException, Get, NotFoundException,
  Param, ParseIntPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Announcement } from '../database/entities/announcement.entity';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { JwtEmployeeGuard } from '../auth/guards/jwt-employee.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

function todayDateStr(): string {
  // YYYY-MM-DD (server local day). Date column is date-only.
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ── Admin endpoints ──────────────────────────────────────────────────────────

@ApiTags('Admin — Announcements')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('admin/announcements')
export class AnnouncementsAdminController {
  constructor(
    @InjectRepository(Announcement)
    private readonly repo: Repository<Announcement>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all announcements (admin)' })
  async getAll(@TenantId() companyId: number) {
    return this.repo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  @Get('active')
  @ApiOperation({ summary: 'List active (non-expired) announcements' })
  async getActive(@TenantId() companyId: number) {
    const today = todayDateStr();
    return this.repo.find({
      where: { companyId, isActive: true, expiresOn: MoreThanOrEqual(today) },
      order: { createdAt: 'DESC' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create an announcement (admin)' })
  async create(
    @TenantId() companyId: number,
    @CurrentUser('id') adminId: number,
    @CurrentUser('name') adminName: string,
    @Body() body: { title: string; description: string; expiresOn: string },
  ) {
    const a = this.repo.create({
      title: body.title.trim(),
      description: body.description.trim(),
      expiresOn: body.expiresOn,
      isActive: true,
      createdById: adminId,
      createdByType: 'admin',
      createdByName: adminName ?? 'Admin',
      companyId,
    });
    return this.repo.save(a);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an announcement (admin)' })
  async update(
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; description?: string; expiresOn?: string; isActive?: boolean },
  ) {
    const a = await this.repo.findOne({ where: { id, companyId } });
    if (!a) throw new NotFoundException('Announcement not found');
    if (body.title !== undefined) a.title = body.title.trim();
    if (body.description !== undefined) a.description = body.description.trim();
    if (body.expiresOn !== undefined) a.expiresOn = body.expiresOn;
    if (body.isActive !== undefined) a.isActive = body.isActive;
    return this.repo.save(a);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an announcement (admin)' })
  async remove(
    @TenantId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const a = await this.repo.findOne({ where: { id, companyId } });
    if (!a) throw new NotFoundException('Announcement not found');
    await this.repo.remove(a);
    return { message: 'Announcement deleted' };
  }
}

// ── Employee endpoints ───────────────────────────────────────────────────────
// Read: any employee. Create/Update/Delete: HR employees only.

@ApiTags('Employee — Announcements')
@ApiBearerAuth('employee-jwt')
@UseGuards(JwtEmployeeGuard)
@Controller('employee/announcements')
export class AnnouncementsEmployeeController {
  constructor(
    @InjectRepository(Announcement)
    private readonly repo: Repository<Announcement>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all announcements (employee; HR can manage)' })
  async getAll(@TenantId() companyId: number) {
    return this.repo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  @Get('active')
  @ApiOperation({ summary: 'List active (non-expired) announcements' })
  async getActive(@TenantId() companyId: number) {
    const today = todayDateStr();
    return this.repo.find({
      where: { companyId, isActive: true, expiresOn: MoreThanOrEqual(today) },
      order: { createdAt: 'DESC' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create an announcement (HR only)' })
  async create(
    @TenantId() companyId: number,
    @CurrentUser('id') empId: number,
    @CurrentUser('empName') empName: string,
    @CurrentUser('isHr') isHr: boolean,
    @Body() body: { title: string; description: string; expiresOn: string },
  ) {
    if (!isHr) throw new ForbiddenException('Only HR can create announcements');
    const a = this.repo.create({
      title: body.title.trim(),
      description: body.description.trim(),
      expiresOn: body.expiresOn,
      isActive: true,
      createdById: empId,
      createdByType: 'employee',
      createdByName: empName ?? 'HR',
      companyId,
    });
    return this.repo.save(a);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an announcement (HR only)' })
  async update(
    @TenantId() companyId: number,
    @CurrentUser('isHr') isHr: boolean,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; description?: string; expiresOn?: string; isActive?: boolean },
  ) {
    if (!isHr) throw new ForbiddenException('Only HR can update announcements');
    const a = await this.repo.findOne({ where: { id, companyId } });
    if (!a) throw new NotFoundException('Announcement not found');
    if (body.title !== undefined) a.title = body.title.trim();
    if (body.description !== undefined) a.description = body.description.trim();
    if (body.expiresOn !== undefined) a.expiresOn = body.expiresOn;
    if (body.isActive !== undefined) a.isActive = body.isActive;
    return this.repo.save(a);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an announcement (HR only)' })
  async remove(
    @TenantId() companyId: number,
    @CurrentUser('isHr') isHr: boolean,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!isHr) throw new ForbiddenException('Only HR can remove announcements');
    const a = await this.repo.findOne({ where: { id, companyId } });
    if (!a) throw new NotFoundException('Announcement not found');
    await this.repo.remove(a);
    return { message: 'Announcement deleted' };
  }
}

