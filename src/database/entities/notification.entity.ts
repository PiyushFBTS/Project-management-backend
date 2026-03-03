import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Company } from './company.entity';
import { Employee } from './employee.entity';

export enum NotificationType {
  EMPLOYEE_CREATED    = 'employee_created',
  EMPLOYEE_DEACTIVATED = 'employee_deactivated',
  PROJECT_CREATED     = 'project_created',
  PROJECT_UPDATED     = 'project_updated',
  TASK_SHEET_SUBMITTED = 'task_sheet_submitted',
  LEAVE_REQUEST_SUBMITTED        = 'leave_request_submitted',
  LEAVE_REQUEST_MANAGER_APPROVED = 'leave_request_manager_approved',
  LEAVE_REQUEST_MANAGER_REJECTED = 'leave_request_manager_rejected',
  LEAVE_REQUEST_HR_APPROVED      = 'leave_request_hr_approved',
  LEAVE_REQUEST_HR_REJECTED      = 'leave_request_hr_rejected',
  LEAVE_REQUEST_CANCELLED        = 'leave_request_cancelled',
  TASK_ASSIGNED                  = 'task_assigned',
  TASK_STATUS_CHANGED            = 'task_status_changed',
  TASK_COMMENTED                 = 'task_commented',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'target_employee_id', nullable: true })
  targetEmployeeId: number | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'target_employee_id' })
  targetEmployee: Employee | null;

  @Index('idx_notification_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
