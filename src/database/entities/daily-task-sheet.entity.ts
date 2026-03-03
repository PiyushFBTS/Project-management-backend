import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Company } from './company.entity';
import { Employee } from './employee.entity';
import { TaskEntry } from './task-entry.entity';

@Entity('daily_task_sheets')
@Unique('uq_emp_date', ['employeeId', 'sheetDate'])
export class DailyTaskSheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => Employee, (employee) => employee.taskSheets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'sheet_date', type: 'date' })
  sheetDate: string;

  @Column({
    name: 'total_hours',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0.0,
  })
  totalHours: number;

  // GENERATED STORED column — automatically computed by MySQL as ROUND(total_hours / 8, 2)
  // TypeORM reads this value but never writes it
  @Column({
    name: 'man_days',
    type: 'decimal',
    precision: 5,
    scale: 2,
    generatedType: 'STORED',
    asExpression: 'ROUND(total_hours / 8, 2)',
    nullable: true,
    insert: false,
    update: false,
  })
  manDays: number;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ name: 'is_submitted', default: false })
  isSubmitted: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Index('idx_tasksheet_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => TaskEntry, (entry) => entry.taskSheet, { cascade: true })
  taskEntries: TaskEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
