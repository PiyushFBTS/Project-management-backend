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

export enum AuthorType {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

@Entity('project_task_comments')
export class ProjectTaskComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_comment_task')
  @Column({ name: 'task_id' })
  taskId: number;

  @ManyToOne(() => ProjectTask, (t) => t.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: ProjectTask;

  @Column({ name: 'author_id' })
  authorId: number;

  @Column({ name: 'author_type', type: 'enum', enum: AuthorType })
  authorType: AuthorType;

  @Column({ type: 'text' })
  content: string;

  @Index('idx_comment_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
