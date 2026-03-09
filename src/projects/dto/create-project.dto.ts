import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, ProjectType } from '../../database/entities/project.entity';

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

  @ApiProperty({ enum: ProjectType })
  @IsEnum(ProjectType)
  projectType: ProjectType;

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
}
