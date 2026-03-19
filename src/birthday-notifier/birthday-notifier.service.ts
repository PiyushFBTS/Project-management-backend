import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../database/entities/employee.entity';
import { Company } from '../database/entities/company.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../database/entities/notification.entity';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class BirthdayNotifierService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(Employee) private readonly employeeRepo: Repository<Employee>,
  ) {}

  /** Runs every day at 08:00 */
  @Cron('0 8 * * *')
  async notifyAllCompanies() {
    const companies = await this.companyRepo.find({ where: { isActive: true } });
    for (const company of companies) {
      await this.notifyCompany(company.id);
    }
  }

  async notifyCompany(companyId: number) {
    const events = await this.employeesService.getTodayEvents(companyId);
    if (events.length === 0) return;

    const hrEmployees = await this.employeeRepo.find({
      where: { companyId, isActive: true, isHr: true },
      select: ['id'],
    });
    if (hrEmployees.length === 0) return;

    for (const event of events) {
      const isBirthday = event.type === 'birthday';
      const title = isBirthday
        ? `Birthday Today: ${event.name}`
        : `Work Anniversary Today: ${event.name}`;
      const message = isBirthday
        ? `Today is ${event.name}'s birthday! Don't forget to wish them.`
        : `Today marks ${event.name}'s work anniversary! Celebrate this milestone.`;

      for (const hr of hrEmployees) {
        await this.notificationsService.create(
          isBirthday ? NotificationType.BIRTHDAY : NotificationType.WORK_ANNIVERSARY,
          title,
          message,
          companyId,
          { eventPersonId: event.id, eventPersonType: event._type },
          hr.id,
        );
      }
    }
  }
}
