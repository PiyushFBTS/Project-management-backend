import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { Employee } from '../database/entities/employee.entity';
import { Project } from '../database/entities/project.entity';
import { TaskType } from '../database/entities/task-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Project, TaskType])],
  providers: [EmployeeService],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
