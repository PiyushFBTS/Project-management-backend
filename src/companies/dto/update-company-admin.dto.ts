import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Super-admin facing: update any field on a company's admin user. All fields
 * are optional — only the ones provided are applied. `password`, if present,
 * is re-hashed; leave it out to keep the current password.
 */
export class UpdateCompanyAdminDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsEmail()
  @MaxLength(150)
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
