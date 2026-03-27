import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { Employee } from '../database/entities/employee.entity';
import { Project } from '../database/entities/project.entity';
import { TaskType } from '../database/entities/task-type.entity';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Project, TaskType]), ReportsModule],
  providers: [EmployeeService],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
