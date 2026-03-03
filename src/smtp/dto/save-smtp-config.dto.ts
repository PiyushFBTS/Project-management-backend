import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsEmail,
  IsBoolean,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { SmtpEncryption } from '../../database/entities/smtp-config.entity';

export class SaveSmtpConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @IsString()
  @MaxLength(255)
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  @MaxLength(255)
  username: string;

  @IsString()
  @MaxLength(500)
  password: string;

  @IsEmail()
  @MaxLength(255)
  fromEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromName?: string;

  @IsOptional()
  @IsEnum(SmtpEncryption)
  encryption?: SmtpEncryption;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
