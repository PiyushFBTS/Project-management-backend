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
import { DailyTaskSheet } from './daily-task-sheet.entity';

export enum ConsultantType {
  PROJECT_MANAGER = 'project_manager',
  FUNCTIONAL = 'functional',
  TECHNICAL = 'technical',
  MANAGEMENT = 'management',
  CORE_TEAM = 'core_team',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'emp_code', length: 50 })
  empCode: string;

  @Column({ name: 'emp_name', length: 150 })
  empName: string;

  @Column({
    name: 'consultant_type',
    type: 'enum',
    enum: ConsultantType,
  })
  consultantType: ConsultantType;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'mobile_number', length: 20 })
  mobileNumber: string;

  @Column({ name: 'assigned_project_id', nullable: true })
  assignedProjectId: number;

  @ManyToOne(() => Project, (project) => project.employees, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigned_project_id' })
  assignedProject: Project;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'reports_to_id', nullable: true })
  reportsToId: number | null;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reports_to_id' })
  reportsTo: Employee;

  @Column({ name: 'is_report_to_admin', default: false })
  isReportToAdmin: boolean;

  @Column({ name: 'reports_to_admin_id', nullable: true })
  reportsToAdminId: number | null;

  @ManyToOne('AdminUser', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reports_to_admin_id' })
  reportsToAdmin: any;

  @Column({ name: 'is_hr', default: false })
  isHr: boolean;

  // Independent of HR. An accounts-permissioned employee can view all
  // expenses and mark approved ones as paid/unpaid. Same employee may
  // hold both flags.
  @Column({ name: 'is_accounts', default: false })
  isAccounts: boolean;

  @Column({ name: 'fill_days_override', type: 'int', nullable: true, default: null })
  fillDaysOverride: number | null;

  @Column({ name: 'annual_ctc', type: 'decimal', precision: 14, scale: 2, nullable: true, default: null })
  annualCTC: number | null;

  @Column({ name: 'blood_group', length: 10, nullable: true })
  bloodGroup: string | null;

  @Column({ name: 'marital_status', length: 20, nullable: true })
  maritalStatus: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ name: 'joining_date', type: 'date', nullable: true })
  joiningDate: string | null;

  @Index('idx_employee_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.employees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => DailyTaskSheet, (sheet) => sheet.employee)
  taskSheets: DailyTaskSheet[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
