import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('employee_pips')
export class EmployeePip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'improvement_areas', type: 'text' })
  improvementAreas: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ type: 'text', nullable: true })
  goals: string | null;

  @Column({ type: 'enum', enum: ['active', 'extended', 'completed', 'terminated'], default: 'active' })
  status: 'active' | 'extended' | 'completed' | 'terminated';

  @Column({ type: 'text', nullable: true })
  outcome: string | null;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes: string | null;

  @Column({ name: 'initiated_by_id' })
  initiatedById: number;

  @Column({ name: 'initiated_by_type', type: 'enum', enum: ['admin', 'employee'], default: 'admin' })
  initiatedByType: 'admin' | 'employee';

  @Column({ name: 'initiated_by_name', length: 200 })
  initiatedByName: string;

  @Column({ name: 'company_id' })
  companyId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
