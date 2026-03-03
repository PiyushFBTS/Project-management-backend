import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from './company.entity';

export enum SmtpEncryption {
  TLS = 'tls',
  SSL = 'ssl',
  NONE = 'none',
}

@Entity('smtp_configs')
export class SmtpConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'company_id', nullable: true })
  companyId: number | null;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 255, nullable: true })
  label: string | null;

  @Column({ length: 255 })
  host: string;

  @Column({ type: 'int', default: 587 })
  port: number;

  @Column({ length: 255 })
  username: string;

  @Column({ length: 500 })
  password: string;

  @Column({ name: 'from_email', length: 255 })
  fromEmail: string;

  @Column({ name: 'from_name', length: 255, nullable: true })
  fromName: string | null;

  @Column({
    type: 'enum',
    enum: SmtpEncryption,
    default: SmtpEncryption.TLS,
  })
  encryption: SmtpEncryption;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
