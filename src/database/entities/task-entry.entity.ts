import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Company } from './company.entity';
import { DailyTaskSheet } from './daily-task-sheet.entity';
import { Project } from './project.entity';
import { TaskType } from './task-type.entity';

export enum TaskStatus {
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  FAILED = 'failed',
  AWAITING_RESPONSE = 'awaiting_response',
}

@Entity('task_entries')
export class TaskEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'task_sheet_id' })
  taskSheetId: number;

  @ManyToOne(() => DailyTaskSheet, (sheet) => sheet.taskEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_sheet_id' })
  taskSheet: DailyTaskSheet;

  @Column({ name: 'project_id', nullable: true })
  projectId: number | null;

  @ManyToOne(() => Project, (project) => project.taskEntries, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'other_project_name', type: 'varchar', length: 255, nullable: true })
  otherProjectName: string | null;

  @Column({ name: 'task_type_id', nullable: true })
  taskTypeId: number;

  @ManyToOne(() => TaskType, (taskType) => taskType.taskEntries, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'task_type_id' })
  taskType: TaskType;

  // Optional reference to a project ticket this entry belongs to
  @Column({ name: 'ticket_id', type: 'int', nullable: true })
  ticketId: number | null;

  // Freeform activity classifier when no ticket: internal_meeting, client_meeting, others, etc.
  @Column({ name: 'activity_type', type: 'varchar', length: 30, nullable: true })
  activityType: string | null;

  @Column({ name: 'from_time', type: 'time' })
  fromTime: string;

  @Column({ name: 'to_time', type: 'time' })
  toTime: string;

  // GENERATED STORED column — MySQL computes: ROUND(TIMESTAMPDIFF(MINUTE, from_time, to_time) / 60, 2)
  // TypeORM reads this value but never writes it
  @Column({
    name: 'duration_hours',
    type: 'decimal',
    precision: 5,
    scale: 2,
    generatedType: 'STORED',
    asExpression:
      'ROUND(TIMESTAMPDIFF(MINUTE, from_time, to_time) / 60, 2)',
    nullable: true,
    insert: false,
    update: false,
  })
  durationHours: number;

  @Column({ name: 'task_description', type: 'text' })
  taskDescription: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.IN_PROGRESS,
  })
  status: TaskStatus;

  @Index('idx_taskentry_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
