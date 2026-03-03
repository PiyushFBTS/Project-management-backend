import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SmtpService } from './smtp.service';
import { SaveSmtpConfigDto } from './dto/save-smtp-config.dto';
import { TestSmtpDto } from './dto/test-smtp.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { JwtAdminGuard } from '../auth/guards/jwt-admin.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Admin — SMTP')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard)
@Controller('admin/smtp')
export class SmtpAdminController {
  constructor(private readonly smtpService: SmtpService) {}

  @Get()
  @ApiOperation({ summary: "List own company's SMTP configurations" })
  getSmtpList(@TenantId() companyId: number) {
    return this.smtpService.getConfigs(companyId);
  }

  @Post()
  @ApiOperation({ summary: "Create new SMTP configuration for own company" })
  createSmtp(
    @TenantId() companyId: number,
    @Body() dto: SaveSmtpConfigDto,
  ) {
    return this.smtpService.createConfig(companyId, dto);
  }

  @Put(':smtpId')
  @ApiOperation({ summary: "Update own company's SMTP configuration" })
  updateSmtp(
    @TenantId() companyId: number,
    @Param('smtpId', ParseIntPipe) smtpId: number,
    @Body() dto: SaveSmtpConfigDto,
  ) {
    return this.smtpService.updateConfig(smtpId, companyId, dto);
  }

  @Delete(':smtpId')
  @ApiOperation({ summary: "Delete own company's SMTP configuration" })
  deleteSmtp(
    @TenantId() companyId: number,
    @Param('smtpId', ParseIntPipe) smtpId: number,
  ) {
    return this.smtpService.deleteConfig(smtpId, companyId);
  }

  @Post(':smtpId/test')
  @ApiOperation({ summary: "Test own company's SMTP configuration" })
  testSmtp(
    @Param('smtpId', ParseIntPipe) smtpId: number,
    @Body() dto: TestSmtpDto,
  ) {
    return this.smtpService.testSmtp(smtpId, dto.recipientEmail);
  }

  @Post(':smtpId/send')
  @ApiOperation({ summary: "Send email using own company's SMTP config" })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 5))
  sendEmail(
    @Param('smtpId', ParseIntPipe) smtpId: number,
    @Body() dto: SendEmailDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.smtpService.sendEmail(smtpId, dto.recipientEmail, dto.subject, dto.body, files);
  }
}
