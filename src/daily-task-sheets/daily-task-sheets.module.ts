import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyTaskSheetsService } from './daily-task-sheets.service';
import {
  AdminTaskSheetsController,
  DailyTaskSheetsController,
} from './daily-task-sheets.controller';
import { DailyTaskSheet } from '../database/entities/daily-task-sheet.entity';
import { TaskEntry } from '../database/entities/task-entry.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyTaskSheet, TaskEntry]), NotificationsModule],
  providers: [DailyTaskSheetsService],
  controllers: [DailyTaskSheetsController, AdminTaskSheetsController],
  exports: [DailyTaskSheetsService],
})
export class DailyTaskSheetsModule {}
