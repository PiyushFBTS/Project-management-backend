import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Company } from './company.entity';
import { Employee } from './employee.entity';
import { LeaveReason } from './leave-reason.entity';
import { LeaveRequestWatcher } from './leave-request-watcher.entity';

export enum LeaveRequestStatus {
  PENDING = 'pending',
  MANAGER_APPROVED = 'manager_approved',
  MANAGER_REJECTED = 'manager_rejected',
  HR_APPROVED = 'hr_approved',
  HR_REJECTED = 'hr_rejected',
  CANCELLED = 'cancelled',
}

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'leave_reason_id' })
  leaveReasonId: number;

  @ManyToOne(() => LeaveReason, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'leave_reason_id' })
  leaveReason: LeaveReason;

  @Column({ name: 'date_from', type: 'date' })
  dateFrom: string;

  @Column({ name: 'date_to', type: 'date' })
  dateTo: string;

  @Column({ name: 'total_days', type: 'int', insert: false, update: false })
  totalDays: number;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Index('idx_leave_req_status')
  @Column({ type: 'enum', enum: LeaveRequestStatus, default: LeaveRequestStatus.PENDING })
  status: LeaveRequestStatus;

  @Column({ name: 'manager_id', nullable: true })
  managerId: number | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_id' })
  manager: Employee;

  @Column({ name: 'manager_action_at', type: 'timestamp', nullable: true })
  managerActionAt: Date | null;

  @Column({ name: 'manager_remarks', type: 'text', nullable: true })
  managerRemarks: string | null;

  @Column({ name: 'hr_id', nullable: true })
  hrId: number | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'hr_id' })
  hr: Employee;

  @Column({ name: 'hr_action_at', type: 'timestamp', nullable: true })
  hrActionAt: Date | null;

  @Column({ name: 'hr_remarks', type: 'text', nullable: true })
  hrRemarks: string | null;

  @Index('idx_leave_req_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => LeaveRequestWatcher, (w) => w.leaveRequest)
  watchers: LeaveRequestWatcher[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
