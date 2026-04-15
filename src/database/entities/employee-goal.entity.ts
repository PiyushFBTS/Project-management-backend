import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type GoalTimeframe = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
export type GoalStatus = 'not_started' | 'started' | 'in_progress' | 'finished';

@Entity('employee_goals')
export class EmployeeGoal {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_goal_employee')
  @Column({ name: 'employee_id' })
  employeeId: number;

  @Index('idx_goal_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'],
    default: 'monthly',
  })
  timeframe: GoalTimeframe;

  @Column({ name: 'progress_percent', type: 'int', default: 0 })
  progressPercent: number;

  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate: string | null;

  @Column({
    type: 'enum',
    enum: ['not_started', 'started', 'in_progress', 'finished'],
    default: 'not_started',
  })
  status: GoalStatus;

  @Column({ name: 'created_by_id' })
  createdById: number;

  @Column({ name: 'created_by_type', type: 'enum', enum: ['admin', 'employee'] })
  createdByType: 'admin' | 'employee';

  @Column({ name: 'created_by_name', length: 150 })
  createdByName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
