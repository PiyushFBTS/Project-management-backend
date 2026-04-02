import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DailyTaskSheet } from '../database/entities/daily-task-sheet.entity';
import { TaskEntry } from '../database/entities/task-entry.entity';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { UpdateSheetDto } from './dto/update-sheet.dto';
import { FilterSheetDto } from './dto/filter-sheet.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../database/entities/notification.entity';

@Injectable()
export class DailyTaskSheetsService {
  constructor(
    @InjectRepository(DailyTaskSheet)
    private readonly sheetRepo: Repository<DailyTaskSheet>,
    @InjectRepository(TaskEntry)
    private readonly entryRepo: Repository<TaskEntry>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Employee endpoints ──────────────────────────────────────────────────────

  async getTodaySheet(employeeId: number, companyId: number): Promise<DailyTaskSheet> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let sheet = await this.sheetRepo.findOne({
      where: { employeeId, sheetDate: today },
      relations: ['taskEntries', 'taskEntries.project', 'taskEntries.taskType'],
    });
    if (!sheet) {
      sheet = await this.sheetRepo.save(
        this.sheetRepo.create({ employeeId, sheetDate: today, companyId }),
      );
      sheet.taskEntries = [];
    }
    return sheet;
  }

  async getSheetByDate(employeeId: number, companyId: number, date: string): Promise<DailyTaskSheet> {
    let sheet = await this.sheetRepo.findOne({
      where: { employeeId, sheetDate: date },
      relations: ['taskEntries', 'taskEntries.project', 'taskEntries.taskType'],
    });
    if (!sheet) {
      sheet = await this.sheetRepo.save(
        this.sheetRepo.create({ employeeId, sheetDate: date, companyId }),
      );
      sheet.taskEntries = [];
    }
    return sheet;
  }

  async getHistory(employeeId: number, filter: FilterSheetDto) {
    const { page = 1, limit = 20, fromDate, toDate } = filter;

    const qb = this.sheetRepo
      .createQueryBuilder('s')
      .where('s.employeeId = :employeeId', { employeeId })
      .orderBy('s.sheetDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (fromDate) qb.andWhere('s.sheetDate >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('s.sheetDate <= :toDate', { toDate });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number, employeeId: number): Promise<DailyTaskSheet> {
    const sheet = await this.sheetRepo.findOne({
      where: { id, employeeId },
      relations: ['taskEntries', 'taskEntries.project', 'taskEntries.taskType'],
    });
    if (!sheet) throw new NotFoundException(`Task sheet #${id} not found`);
    return sheet;
  }

  async updateRemarks(id: number, employeeId: number, dto: UpdateSheetDto) {
    const sheet = await this.getById(id, employeeId);
    sheet.remarks = dto.remarks;
    return this.sheetRepo.save(sheet);
  }

  async submit(id: number, employeeId: number, companyId: number) {
    const sheet = await this.getById(id, employeeId);
    const wasAlreadySubmitted = sheet.isSubmitted;

    // Recalculate total hours from entries before locking
    await this.recalculateTotalHours(id);

    const updated = await this.sheetRepo.findOne({
      where: { id },
      relations: ['employee'],
    });
    updated.isSubmitted = true;
    updated.submittedAt = new Date();
    await this.sheetRepo.save(updated);

    // Only send notification on first submission, not on edits
    if (!wasAlreadySubmitted) {
      const empName = updated.employee?.empName ?? `Employee #${employeeId}`;
      await this.notificationsService.create(
        NotificationType.TASK_SHEET_SUBMITTED,
        'Task Sheet Submitted',
        `${empName} submitted their task sheet for ${updated.sheetDate} (${Number(updated.totalHours).toFixed(1)}h).`,
        companyId,
        { sheetId: id, employeeId },
      );
    }

    return { message: wasAlreadySubmitted ? 'Task sheet updated successfully' : 'Task sheet submitted successfully' };
  }

  // ── Task entry CRUD ─────────────────────────────────────────────────────────

  async addEntry(sheetId: number, employeeId: number, companyId: number, dto: CreateEntryDto): Promise<TaskEntry> {
    const sheet = await this.getById(sheetId, employeeId);
    await this.assertEditable(sheet, employeeId);
    this.assertTimeOrder(dto.fromTime, dto.toTime);

    const entry = await this.entryRepo.save(
      this.entryRepo.create({ taskSheetId: sheetId, companyId, ...dto }),
    );
    await this.recalculateTotalHours(sheetId);
    return entry;
  }

  async updateEntry(
    sheetId: number,
    entryId: number,
    employeeId: number,
    dto: UpdateEntryDto,
  ): Promise<TaskEntry> {
    const sheet = await this.getById(sheetId, employeeId);
    await this.assertEditable(sheet, employeeId);

    const entry = await this.entryRepo.findOne({ where: { id: entryId, taskSheetId: sheetId } });
    if (!entry) throw new NotFoundException(`Entry #${entryId} not found in sheet #${sheetId}`);

    const newFrom = dto.fromTime ?? entry.fromTime;
    const newTo = dto.toTime ?? entry.toTime;
    this.assertTimeOrder(newFrom, newTo);

    Object.assign(entry, dto);
    const saved = await this.entryRepo.save(entry);
    await this.recalculateTotalHours(sheetId);
    return saved;
  }

  async deleteEntry(sheetId: number, entryId: number, employeeId: number) {
    const sheet = await this.getById(sheetId, employeeId);
    await this.assertEditable(sheet, employeeId);

    const entry = await this.entryRepo.findOne({ where: { id: entryId, taskSheetId: sheetId } });
    if (!entry) throw new NotFoundException(`Entry #${entryId} not found in sheet #${sheetId}`);

    await this.entryRepo.remove(entry);
    await this.recalculateTotalHours(sheetId);
    return { message: `Entry #${entryId} deleted` };
  }

  // ── Admin — view any sheet ──────────────────────────────────────────────────

  async adminFindAll(companyId: number, filter: FilterSheetDto & { employeeId?: number; projectId?: number }) {
    const { page = 1, limit = 20, fromDate, toDate, employeeId, projectId } = filter;

    const qb = this.sheetRepo
      .createQueryBuilder('s')
      .leftJoin('s.employee', 'e')
      .addSelect(['e.id', 'e.empCode', 'e.empName', 'e.consultantType'])
      .where('s.companyId = :companyId', { companyId })
      .orderBy('s.sheetDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (fromDate) qb.andWhere('s.sheetDate >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('s.sheetDate <= :toDate', { toDate });
    if (employeeId) qb.andWhere('s.employeeId = :employeeId', { employeeId });

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async adminGetById(id: number, companyId: number): Promise<DailyTaskSheet> {
    const sheet = await this.sheetRepo.findOne({
      where: { id, companyId },
      relations: ['employee', 'taskEntries', 'taskEntries.project', 'taskEntries.taskType'],
    });
    if (!sheet) throw new NotFoundException(`Task sheet #${id} not found`);
    return sheet;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Allow edits on sheets from today and the previous 2 days; block older sheets. */
  private async assertEditable(sheet: DailyTaskSheet, employeeId?: number) {
    const sheetDate = new Date(sheet.sheetDate);
    let maxDays = 3; // default: today + 2 previous days

    // Check if employee has a special fill_days_override
    if (employeeId) {
      const row = await this.dataSource.query(
        'SELECT fill_days_override FROM employees WHERE id = ? LIMIT 1',
        [employeeId],
      );
      if (row?.[0]?.fill_days_override != null) {
        maxDays = Number(row[0].fill_days_override);
      }
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxDays);
    cutoff.setHours(0, 0, 0, 0);
    if (sheetDate < cutoff) {
      throw new ForbiddenException(`Cannot modify a task sheet older than ${maxDays} days`);
    }
  }

  private assertTimeOrder(from: string, to: string) {
    if (from >= to)
      throw new BadRequestException('toTime must be later than fromTime');
  }

  private async recalculateTotalHours(sheetId: number): Promise<void> {
    const result = await this.dataSource.query(
      'SELECT COALESCE(SUM(duration_hours), 0) AS total FROM task_entries WHERE task_sheet_id = ?',
      [sheetId],
    );
    const totalHours = parseFloat(result[0].total) || 0;
    await this.sheetRepo.update(sheetId, { totalHours });
  }
}
