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
  ): Promise<Notification> {
    const notif = this.notifRepo.create({
      type, title, message, companyId,
      metadata: metadata ?? null,
      targetEmployeeId: targetEmployeeId ?? null,
    });
    return this.notifRepo.save(notif);
  }

  // ── Query ─────────────────────────────────────────────────────────────────────

  async findAll(companyId: number, limit = 30) {
    const [data, total] = await this.notifRepo.findAndCount({
      where: { companyId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    const unreadCount = await this.notifRepo.count({ where: { isRead: false, companyId } });
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
