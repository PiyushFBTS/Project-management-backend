import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, And, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { EmailLog, EmailAttachment, EmailStatus } from '../database/entities/email-log.entity';
import { FilterEmailLogsDto, FilterEmailLogsPlatformDto } from './dto/filter-email-logs.dto';

@Injectable()
export class EmailLogsService {
  constructor(
    @InjectRepository(EmailLog)
    private readonly repo: Repository<EmailLog>,
  ) {}

  // ── Called from SmtpService after successful send ─────────────────────────

  async logEmail(data: {
    subject?: string;
    body?: string;
    toEmail: string;
    fromEmail?: string;
    fromName?: string;
    triggeredBy?: string;
    companyId?: number | null;
    status?: EmailStatus;
    errorMessage?: string;
    attachments?: EmailAttachment[];
  }): Promise<void> {
    const log = this.repo.create({
      subject: data.subject ?? null,
      body: data.body ?? null,
      toEmail: data.toEmail,
      fromEmail: data.fromEmail ?? null,
      fromName: data.fromName ?? null,
      triggeredBy: data.triggeredBy ?? null,
      companyId: data.companyId ?? null,
      status: data.status ?? EmailStatus.SENT,
      errorMessage: data.errorMessage ?? null,
      attachments: data.attachments?.length ? data.attachments : null,
    });
    await this.repo.save(log);
  }

  // ── Admin: list company's email logs ─────────────────────────────────────

  async findAll(companyId: number, filter: FilterEmailLogsDto) {
    const { page = 1, limit = 20, search, status, dateFrom, dateTo } = filter;

    const where: any = { companyId };

    if (status) where.status = status;

    if (dateFrom && dateTo) {
      where.sentAt = Between(new Date(dateFrom), new Date(dateTo + 'T23:59:59'));
    } else if (dateFrom) {
      where.sentAt = MoreThanOrEqual(new Date(dateFrom));
    } else if (dateTo) {
      where.sentAt = LessThanOrEqual(new Date(dateTo + 'T23:59:59'));
    }

    const skip = (page - 1) * limit;

    let qb = this.repo
      .createQueryBuilder('log')
      .where('log.company_id = :companyId', { companyId })
      .orderBy('log.sent_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) qb = qb.andWhere('log.status = :status', { status });
    if (dateFrom) qb = qb.andWhere('log.sent_at >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) qb = qb.andWhere('log.sent_at <= :dateTo', { dateTo: new Date(dateTo + 'T23:59:59') });
    if (search) {
      qb = qb.andWhere(
        '(log.subject LIKE :search OR log.to_email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Admin: single log ────────────────────────────────────────────────────

  async findOne(id: number, companyId: number): Promise<EmailLog> {
    const log = await this.repo.findOne({ where: { id, companyId } });
    if (!log) throw new NotFoundException('Email log not found.');
    return log;
  }

  // ── Platform: email logs (super admin) ───────────────────────────────────
  //
  // Isolation rules:
  //   • No companyId supplied  → platform-only emails (company_id IS NULL)
  //   • companyId supplied     → that specific company's emails
  //
  // This ensures company emails never appear in the super admin's platform
  // inbox, and are only visible when the super admin explicitly selects a company.

  async findAllPlatform(filter: FilterEmailLogsPlatformDto) {
    const { page = 1, limit = 20, search, status, dateFrom, dateTo, companyId } = filter;

    const skip = (page - 1) * limit;

    let qb = this.repo
      .createQueryBuilder('log')
      .orderBy('log.sent_at', 'DESC')
      .skip(skip)
      .take(limit);

    // Scope strictly: show a company's emails OR platform-only emails — never all
    if (companyId) {
      qb = qb.andWhere('log.company_id = :companyId', { companyId });
    } else {
      qb = qb.andWhere('log.company_id IS NULL');
    }

    if (status) qb = qb.andWhere('log.status = :status', { status });
    if (dateFrom) qb = qb.andWhere('log.sent_at >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) qb = qb.andWhere('log.sent_at <= :dateTo', { dateTo: new Date(dateTo + 'T23:59:59') });
    if (search) {
      qb = qb.andWhere(
        '(log.subject LIKE :search OR log.to_email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Platform: single log ─────────────────────────────────────────────────

  async findOnePlatform(id: number): Promise<EmailLog> {
    const log = await this.repo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Email log not found.');
    return log;
  }
}
