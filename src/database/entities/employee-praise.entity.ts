import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('employee_praises')
export class EmployeePraise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ name: 'praise_type', length: 50 })
  praiseType: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'given_by_id' })
  givenById: number;

  @Column({ name: 'given_by_type', type: 'enum', enum: ['admin', 'employee'], default: 'admin' })
  givenByType: 'admin' | 'employee';

  @Column({ name: 'given_by_name', length: 200 })
  givenByName: string;

  @Column({ name: 'company_id' })
  companyId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
