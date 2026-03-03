import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyAdminDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
