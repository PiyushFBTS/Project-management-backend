import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmtpConfig } from '../database/entities/smtp-config.entity';
import { SmtpService } from './smtp.service';
import { SmtpPlatformController } from './smtp-platform.controller';
import { SmtpAdminController } from './smtp-admin.controller';
import { EmailLogsModule } from '../email-logs/email-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([SmtpConfig]), EmailLogsModule],
  providers: [SmtpService],
  controllers: [SmtpPlatformController, SmtpAdminController],
  exports: [SmtpService],
})
export class SmtpModule {}
