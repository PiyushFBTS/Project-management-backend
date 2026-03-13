import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from './admin-user.entity';
import { Employee } from './employee.entity';
import { Project } from './project.entity';
import { TaskType } from './task-type.entity';
import { Country } from './country.entity';
import { State } from './state.entity';
import { City } from './city.entity';
import { Currency } from './currency.entity';

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

  @Column({ name: 'company_code', length: 50, nullable: true })
  companyCode: string | null;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  // ── Location fields ──────────────────────────────────────────────────────

  @Column({ name: 'country_id', nullable: true })
  countryId: number | null;

  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country: Country | null;

  @Column({ name: 'state_id', nullable: true })
  stateId: number | null;

  @ManyToOne(() => State, { nullable: true })
  @JoinColumn({ name: 'state_id' })
  state: State | null;

  @Column({ name: 'city_id', nullable: true })
  cityId: number | null;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  @Column({ name: 'postal_code', length: 20, nullable: true })
  postalCode: string | null;

  // ── Contact ──────────────────────────────────────────────────────────────

  @Column({ name: 'contact_person_name', length: 150, nullable: true })
  contactPersonName: string | null;

  @Column({ name: 'contact_email', length: 150, nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string | null;

  // ── Tax / Registration ───────────────────────────────────────────────────

  @Column({ name: 'gst_number', length: 50, nullable: true })
  gstNumber: string | null;

  @Column({ name: 'pan_number', length: 20, nullable: true })
  panNumber: string | null;

  @Column({ name: 'tax_id', length: 50, nullable: true })
  taxId: string | null;

  @Column({ name: 'gstin', length: 50, nullable: true })
  gstin: string | null;

  @Column({ name: 'tax_registration_number', length: 50, nullable: true })
  taxRegistrationNumber: string | null;

  @Column({ name: 'gst_enabled', default: false })
  gstEnabled: boolean;

  @Column({ name: 'vat_enabled', default: false })
  vatEnabled: boolean;

  // ── Currency ─────────────────────────────────────────────────────────────

  @Column({ name: 'base_currency_code', length: 3, nullable: true })
  baseCurrencyCode: string | null;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'base_currency_code', referencedColumnName: 'code' })
  baseCurrency: Currency | null;

  // ── Licensing ────────────────────────────────────────────────────────────

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

  // ── Relations ────────────────────────────────────────────────────────────

  @OneToMany(() => AdminUser, (admin) => admin.company)
  admins: AdminUser[];

  @OneToMany(() => Employee, (employee) => employee.company)
  employees: Employee[];

  @OneToMany(() => Project, (project) => project.company)
  projects: Project[];

  @OneToMany(() => TaskType, (taskType) => taskType.company)
  taskTypes: TaskType[];

  // ── Audit ────────────────────────────────────────────────────────────────

  @Column({ name: 'created_by', nullable: true })
  createdBy: number | null;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
