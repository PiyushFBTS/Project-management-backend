import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum EmailStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500, nullable: true })
  subject: string | null;

  @Column({ type: 'longtext', nullable: true })
  body: string | null;

  @Column({ name: 'to_email', length: 255 })
  toEmail: string;

  @Column({ name: 'from_email', length: 255, nullable: true })
  fromEmail: string | null;

  @Column({ name: 'from_name', length: 255, nullable: true })
  fromName: string | null;

  @Column({ name: 'triggered_by', length: 100, nullable: true })
  triggeredBy: string | null;

  @Column({ type: 'enum', enum: EmailStatus, default: EmailStatus.SENT })
  status: EmailStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Index('IDX_email_logs_company')
  @Column({ name: 'company_id', nullable: true })
  companyId: number | null;

  @Column({ type: 'json', nullable: true })
  attachments: EmailAttachment[] | null;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}

export interface EmailAttachment {
  filename: string;
  path: string;   // relative to uploads/ e.g. "email-attachments/42/report.pdf"
  mimetype: string;
  size: number;   // bytes
}
