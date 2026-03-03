import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from './admin-user.entity';
import { Employee } from './employee.entity';
import { Project } from './project.entity';
import { TaskType } from './task-type.entity';

export enum SubscriptionPlan {
  TRIAL = 'trial',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'contact_email', length: 150, nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'user_limit', type: 'int', default: 50 })
  userLimit: number;

  @Column({ name: 'license_expiry_date', type: 'date' })
  licenseExpiryDate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    name: 'subscription_plan',
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.TRIAL,
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'subscription_start', type: 'date', nullable: true })
  subscriptionStart: string | null;

  @OneToMany(() => AdminUser, (admin) => admin.company)
  admins: AdminUser[];

  @OneToMany(() => Employee, (employee) => employee.company)
  employees: Employee[];

  @OneToMany(() => Project, (project) => project.company)
  projects: Project[];

  @OneToMany(() => TaskType, (taskType) => taskType.company)
  taskTypes: TaskType[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
