import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  /// Announcement is visible until the end of this date (inclusive).
  @Index('idx_announcement_expires')
  @Column({ name: 'expires_on', type: 'date' })
  expiresOn: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by_id' })
  createdById: number;

  @Column({ name: 'created_by_type', type: 'enum', enum: ['admin', 'employee'] })
  createdByType: 'admin' | 'employee';

  @Column({ name: 'created_by_name', length: 150 })
  createdByName: string;

  @Index('idx_announcement_company')
  @Column({ name: 'company_id' })
  companyId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
