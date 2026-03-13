import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Company } from '../database/entities/company.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { Project } from '../database/entities/project.entity';
import { TaskType } from '../database/entities/task-type.entity';
import { Employee } from '../database/entities/employee.entity';
import { DailyTaskSheet } from '../database/entities/daily-task-sheet.entity';
import { TaskEntry } from '../database/entities/task-entry.entity';
import { Notification } from '../database/entities/notification.entity';
import { LeaveType } from '../database/entities/leave-reason.entity';
import { LeaveRequest } from '../database/entities/leave-request.entity';
import { LeaveRequestWatcher } from '../database/entities/leave-request-watcher.entity';
import { SmtpConfig } from '../database/entities/smtp-config.entity';
import { ProjectPhase } from '../database/entities/project-phase.entity';
import { ProjectTask } from '../database/entities/project-task.entity';
import { ProjectTaskComment } from '../database/entities/project-task-comment.entity';
import { ProjectTaskHistory } from '../database/entities/project-task-history.entity';
import { Country } from '../database/entities/country.entity';
import { State } from '../database/entities/state.entity';
import { City } from '../database/entities/city.entity';
import { Currency } from '../database/entities/currency.entity';
import { PostalCode } from '../database/entities/postal-code.entity';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.get<string>('DB_USERNAME', 'root'),
  password: configService.get<string>('DB_PASSWORD', ''),
  database: configService.get<string>('DB_DATABASE', 'it_project_management'),
  entities: [Company, AdminUser, Project, TaskType, Employee, DailyTaskSheet, TaskEntry, Notification, LeaveType, LeaveRequest, LeaveRequestWatcher, SmtpConfig, ProjectPhase, ProjectTask, ProjectTaskComment, ProjectTaskHistory, Country, State, City, Currency, PostalCode],
  // NEVER set synchronize: true in production — use migrations instead
  synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
  logging: configService.get<string>('DB_LOGGING') === 'true',
  charset: 'utf8mb4',
  timezone: '+00:00',
  extra: {
    connectionLimit: 10,
  },
});
