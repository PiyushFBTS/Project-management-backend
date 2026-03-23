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
import { ProjectTask } from './project-task.entity';

@Entity('task_attachments')
export class TaskAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_tattach_task')
  @Column({ name: 'task_id' })
  taskId: number;

  @ManyToOne(() => ProjectTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: ProjectTask;

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

  @Column({ name: 'uploaded_by_name', length: 200 })
  uploadedByName: string;

  @Index('idx_tattach_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
