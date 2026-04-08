import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController, EmployeeColleaguesController } from './employees.controller';
import { Employee } from '../database/entities/employee.entity';
import { Company } from '../database/entities/company.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { EmployeeDocument } from '../database/entities/employee-document.entity';
import { EmployeePraise } from '../database/entities/employee-praise.entity';
import { EmployeePip } from '../database/entities/employee-pip.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Company, AdminUser, EmployeeDocument, EmployeePraise, EmployeePip]), NotificationsModule],
  providers: [EmployeesService],
  controllers: [EmployeesController, EmployeeColleaguesController],
  exports: [EmployeesService],
})
export class EmployeesModule {}
