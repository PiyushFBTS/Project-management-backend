import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('project_types')
export class ProjectTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  value: string;

  @Column({ length: 200 })
  label: string;

  @Column({ length: 500, default: '' })
  description: string;

  @Index('idx_pt_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
