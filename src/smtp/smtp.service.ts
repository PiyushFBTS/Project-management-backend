import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import {
  SmtpConfig,
  SmtpEncryption,
} from '../database/entities/smtp-config.entity';
import { SaveSmtpConfigDto } from './dto/save-smtp-config.dto';

@Injectable()
export class SmtpService {
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(SmtpConfig)
    private readonly smtpRepo: Repository<SmtpConfig>,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'SMTP_ENCRYPTION_KEY',
      'default-key-change-me-32-chars!!',
    );
  }

  // ── Password encryption helpers ──────────────────────────────────────────

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encrypted: string): string {
    const [ivHex, data] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // ── List configs ───────────────────────────────────────────────────────────

  async getConfigs(companyId: number | null): Promise<SmtpConfig[]> {
    const where =
      companyId !== null ? { companyId } : { companyId: IsNull() as any };
    const configs = await this.smtpRepo.find({ where, order: { createdAt: 'ASC' } });
    return configs.map((c) => ({ ...c, password: '••••••••' }));
  }

  // ── Single config by ID ────────────────────────────────────────────────────

  async getConfigById(id: number): Promise<SmtpConfig> {
    const config = await this.smtpRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('SMTP configuration not found.');
    config.password = '••••••••';
    return config;
  }

  // ── Create new config ──────────────────────────────────────────────────────

  async createConfig(
    companyId: number | null,
    dto: SaveSmtpConfigDto,
  ): Promise<SmtpConfig> {
    const config = this.smtpRepo.create({
      companyId,
      label: dto.label ?? null,
      host: dto.host,
      port: dto.port,
      username: dto.username,
      password: this.encrypt(dto.password),
      fromEmail: dto.fromEmail,
      fromName: dto.fromName ?? null,
      encryption: dto.encryption ?? SmtpEncryption.TLS,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.smtpRepo.save(config);
    saved.password = '••••••••';
    return saved;
  }

  // ── Update existing config ─────────────────────────────────────────────────

  async updateConfig(
    configId: number,
    companyId: number | null,
    dto: SaveSmtpConfigDto,
  ): Promise<SmtpConfig> {
    const config = await this.smtpRepo.findOne({ where: { id: configId } });
    if (!config) throw new NotFoundException('SMTP configuration not found.');

    // Verify ownership
    if (companyId === null) {
      if (config.companyId !== null)
        throw new ForbiddenException('Config does not belong to global scope.');
    } else {
      if (config.companyId !== companyId)
        throw new ForbiddenException('Config does not belong to this company.');
    }

    config.label = dto.label ?? config.label;
    config.host = dto.host;
    config.port = dto.port;
    config.username = dto.username;
    config.fromEmail = dto.fromEmail;
    config.fromName = dto.fromName ?? config.fromName;
    config.encryption = dto.encryption ?? config.encryption;
    config.isActive = dto.isActive ?? config.isActive;

    if (dto.password !== '••••••••') {
      config.password = this.encrypt(dto.password);
    }

    const saved = await this.smtpRepo.save(config);
    saved.password = '••••••••';
    return saved;
  }

  // ── Delete config ──────────────────────────────────────────────────────────

  async deleteConfig(
    configId: number,
    companyId: number | null,
  ): Promise<{ message: string }> {
    const config = await this.smtpRepo.findOne({ where: { id: configId } });
    if (!config) throw new NotFoundException('SMTP configuration not found.');

    // Verify ownership
    if (companyId === null) {
      if (config.companyId !== null)
        throw new ForbiddenException('Config does not belong to global scope.');
    } else {
      if (config.companyId !== companyId)
        throw new ForbiddenException('Config does not belong to this company.');
    }

    await this.smtpRepo.remove(config);
    return { message: 'SMTP configuration deleted successfully' };
  }

  // ── Test email ─────────────────────────────────────────────────────────────

  async testSmtp(
    configId: number,
    recipientEmail: string,
  ): Promise<{ message: string }> {
    const config = await this.smtpRepo.findOne({ where: { id: configId } });
    if (!config)
      throw new NotFoundException('SMTP configuration not found.');

    const decryptedPassword = this.decrypt(config.password);

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.encryption === SmtpEncryption.SSL,
      auth: { user: config.username, pass: decryptedPassword },
      tls: { rejectUnauthorized: false },
    });

    try {
      await transporter.verify();
    } catch (err: any) {
      throw new NotFoundException(
        `SMTP connection failed: ${err.message || 'Unknown error'}. Check your host, port, username, and password.`,
      );
    }

    try {
      await transporter.sendMail({
        from: config.fromName
          ? `"${config.fromName}" <${config.fromEmail}>`
          : config.fromEmail,
        to: recipientEmail,
        subject: 'SMTP Configuration Test',
        html: '<h3>SMTP Test Successful</h3><p>Your SMTP configuration is working correctly.</p>',
      });
    } catch (err: any) {
      throw new NotFoundException(
        `Failed to send email: ${err.message || 'Unknown error'}`,
      );
    }

    return { message: 'Test email sent successfully' };
  }

  // ── Send email with optional attachments ──────────────────────────────────

  async sendEmail(
    configId: number,
    recipientEmail: string,
    subject: string,
    body: string,
    attachments?: Express.Multer.File[],
  ): Promise<{ message: string }> {
    const config = await this.smtpRepo.findOne({ where: { id: configId } });
    if (!config)
      throw new NotFoundException('SMTP configuration not found.');

    const decryptedPassword = this.decrypt(config.password);

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.encryption === SmtpEncryption.SSL,
      auth: { user: config.username, pass: decryptedPassword },
      tls: { rejectUnauthorized: false },
    });

    try {
      await transporter.verify();
    } catch (err: any) {
      throw new NotFoundException(
        `SMTP connection failed: ${err.message || 'Unknown error'}`,
      );
    }

    const mailAttachments = (attachments || []).map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    }));

    try {
      await transporter.sendMail({
        from: config.fromName
          ? `"${config.fromName}" <${config.fromEmail}>`
          : config.fromEmail,
        to: recipientEmail,
        subject,
        html: body,
        attachments: mailAttachments.length > 0 ? mailAttachments : undefined,
      });
    } catch (err: any) {
      throw new NotFoundException(
        `Failed to send email: ${err.message || 'Unknown error'}`,
      );
    }

    return { message: 'Email sent successfully' };
  }

  // ── Resolve transporter (company → global fallback) ──────────────────────

  async getTransporter(
    companyId: number,
  ): Promise<nodemailer.Transporter | null> {
    // Try company-specific active config first
    let config = await this.smtpRepo.findOne({
      where: { companyId, isActive: true },
    });
    if (!config) {
      // Fall back to global
      config = await this.smtpRepo.findOne({
        where: { companyId: IsNull() as any, isActive: true },
      });
    }
    if (!config) return null;

    const decryptedPassword = this.decrypt(config.password);
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.encryption === SmtpEncryption.SSL,
      auth: { user: config.username, pass: decryptedPassword },
      tls:
        config.encryption === SmtpEncryption.TLS
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }
}
