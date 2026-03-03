import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, ProjectTaskStatus } from '../../database/entities/project-task.entity';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login page' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  phaseId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  assigneeId?: number;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: ProjectTaskStatus, default: ProjectTaskStatus.TODO })
  @IsEnum(ProjectTaskStatus)
  @IsOptional()
  status?: ProjectTaskStatus;

  @ApiPropertyOptional({ example: '2024-04-15' })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: 8.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;
}
