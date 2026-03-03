import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskTypesService } from './task-types.service';
import { TaskTypesController, EmployeeTaskTypesController } from './task-types.controller';
import { TaskType } from '../database/entities/task-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskType])],
  providers: [TaskTypesService],
  controllers: [TaskTypesController, EmployeeTaskTypesController],
  exports: [TaskTypesService],
})
export class TaskTypesModule {}
