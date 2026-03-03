import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from './company.entity';
import { Employee } from './employee.entity';
import { LeaveRequest } from './leave-request.entity';

@Entity('leave_request_watchers')
export class LeaveRequestWatcher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'leave_request_id' })
  leaveRequestId: number;

  @ManyToOne(() => LeaveRequest, (lr) => lr.watchers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leave_request_id' })
  leaveRequest: LeaveRequest;

  @Index('idx_watcher_employee')
  @Column({ name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Index('idx_watcher_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
