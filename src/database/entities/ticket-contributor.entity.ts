import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Company } from './company.entity';
import { ProjectTask } from './project-task.entity';
import { Employee } from './employee.entity';

@Entity('ticket_contributors')
@Unique('uq_contributor', ['taskId', 'employeeId'])
export class TicketContributor {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_contributor_task')
  @Column({ name: 'task_id' })
  taskId: number;

  @ManyToOne(() => ProjectTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: ProjectTask;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Index('idx_contributor_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
