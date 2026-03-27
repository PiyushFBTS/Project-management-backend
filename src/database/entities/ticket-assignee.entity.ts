import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProjectTask } from './project-task.entity';

@Entity('ticket_assignees')
export class TicketAssignee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'task_id' })
  taskId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'user_type', type: 'enum', enum: ['employee', 'admin', 'client'], default: 'employee' })
  userType: 'employee' | 'admin' | 'client';

  @Column({ name: 'company_id' })
  companyId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ProjectTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: ProjectTask;
}
