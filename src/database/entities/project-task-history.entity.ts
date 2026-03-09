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
import { ProjectTask } from './project-task.entity';

export enum TaskHistoryAction {
  CREATED = 'created',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  REASSIGNED = 'reassigned',
  CLOSED = 'closed',
  PRIORITY_CHANGED = 'priority_changed',
  UPDATED = 'updated',
}

@Entity('project_task_history')
export class ProjectTaskHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_history_task')
  @Column({ name: 'task_id' })
  taskId: number;

  @ManyToOne(() => ProjectTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: ProjectTask;

  @Column({ name: 'action', type: 'enum', enum: TaskHistoryAction })
  action: TaskHistoryAction;

  @Column({ name: 'performed_by_id' })
  performedById: number;

  @Column({ name: 'performed_by_type', type: 'enum', enum: ['admin', 'employee'] })
  performedByType: 'admin' | 'employee';

  @Column({ name: 'performed_by_name', length: 200 })
  performedByName: string;

  @Column({ name: 'old_value', length: 500, nullable: true })
  oldValue: string | null;

  @Column({ name: 'new_value', length: 500, nullable: true })
  newValue: string | null;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Index('idx_history_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
