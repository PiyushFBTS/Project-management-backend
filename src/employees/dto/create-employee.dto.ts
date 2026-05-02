import {
  IsBoolean, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional,
  IsString, MaxLength, MinLength, IsPositive, ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsultantType } from '../../database/entities/employee.entity';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-010' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  empCode: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  empName: string;

  @ApiProperty({ enum: ConsultantType })
  @IsEnum(ConsultantType)
  consultantType: ConsultantType;

  @ApiProperty({ example: 'john@itpm.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '+91-9999999999' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  mobileNumber: string;

  @ApiPropertyOptional({ description: 'Assigned project ID' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  assignedProjectId?: number;

  @ApiPropertyOptional({ description: 'ID of the employee this person reports to (null to clear)' })
  @Type(() => Number)
  @IsInt({ each: false })
  @IsPositive()
  @ValidateIf((o) => o.reportsToId !== null && o.reportsToId !== undefined)
  @IsOptional()
  reportsToId?: number | null;

  @ApiPropertyOptional({ description: 'Whether this employee reports to an admin (true) or employee (false)' })
  @IsOptional()
  isReportToAdmin?: boolean;

  @ApiPropertyOptional({ description: 'ID of the admin this person reports to (null to clear)' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @ValidateIf((o) => o.reportsToAdminId !== null && o.reportsToAdminId !== undefined)
  @IsOptional()
  reportsToAdminId?: number | null;

  @ApiPropertyOptional({ description: 'Whether this employee is HR' })
  @IsOptional()
  isHr?: boolean;

  @ApiPropertyOptional({ description: 'Whether this employee has Accounts permission (can mark expenses paid)' })
  @IsOptional()
  isAccounts?: boolean;

  @ApiPropertyOptional({ example: '1995-06-15', description: 'Date of birth (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '2022-01-10', description: 'Date of joining (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional({ example: 7, description: 'Special permission: how many days back the employee can fill task sheets (null = default 3)' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  fillDaysOverride?: number | null;

  @ApiPropertyOptional({ example: 600000, description: 'Annual CTC (Cost to Company)' })
  @Type(() => Number)
  @IsOptional()
  annualCTC?: number | null;

  @ApiPropertyOptional({ example: 'O+', description: 'Blood group' })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 'Single', description: 'Marital status' })
  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @ApiPropertyOptional({ description: 'Whether the employee account is active (can log in)' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
