import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from '../database/entities/announcement.entity';
import { AnnouncementsAdminController, AnnouncementsEmployeeController } from './announcements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement])],
  controllers: [AnnouncementsAdminController, AnnouncementsEmployeeController],
})
export class AnnouncementsModule {}
