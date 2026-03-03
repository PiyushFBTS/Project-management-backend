import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Company } from './company.entity';
import { TaskEntry } from './task-entry.entity';

export enum TaskCategory {
  PROJECT_CUSTOMIZATION = 'project_customization',
  SUPPORT_CUSTOMIZATION = 'support_customization',
  CR = 'cr',
}

@Entity('task_types')
export class TaskType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'type_code', length: 50 })
  typeCode: string;

  @Column({ name: 'type_name', length: 150 })
  typeName: string;

  @Column({ type: 'enum', enum: TaskCategory })
  category: TaskCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Index('idx_tasktype_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.taskTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => TaskEntry, (entry) => entry.taskType)
  taskEntries: TaskEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
