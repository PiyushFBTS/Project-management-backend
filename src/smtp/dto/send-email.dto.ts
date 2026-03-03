import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  recipientEmail: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  recipientName?: string;
}
