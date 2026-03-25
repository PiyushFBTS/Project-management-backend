import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController, EmployeeProjectsController } from './projects.controller';
import { Project } from '../database/entities/project.entity';
import { Employee } from '../database/entities/employee.entity';
import { AdminUser } from '../database/entities/admin-user.entity';
import { ProjectDocument } from '../database/entities/project-document.entity';
import { ProjectMilestone } from '../database/entities/project-milestone.entity';
import { ProjectTypeEntity } from '../database/entities/project-type.entity';
import { ClientUser } from '../database/entities/client-user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Employee, AdminUser, ProjectDocument, ProjectMilestone, ProjectTypeEntity, ClientUser]), NotificationsModule],
  providers: [ProjectsService],
  controllers: [ProjectsController, EmployeeProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
