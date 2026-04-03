import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Project } from './project.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: string;

  @Column({ name: 'expense_date_to', type: 'date', nullable: true })
  expenseDateTo: string | null;

  @Column({ name: 'project_id', nullable: true })
  projectId: number | null;

  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: number | null;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'submitter_type', type: 'enum', enum: ['employee', 'admin'], default: 'employee' })
  submitterType: 'employee' | 'admin';

  @Column({ name: 'submitter_name', length: 255, nullable: true })
  submitterName: string | null;

  @Column({ name: 'expense_type', length: 50 })
  expenseType: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'attachment_path', length: 500, nullable: true })
  attachmentPath: string | null;

  @Column({ name: 'attachment_name', length: 255, nullable: true })
  attachmentName: string | null;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: number | null;

  @Column({ name: 'approved_by_name', length: 255, nullable: true })
  approvedByName: string | null;

  @Column({ name: 'approved_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  approvedAmount: number | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ name: 'company_id' })
  companyId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
