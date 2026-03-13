import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveTypesService } from './leave-reasons.service';
import { LeaveTypesController, EmployeeLeaveTypesController } from './leave-reasons.controller';
import { LeaveType } from '../database/entities/leave-reason.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveType])],
  providers: [LeaveTypesService],
  controllers: [LeaveTypesController, EmployeeLeaveTypesController],
  exports: [LeaveTypesService],
})
export class LeaveTypesModule {}
