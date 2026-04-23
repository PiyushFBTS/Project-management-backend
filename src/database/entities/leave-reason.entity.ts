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

@Entity('leave_reasons')
export class LeaveType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reason_code', length: 50 })
  reasonCode: string;

  @Column({ name: 'reason_name', length: 150 })
  reasonName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * Annual allowance in days for this leave type. Employees can apply for
   * leave against this quota; the leave-balance screen deducts approved
   * requests. Zero means "uncapped / as per policy" — no enforcement.
   */
  @Column({ name: 'default_days', type: 'int', default: 0 })
  defaultDays: number;

  @Index('idx_leave_reason_company')
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
