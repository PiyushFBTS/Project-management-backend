import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BirthdayNotifierService } from './birthday-notifier.service';
import { Employee } from '../database/entities/employee.entity';
import { Company } from '../database/entities/company.entity';
import { EmployeesModule } from '../employees/employees.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, Company]),
    EmployeesModule,
    NotificationsModule,
  ],
  providers: [BirthdayNotifierService],
})
export class BirthdayNotifierModule {}
