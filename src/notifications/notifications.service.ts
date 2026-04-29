import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  // ── Create helpers (called by other services) ────────────────────────────────

  async create(
    type: NotificationType,
    title: string,
    message: string,
    companyId: number,
    metadata?: Record<string, unknown>,
    targetEmployeeId?: number,
    originatorAdminId?: number,
  ): Promise<Notification> {
    const notif = this.notifRepo.create({
      type, title, message, companyId,
      metadata: metadata ?? null,
      targetEmployeeId: targetEmployeeId ?? null,
      originatorAdminId: originatorAdminId ?? null,
    });
    return this.notifRepo.save(notif);
  }

  // ── Query ─────────────────────────────────────────────────────────────────────

  /**
   * Admin notification feed. When `excludeOriginatorAdminId` is provided,
   * notifications that this admin themselves triggered are filtered out so
   * they don't see alerts about their own actions (e.g. their own task
   * sheet submission or their own leave request). Peer admins of the same
   * company still see them.
   */
  async findAll(companyId: number, limit = 30, excludeOriginatorAdminId?: number) {
    const baseQb = () => {
      const qb = this.notifRepo
        .createQueryBuilder('n')
        .where('n.company_id = :companyId', { companyId });
      if (excludeOriginatorAdminId) {
        // NULL-safe exclusion: keep rows where the column is NULL or where it
        // belongs to a different admin. A bare `!=` would drop NULL rows too.
        qb.andWhere(
          '(n.originator_admin_id IS NULL OR n.originator_admin_id != :adminId)',
          { adminId: excludeOriginatorAdminId },
        );
      }
      return qb;
    };

    const [data, total] = await baseQb()
      .orderBy('n.created_at', 'DESC')
      .take(limit)
      .getManyAndCount();
    const unreadCount = await baseQb()
      .andWhere('n.is_read = :isRead', { isRead: false })
      .getCount();
    return { data, meta: { total, unreadCount } };
  }

  // ── Employee-specific query ──────────────────────────────────────────────────

  async findForEmployee(employeeId: number, companyId: number, limit = 30) {
    const [data, total] = await this.notifRepo.findAndCount({
      where: { companyId, targetEmployeeId: employeeId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    const unreadCount = await this.notifRepo.count({
      where: { isRead: false, companyId, targetEmployeeId: employeeId },
    });
    return { data, meta: { total, unreadCount } };
  }

  async markReadForEmployee(id: number, employeeId: number, companyId: number) {
    await this.notifRepo.update({ id, companyId, targetEmployeeId: employeeId }, { isRead: true });
    return { success: true };
  }

  async markAllReadForEmployee(employeeId: number, companyId: number) {
    await this.notifRepo.update(
      { isRead: false, companyId, targetEmployeeId: employeeId },
      { isRead: true },
    );
    return { success: true };
  }

  async removeForEmployee(id: number, employeeId: number, companyId: number) {
    await this.notifRepo.delete({ id, companyId, targetEmployeeId: employeeId });
    return { success: true };
  }

  async clearAllForEmployee(employeeId: number, companyId: number) {
    await this.notifRepo.delete({ companyId, targetEmployeeId: employeeId });
    return { success: true };
  }

  // ── Mark read ─────────────────────────────────────────────────────────────────

  async markRead(id: number, companyId: number) {
    await this.notifRepo.update({ id, companyId }, { isRead: true });
    return { success: true };
  }

  async markAllRead(companyId: number) {
    await this.notifRepo.update({ isRead: false, companyId }, { isRead: true });
    return { success: true };
  }

  // ── Delete ─────────────────────────────────────────────────────────────────────

  async remove(id: number, companyId: number) {
    await this.notifRepo.delete({ id, companyId });
    return { success: true };
  }

  async clearAll(companyId: number) {
    await this.notifRepo.delete({ companyId });
    return { success: true };
  }
}
