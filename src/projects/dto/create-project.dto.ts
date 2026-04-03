import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../../database/entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({ example: 'PRJ-002' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  projectCode: string;

  @ApiProperty({ example: 'CRM Implementation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  projectName: string;

  @ApiProperty({ example: 'development' })
  @IsString()
  @IsNotEmpty()
  projectType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  clientName?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Employee ID of the project manager, or null to clear' })
  @ValidateIf((o) => o.projectManagerId !== null)
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  projectManagerId?: number | null;
}
