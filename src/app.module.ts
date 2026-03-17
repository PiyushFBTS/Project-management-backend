import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { databaseConfig } from './config/database.config';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { LicenseGuard } from './common/guards/license.guard';
import { Company } from './database/entities/company.entity';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TaskTypesModule } from './task-types/task-types.module';
import { EmployeesModule } from './employees/employees.module';
import { DailyTaskSheetsModule } from './daily-task-sheets/daily-task-sheets.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { EmployeeModule } from './employee/employee.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CompaniesModule } from './companies/companies.module';
import { LeaveTypesModule } from './leave-reasons/leave-reasons.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { SmtpModule } from './smtp/smtp.module';
import { EmailLogsModule } from './email-logs/email-logs.module';
import { ProjectPlanningModule } from './project-planning/project-planning.module';
import { LocationModule } from './location/location.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Company entity needed by LicenseGuard (globally provided)
    TypeOrmModule.forFeature([Company]),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        throttlers: [
          {
            ttl: cs.get<number>('THROTTLE_TTL', 60000),
            limit: cs.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    AuthModule,
    CompaniesModule,
    ProjectsModule,
    TaskTypesModule,
    EmployeesModule,
    DailyTaskSheetsModule,
    DashboardModule,
    ReportsModule,
    EmployeeModule,
    NotificationsModule,
    LeaveTypesModule,
    LeaveRequestsModule,
    SmtpModule,
    EmailLogsModule,
    ProjectPlanningModule,
    LocationModule,
  ],
  providers: [
    // Sets request.tenantId from the authenticated user's companyId
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    // Enforces company license (active + not expired) on every request
    { provide: APP_GUARD, useClass: LicenseGuard },
  ],
})
export class AppModule {}
