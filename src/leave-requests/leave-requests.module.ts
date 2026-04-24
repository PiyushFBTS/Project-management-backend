import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequestsEmployeeController } from './leave-requests-employee.controller';
import { LeaveRequestsAdminController } from './leave-requests-admin.controller';
import { LeaveRequest } from '../database/entities/leave-request.entity';
import { LeaveRequestWatcher } from '../database/entities/leave-request-watcher.entity';
import { LeaveType } from '../database/entities/leave-reason.entity';
import { Employee } from '../database/entities/employee.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest, LeaveRequestWatcher, LeaveType, Employee, AdminUser]),
    NotificationsModule,
  ],
  providers: [LeaveRequestsService],
  controllers: [LeaveRequestsEmployeeController, LeaveRequestsAdminController],
  exports: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
