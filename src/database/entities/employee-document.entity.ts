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

export enum EmployeeDocCategory {
  AADHAAR = 'aadhaar',
  PAN = 'pan',
  JOINING = 'joining',
  EXIT = 'exit',
  OTHER = 'other',
}

@Entity('employee_documents')
export class EmployeeDocument {
  @PrimaryGeneratedColumn()
  id: number;

  /** 'employee' or 'admin' */
  @Column({ name: 'user_type', length: 20 })
  userType: string;

  /** ID in the corresponding table (employees.id or admin_users.id) */
  @Index('idx_empdoc_user')
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'file_name', length: 300 })
  fileName: string;

  @Column({ name: 'original_name', length: 500 })
  originalName: string;

  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({ name: 'file_size', type: 'int' })
  fileSize: number;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ type: 'enum', enum: EmployeeDocCategory, default: EmployeeDocCategory.OTHER })
  category: EmployeeDocCategory;

  @Column({ name: 'uploaded_by_name', length: 200 })
  uploadedByName: string;

  @Index('idx_empdoc_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
