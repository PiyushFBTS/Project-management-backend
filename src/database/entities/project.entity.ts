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
import { AdminUser } from './admin-user.entity';
import { Employee } from './employee.entity';
import { TaskEntry } from './task-entry.entity';
import { ProjectPhase } from './project-phase.entity';
import { ProjectTask } from './project-task.entity';

export enum ProjectType {
  PROJECT = 'project',
  SUPPORT = 'support',
  DEVELOPMENT = 'development',
  CONSULTING = 'consulting',
  MIGRATION = 'migration',
  MAINTENANCE = 'maintenance',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_code', length: 50 })
  projectCode: string;

  @Column({ name: 'project_name', length: 200 })
  projectName: string;

  @Column({ name: 'project_type', type: 'enum', enum: ProjectType })
  projectType: ProjectType;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Column({ name: 'client_name', length: 200, nullable: true })
  clientName: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'project_manager_id', nullable: true })
  projectManagerId: number;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_manager_id' })
  projectManager: Employee;

  @Column({ name: 'created_by', nullable: true })
  createdById: number;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: AdminUser;

  @Index('idx_project_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => Employee, (employee) => employee.assignedProject)
  employees: Employee[];

  @OneToMany(() => TaskEntry, (entry) => entry.project)
  taskEntries: TaskEntry[];

  @OneToMany(() => ProjectPhase, (phase) => phase.project)
  phases: ProjectPhase[];

  @OneToMany(() => ProjectTask, (task) => task.project)
  projectTasks: ProjectTask[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
