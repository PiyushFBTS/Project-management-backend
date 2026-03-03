import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveReasonsService } from './leave-reasons.service';
import { LeaveReasonsController, EmployeeLeaveReasonsController } from './leave-reasons.controller';
import { LeaveReason } from '../database/entities/leave-reason.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveReason])],
  providers: [LeaveReasonsService],
  controllers: [LeaveReasonsController, EmployeeLeaveReasonsController],
  exports: [LeaveReasonsService],
})
export class LeaveReasonsModule {}
