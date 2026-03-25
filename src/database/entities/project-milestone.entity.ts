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
import { Project } from './project.entity';
import { Company } from './company.entity';

@Entity('project_milestones')
export class ProjectMilestone {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_milestone_project')
  @Column({ name: 'project_id' })
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'name', length: 300 })
  name: string;

  @Column({ name: 'expected_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  expectedPercentage: number;

  @Column({ name: 'expected_amount', type: 'decimal', precision: 12, scale: 2 })
  expectedAmount: number;

  @Column({ name: 'received_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  receivedPercentage: number;

  @Column({ name: 'received_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  receivedAmount: number;

  @Index('idx_milestone_company')
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
