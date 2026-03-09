import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectPlanningService } from './project-planning.service';
import { ProjectPlanningAdminController } from './project-planning-admin.controller';
import { ProjectPlanningEmployeeController } from './project-planning-employee.controller';
import { ProjectPlanningTicketsController } from './project-planning-tickets.controller';
import { ProjectPlanningAdminTicketsController } from './project-planning-admin-tickets.controller';
import { ProjectPhase } from '../database/entities/project-phase.entity';
import { ProjectTask } from '../database/entities/project-task.entity';
import { ProjectTaskComment } from '../database/entities/project-task-comment.entity';
import { ProjectTaskHistory } from '../database/entities/project-task-history.entity';
import { Project } from '../database/entities/project.entity';
import { Employee } from '../database/entities/employee.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectPhase, ProjectTask, ProjectTaskComment, ProjectTaskHistory, Project, Employee, AdminUser]),
    NotificationsModule,
  ],
  providers: [ProjectPlanningService],
  controllers: [ProjectPlanningAdminController, ProjectPlanningAdminTicketsController, ProjectPlanningEmployeeController, ProjectPlanningTicketsController],
  exports: [ProjectPlanningService],
})
export class ProjectPlanningModule {}
