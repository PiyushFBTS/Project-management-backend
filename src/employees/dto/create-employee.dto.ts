import {
  IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional,
  IsString, MaxLength, MinLength, IsPositive,
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

  @ApiPropertyOptional({ description: 'ID of the employee this person reports to' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  reportsToId?: number;

  @ApiPropertyOptional({ description: 'Whether this employee is HR' })
  @IsOptional()
  isHr?: boolean;

  @ApiPropertyOptional({ example: '1995-06-15', description: 'Date of birth (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '2022-01-10', description: 'Date of joining (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  joiningDate?: string;
}
