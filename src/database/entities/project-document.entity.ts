import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Company } from './company.entity';
import { Project } from './project.entity';

export enum DocumentCategory {
  PROJECT_PLAN = 'project_plan',
  FRD = 'frd',
  COMMERCIAL = 'commercial',
  OTHER = 'other',
}

@Entity('project_documents')
export class ProjectDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_doc_project')
  @Column({ name: 'project_id' })
  projectId: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ length: 300 })
  fileName: string;

  @Column({ name: 'original_name', length: 500 })
  originalName: string;

  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ type: 'enum', enum: DocumentCategory, default: DocumentCategory.OTHER })
  category: DocumentCategory;

  @Column({ name: 'uploaded_by_name', length: 200 })
  uploadedByName: string;

  @Index('idx_doc_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
