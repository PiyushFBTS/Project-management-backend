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
import { Project } from './project.entity';

@Entity('client_users')
export class ClientUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Index('idx_client_email')
  @Column({ length: 150 })
  email: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'mobile_number', length: 20, nullable: true })
  mobileNumber: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Index('idx_client_project')
  @Column({ name: 'project_id' })
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Index('idx_client_company')
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
