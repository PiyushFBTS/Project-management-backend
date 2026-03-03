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
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@ApiTags('Platform — SMTP')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAdminGuard, SuperAdminGuard)
@Controller('platform')
export class SmtpPlatformController {
  constructor(private readonly smtpService: SmtpService) {}

  // ── Global SMTP — list & create ─────────────────────────────────────────

  @Get('smtp')
  @ApiOperation({ summary: 'List all global/platform SMTP configurations' })
  getGlobalSmtpList() {
    return this.smtpService.getConfigs(null);
  }

  @Post('smtp')
  @ApiOperation({ summary: 'Create new global SMTP configuration' })
  createGlobalSmtp(@Body() dto: SaveSmtpConfigDto) {
    return this.smtpService.createConfig(null, dto);
  }

  // ── Global SMTP — single config ops ─────────────────────────────────────

  @Put('smtp/:smtpId')
  @ApiOperation({ summary: 'Update a global SMTP configuration' })
  updateGlobalSmtp(
    @Param('smtpId', ParseIntPipe) smtpId: number,
    @Body() dto: SaveSmtpConfigDto,
  ) {
    return this.smtpService.updateConfig(smtpId, null, dto);
  }

  @Delete('smtp/:smtpId')
  @ApiOperation({ summary: 'Delete a global SMTP configuration' })
  deleteGlobalSmtp(@Param('smtpId', ParseIntPipe) smtpId: number) {
    return this.smtpService.deleteConfig(smtpId, null);
  }

  @Post('smtp/:smtpId/test')
  @ApiOperation({ summary: 'Send test email using a global SMTP config' })
  testGlobalSmtp(
    @Param('smtpId', ParseIntPipe) smtpId: number,
    @Body() dto: TestSmtpDto,
  ) {
    return this.smtpService.testSmtp(smtpId, dto.recipientEmail);
  }

  @Post('smtp/:smtpId/send')
  @ApiOperation({ summary: 'Send email using a global SMTP config' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 5))
  sendGlobalEmail(
    @Param('smtpId', ParseIntPipe) smtpId: number,
    @Body() dto: SendEmailDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.smtpService.sendEmail(smtpId, dto.recipientEmail, dto.subject, dto.body, files);
  }

  // ── Per-company SMTP — list & create ────────────────────────────────────

  @Get('companies/:id/smtp')
  @ApiOperation({ summary: "List a company's SMTP configurations" })
  getCompanySmtpList(@Param('id', ParseIntPipe) id: number) {
    return this.smtpService.getConfigs(id);
  }

  @Post('companies/:id/smtp')
  @ApiOperation({ summary: "Create new SMTP configuration for a company" })
  createCompanySmtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveSmtpConfigDto,
  ) {
    return this.smtpService.createConfig(id, dto);
  }

  // ── Per-company SMTP — single config ops ────────────────────────────────

  @Put('companies/:id/smtp/:smtpId')
  @ApiOperation({ summary: "Update a company's SMTP configuration" })
  updateCompanySmtp(
    @Param('id', ParseIntPipe) id: number,
    @Param('smtpId', ParseIntPipe) smtpId: number,
    @Body() dto: SaveSmtpConfigDto,
  ) {
    return this.smtpService.updateConfig(smtpId, id, dto);
  }

  @Delete('companies/:id/smtp/:smtpId')
  @ApiOperation({ summary: "Delete a company's SMTP configuration" })
  deleteCompanySmtp(
    @Param('id', ParseIntPipe) id: number,
    @Param('smtpId', ParseIntPipe) smtpId: number,
  ) {
    return this.smtpService.deleteConfig(smtpId, id);
  }

  @Post('companies/:id/smtp/:smtpId/test')
  @ApiOperation({ summary: "Test a company's SMTP configuration" })
  testCompanySmtp(
    @Param('id', ParseIntPipe) id: number,
    @Param('smtpId', ParseIntPipe) smtpId: number,
    @Body() dto: TestSmtpDto,
  ) {
    return this.smtpService.testSmtp(smtpId, dto.recipientEmail);
  }

  @Post('companies/:id/smtp/:smtpId/send')
  @ApiOperation({ summary: "Send email using a company's SMTP config" })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 5))
  sendCompanyEmail(
    @Param('id', ParseIntPipe) id: number,
    @Param('smtpId', ParseIntPipe) smtpId: number,
    @Body() dto: SendEmailDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.smtpService.sendEmail(smtpId, dto.recipientEmail, dto.subject, dto.body, files);
  }
}
