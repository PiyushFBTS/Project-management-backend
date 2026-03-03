import { IsEmail } from 'class-validator';

export class TestSmtpDto {
  @IsEmail()
  recipientEmail: string;
}
