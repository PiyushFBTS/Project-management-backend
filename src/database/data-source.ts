/**
 * TypeORM CLI Data Source
 * Used by: npm run migration:generate / migration:run / migration:revert
 *
 * This file is separate from the NestJS AppModule so the TypeORM CLI
 * can connect to the database without starting the full application.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load .env before accessing process.env
config();

import { Company } from './entities/company.entity';
import { AdminUser } from './entities/admin-user.entity';
import { Project } from './entities/project.entity';
import { TaskType } from './entities/task-type.entity';
import { Employee } from './entities/employee.entity';
import { DailyTaskSheet } from './entities/daily-task-sheet.entity';
import { TaskEntry } from './entities/task-entry.entity';
import { Notification } from './entities/notification.entity';
import { LeaveType } from './entities/leave-reason.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveRequestWatcher } from './entities/leave-request-watcher.entity';
import { SmtpConfig } from './entities/smtp-config.entity';
import { ProjectPhase } from './entities/project-phase.entity';
import { ProjectTask } from './entities/project-task.entity';
import { ProjectTaskComment } from './entities/project-task-comment.entity';
import { ProjectTaskHistory } from './entities/project-task-history.entity';
import { Country } from './entities/country.entity';
import { State } from './entities/state.entity';
import { City } from './entities/city.entity';
import { Currency } from './entities/currency.entity';
import { PostalCode } from './entities/postal-code.entity';
import { EmailLog } from './entities/email-log.entity';
import { TicketContributor } from './entities/ticket-contributor.entity';
import { ProjectDocument } from './entities/project-document.entity';
import { ClientUser } from './entities/client-user.entity';
import { TaskAttachment } from './entities/task-attachment.entity';
import { EmployeeDocument } from './entities/employee-document.entity';
import { EmployeeGoal } from './entities/employee-goal.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'it_project_management',
  entities: [Company, AdminUser, Project, TaskType, Employee, DailyTaskSheet, TaskEntry, Notification, LeaveType, LeaveRequest, LeaveRequestWatcher, SmtpConfig, ProjectPhase, ProjectTask, ProjectTaskComment, ProjectTaskHistory, Country, State, City, Currency, PostalCode, EmailLog, TicketContributor, ProjectDocument, ClientUser, TaskAttachment, EmployeeDocument, EmployeeGoal],
  migrations: [join(__dirname, 'migrations', '*.ts')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  charset: 'utf8mb4',
  timezone: '+00:00',
});
