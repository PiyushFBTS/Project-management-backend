import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../database/entities/expense.entity';
import { CreateExpenseDto, UpdateExpenseStatusDto } from './dto/create-expense.dto';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
  ) {}

  // ── Employee: create expense ──────────────────────────────────────────

  async create(employeeId: number, companyId: number, dto: CreateExpenseDto, file?: Express.Multer.File) {
    const expense = this.expenseRepo.create({
      expenseDate: dto.expenseDate,
      expenseDateTo: dto.expenseDateTo ?? null,
      projectId: dto.projectId ?? null,
      employeeId,
      submitterType: 'employee',
      expenseType: dto.expenseType,
      description: dto.description ?? null,
      amount: dto.amount,
      attachmentPath: file ? `/uploads/expenses/${file.filename}` : null,
      attachmentName: file ? file.originalname : null,
      companyId,
    });
    return this.expenseRepo.save(expense);
  }

  // ── Admin: create expense ──────────────────────────────────────────────

  async createByAdmin(adminId: number, adminName: string, companyId: number, dto: CreateExpenseDto, file?: Express.Multer.File) {
    const expense = this.expenseRepo.create({
      expenseDate: dto.expenseDate,
      expenseDateTo: dto.expenseDateTo ?? null,
      projectId: dto.projectId ?? null,
      employeeId: null,
      submitterType: 'admin',
      submitterName: adminName,
      expenseType: dto.expenseType,
      description: dto.description ?? null,
      amount: dto.amount,
      attachmentPath: file ? `/uploads/expenses/${file.filename}` : null,
      attachmentName: file ? file.originalname : null,
      companyId,
    });
    // Store the admin ID in employeeId field temporarily (null since it's admin)
    (expense as any).approvedBy = null;
    return this.expenseRepo.save(expense);
  }

  // ── Admin: list own expenses ───────────────────────────────────────────

  async getAdminOwnExpenses(adminId: number, companyId: number, page = 1, limit = 50) {
    // Admin's own expenses have submitterType='admin' and no employeeId
    const qb = this.expenseRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.project', 'p')
      .where('e.companyId = :companyId', { companyId })
      .andWhere('e.submitterType = :type', { type: 'admin' })
      .andWhere('e.submitterName = (SELECT name FROM admin_users WHERE id = :adminId AND company_id = :companyId)', { adminId, companyId })
      .orderBy('e.expenseDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ── Get one expense ────────────────────────────────────────────────────

  async getOne(expenseId: number, companyId: number, employeeId?: number) {
    const where: any = { id: expenseId, companyId };
    if (employeeId) where.employeeId = employeeId;
    const expense = await this.expenseRepo.findOne({ where, relations: ['project', 'employee'] });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  // ── Employee: list own expenses ───────────────────────────────────────

  async getMyExpenses(employeeId: number, companyId: number, page = 1, limit = 50) {
    const [data, total] = await this.expenseRepo.findAndCount({
      where: { employeeId, companyId },
      relations: ['project'],
      order: { expenseDate: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Employee: update own expense (only if pending) ────────────────────

  async updateOwn(expenseId: number, employeeId: number, companyId: number, dto: Partial<CreateExpenseDto>, file?: Express.Multer.File) {
    const expense = await this.expenseRepo.findOne({ where: { id: expenseId, employeeId, companyId } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status !== 'pending') throw new ForbiddenException('Cannot edit approved/rejected expense');

    if (dto.expenseDate) expense.expenseDate = dto.expenseDate;
    if (dto.projectId !== undefined) expense.projectId = dto.projectId ?? null;
    if (dto.expenseType) expense.expenseType = dto.expenseType;
    if (dto.description !== undefined) expense.description = dto.description ?? null;
    if (dto.amount) expense.amount = dto.amount;
    if (file) {
      // Remove old attachment
      if (expense.attachmentPath) {
        try { fs.unlinkSync(join(process.cwd(), expense.attachmentPath)); } catch { /* ignore */ }
      }
      expense.attachmentPath = `/uploads/expenses/${file.filename}`;
      expense.attachmentName = file.originalname;
    }

    return this.expenseRepo.save(expense);
  }

  // ── Employee: delete own expense (only if pending) ────────────────────

  async deleteOwn(expenseId: number, employeeId: number, companyId: number) {
    const expense = await this.expenseRepo.findOne({ where: { id: expenseId, employeeId, companyId } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status !== 'pending') throw new ForbiddenException('Cannot delete approved/rejected expense');

    if (expense.attachmentPath) {
      try { fs.unlinkSync(join(process.cwd(), expense.attachmentPath)); } catch { /* ignore */ }
    }
    await this.expenseRepo.remove(expense);
    return { message: 'Expense deleted' };
  }

  // ── Admin: list all expenses ──────────────────────────────────────────

  async getAll(companyId: number, page = 1, limit = 50, filters?: { employeeId?: number; status?: string; projectId?: number; fromDate?: string; toDate?: string }) {
    const qb = this.expenseRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.project', 'p')
      .leftJoinAndSelect('e.employee', 'emp')
      .where('e.companyId = :companyId', { companyId });

    if (filters?.employeeId) qb.andWhere('e.employeeId = :empId', { empId: filters.employeeId });
    if (filters?.status) qb.andWhere('e.status = :status', { status: filters.status });
    if (filters?.projectId) qb.andWhere('e.projectId = :projId', { projId: filters.projectId });
    if (filters?.fromDate) qb.andWhere('e.expenseDate >= :from', { from: filters.fromDate });
    if (filters?.toDate) qb.andWhere('e.expenseDate <= :to', { to: filters.toDate });

    qb.orderBy('e.expenseDate', 'DESC').addOrderBy('e.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ── Admin: approve/reject expense ─────────────────────────────────────

  async updateStatus(expenseId: number, companyId: number, adminId: number, dto: UpdateExpenseStatusDto, adminName?: string) {
    const expense = await this.expenseRepo.findOne({ where: { id: expenseId, companyId } });
    if (!expense) throw new NotFoundException('Expense not found');

    expense.status = dto.status;
    expense.approvedBy = adminId;
    expense.approvedByName = adminName ?? null;
    expense.approvedAt = new Date();
    if (dto.remarks) expense.remarks = dto.remarks;
    if (dto.approvedAmount !== undefined) expense.approvedAmount = dto.approvedAmount;

    return this.expenseRepo.save(expense);
  }

  // ── Admin: delete any expense ─────────────────────────────────────────

  async deleteByAdmin(expenseId: number, companyId: number) {
    const expense = await this.expenseRepo.findOne({ where: { id: expenseId, companyId } });
    if (!expense) throw new NotFoundException('Expense not found');

    if (expense.attachmentPath) {
      try { fs.unlinkSync(join(process.cwd(), expense.attachmentPath)); } catch { /* ignore */ }
    }
    await this.expenseRepo.remove(expense);
    return { message: 'Expense deleted' };
  }
}
