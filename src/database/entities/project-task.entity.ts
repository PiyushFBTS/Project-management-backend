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
import { Project } from './project.entity';
import { ProjectPhase } from './project-phase.entity';
import { Employee } from './employee.entity';
import { AdminUser } from './admin-user.entity';
import { ClientUser } from './client-user.entity';
import { ProjectTaskComment } from './project-task-comment.entity';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ProjectTaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  CLOSED = 'closed',
}

@Entity('project_tasks')
export class ProjectTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_task_project')
  @Column({ name: 'project_id' })
  projectId: number;

  @ManyToOne(() => Project, (p) => p.projectTasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Index('idx_task_phase')
  @Column({ name: 'phase_id', nullable: true })
  phaseId: number | null;

  @ManyToOne(() => ProjectPhase, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'phase_id' })
  phase: ProjectPhase | null;

  @Index('idx_task_ticket', { unique: true })
  @Column({ name: 'ticket_number', length: 30, unique: true, nullable: true })
  ticketNumber: string | null;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('idx_task_assignee')
  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: number | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: Employee | null;

  @Column({ name: 'assigned_admin_id', nullable: true })
  assignedAdminId: number | null;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_admin_id' })
  assignedAdmin: AdminUser | null;

  @Column({ name: 'assigned_client_id', nullable: true })
  assignedClientId: number | null;

  @ManyToOne(() => ClientUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_client_id' })
  assignedClient: ClientUser | null;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Index('idx_task_status')
  @Column({
    type: 'enum',
    enum: ProjectTaskStatus,
    default: ProjectTaskStatus.TODO,
  })
  status: ProjectTaskStatus;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  @Column({
    name: 'estimated_hours',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  estimatedHours: number | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Index('idx_task_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => ProjectTaskComment, (c) => c.task)
  comments: ProjectTaskComment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
