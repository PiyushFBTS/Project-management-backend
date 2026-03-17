import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLog } from '../database/entities/email-log.entity';
import { EmailLogsService } from './email-logs.service';
import { EmailLogsAdminController } from './email-logs-admin.controller';
import { EmailLogsPlatformController } from './email-logs-platform.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmailLog])],
  providers: [EmailLogsService],
  controllers: [EmailLogsAdminController, EmailLogsPlatformController],
  exports: [EmailLogsService],
})
export class EmailLogsModule {}
